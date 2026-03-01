import { useCallback, useEffect, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import ini from "ini";
import { validateStartInput } from "../lib/validation";
import type { AppStatus, LogEntry, LogEventPayload, StartFrpcInput } from "../types/frpc";

interface UseFrpcServiceResult {
  status: AppStatus;
  logs: LogEntry[];
  isBusy: boolean;
  start: (input: StartFrpcInput) => Promise<void>;
  stop: () => Promise<void>;
}

type IniSection = Record<string, string | number | boolean | undefined>;

function toErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  return JSON.stringify(error);
}

function normalizeStartError(message: string): string {
  const lower = message.toLowerCase();

  if (lower.includes("cannot find the file") || lower.includes("not found")) {
    return "Start failed: frpc executable not found. Please place frpc.exe in the expected bin directory.";
  }

  return `Start Failed: ${message}`;
}

export function useFrpcService(): UseFrpcServiceResult {
  const [status, setStatus] = useState<AppStatus>("stopped");
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isBusy, setIsBusy] = useState(false);
  const busyRef = useRef(false);

  const appendLog = useCallback((msg: string, level = "info") => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [...prev, { msg, level, timestamp }].slice(-200));
  }, []);

  // Bug fix: only match frpc's own fatal error patterns, not any message containing "error"
  useEffect(() => {
    let unlisten: (() => void) | null = null;

    void listen<LogEventPayload>("log", (event) => {
      const msg = typeof event.payload?.msg === "string" ? event.payload.msg : "";
      const level = typeof event.payload?.level === "string" ? event.payload.level : "info";

      if (!msg) {
        return;
      }

      appendLog(msg, level);

      if (msg.includes("login to server success")) {
        setStatus("running");
      } else if (msg.includes("try to connect to server")) {
        setStatus("connecting");
      } else if (msg.includes("port already used") || msg.includes("proxy exit with error")) {
        setStatus("stopped");
        void invoke("stop_frpc").catch(() => undefined);
      }
    })
      .then((off) => {
        unlisten = off;
      })
      .catch((error) => {
        appendLog(`Log listener failed: ${toErrorMessage(error)}`, "error");
      });

    return () => {
      unlisten?.();
    };
  }, [appendLog]);

  const setBusy = useCallback((value: boolean) => {
    busyRef.current = value;
    setIsBusy(value);
  }, []);

  const stop = useCallback(async () => {
    if (busyRef.current) {
      return;
    }

    setBusy(true);
    try {
      await invoke("stop_frpc");
      setStatus("stopped");
      appendLog("--- Service Stopped ---", "info");
    } catch (error) {
      setStatus("stopped");
      appendLog(`Stop Failed: ${toErrorMessage(error)}`, "error");
    } finally {
      setBusy(false);
    }
  }, [appendLog, setBusy]);

  const start = useCallback(
    async (input: StartFrpcInput) => {
      if (busyRef.current) {
        return;
      }

      setBusy(true);

      try {
        try {
          await invoke("stop_frpc");
        } catch {
          // Ignore pre-stop errors when service is not running.
        }

        const validationErrors = validateStartInput({
          serverAddr: input.serverAddr,
          serverPort: input.serverPort,
          proxies: input.proxies,
        });
        if (validationErrors.length > 0) {
          validationErrors.forEach((item) => {
            appendLog(item.message, "error");
          });
          return;
        }

        const config: Record<string, IniSection> = {
          common: {
            server_addr: input.serverAddr,
            server_port: input.serverPort,
            token: input.token || undefined,
            login_fail_exit: false,
          },
        };

        input.proxies.forEach((proxy) => {
          const sectionName = proxy.name.trim() || `service_${proxy.id}`;
          config[sectionName] = {
            type: proxy.type,
            local_ip: proxy.local_ip,
            local_port: proxy.local_port,
            remote_port: proxy.remote_port || undefined,
            custom_domains: proxy.custom_domains || undefined,
          };
        });

        const iniStr = ini.stringify(config);
        await invoke("start_frpc", { configContent: iniStr });
        setStatus("connecting");
        appendLog("--- Service Starting ---", "info");
      } catch (error) {
        appendLog(normalizeStartError(toErrorMessage(error)), "error");
        setStatus("stopped");
      } finally {
        setBusy(false);
      }
    },
    [appendLog, setBusy],
  );

  return { status, logs, isBusy, start, stop };
}
