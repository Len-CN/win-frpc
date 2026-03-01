import { memo, useEffect, useMemo, useRef, useState, type MouseEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Square, Link as LinkIcon, Copy, Check, Loader2 } from "lucide-react";
import { writeText } from "@tauri-apps/plugin-clipboard-manager";
import Ansi from "ansi-to-react";
import type { TFunction } from "i18next";
import { Button } from "../ui/button";
import { cn } from "../../lib/utils";
import type { AppStatus, LogEntry, ProxyItem } from "../../types/frpc";

interface StatusViewProps {
  status: AppStatus;
  logs: LogEntry[];
  isBusy: boolean;
  onToggle: () => void;
  t: TFunction;
  proxies: ProxyItem[];
  serverAddr: string;
}

function CopyableText({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: MouseEvent) => {
    e.stopPropagation();
    try {
      await writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <div
      onClick={(e) => {
        void handleCopy(e);
      }}
      className="flex items-center justify-end gap-2 cursor-pointer group hover:opacity-80 transition-opacity select-none"
      title="Click to copy"
    >
      <div className="text-sm font-mono text-green-400 font-bold">{text}</div>
      <div className="text-gray-500 group-hover:text-white transition-colors">
        {copied ? <Check size={14} className="text-green-500" /> : <Copy size={12} />}
      </div>
    </div>
  );
}

export const StatusView = memo(function StatusView({
  status,
  logs,
  isBusy,
  onToggle,
  t,
  proxies,
  serverAddr,
}: StatusViewProps) {
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    requestAnimationFrame(() => {
      logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
    });
  }, [logs]);

  const statusConfig = useMemo(
    () => ({
      stopped: {
        color: "bg-red-500",
        borderColor: "border-white/10",
        bgColor: "bg-white/5",
        shadow: "",
        text: t("stopped"),
        subText: t("ready"),
        icon: <Play fill="currentColor" className="ml-1" size={24} />,
        btnColor: "bg-blue-600 hover:bg-blue-500 shadow-blue-600/30",
      },
      connecting: {
        color: "bg-yellow-500",
        borderColor: "border-yellow-500/30",
        bgColor: "bg-yellow-500/10",
        shadow: "shadow-yellow-500/5",
        text: t("connecting"),
        subText: t("waiting"),
        icon: <Loader2 className="animate-spin" size={24} />,
        btnColor: "bg-yellow-600 hover:bg-yellow-500 shadow-yellow-600/30",
      },
      running: {
        color: "bg-green-500",
        borderColor: "border-green-500/30",
        bgColor: "bg-green-500/10",
        shadow: "shadow-green-500/5",
        text: t("running"),
        subText: t("connected"),
        icon: <Square fill="currentColor" size={20} />,
        btnColor: "bg-red-500 hover:bg-red-600 shadow-red-500/30",
      },
    }),
    [t],
  );

  const current = statusConfig[status];
  const toggleDisabled = isBusy || status === "connecting";

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="h-full flex flex-col gap-4 overflow-hidden"
    >
      <div
        className={cn(
          "p-6 rounded-3xl flex items-center justify-between transition-all duration-500 border backdrop-blur-md shadow-lg",
          current.borderColor,
          current.bgColor,
          current.shadow,
        )}
      >
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight text-white">{current.text}</h2>
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <div
              className={cn(
                "w-2 h-2 rounded-full transition-all duration-500",
                current.color,
                status === "running" && "shadow-[0_0_8px_#22c55e]",
              )}
            />
            {current.subText}
          </div>
        </div>
        <Button
          size="lg"
          onClick={onToggle}
          disabled={toggleDisabled}
          className={cn(
            "h-14 w-14 rounded-full p-0 transition-all duration-300 hover:scale-105 active:scale-95 shadow-xl border border-white/10",
            current.btnColor,
          )}
        >
          {isBusy ? <Loader2 className="animate-spin" size={24} /> : current.icon}
        </Button>
      </div>

      <AnimatePresence>
        {status === "running" && proxies.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="grid grid-cols-1 gap-2 overflow-hidden"
          >
            {proxies.map((proxy) => (
              <div
                key={proxy.id}
                className="bg-black/20 border border-white/5 p-3 rounded-xl flex items-center justify-between hover:bg-white/5 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="bg-blue-500/10 text-blue-400 p-2 rounded-lg group-hover:bg-blue-500/20 transition-colors">
                    <LinkIcon size={16} />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-gray-200">{proxy.name}</div>
                    <div className="text-[10px] text-gray-500 uppercase font-mono">{proxy.type}</div>
                  </div>
                </div>
                <div className="text-right">
                  <CopyableText
                    text={
                      ["http", "https"].includes(proxy.type)
                        ? proxy.custom_domains ?? ""
                        : `${serverAddr}:${proxy.remote_port ?? ""}`
                    }
                  />
                  <div className="text-[10px] text-gray-600">{t("remote_addr")}</div>
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 bg-black/40 rounded-2xl border border-white/10 p-0 overflow-hidden flex flex-col backdrop-blur-md shadow-inner min-h-0">
        <div className="flex justify-between items-center px-4 py-2 border-b border-white/5 bg-white/5">
          <div className="text-[10px] font-bold opacity-50 uppercase tracking-wider flex items-center gap-2">
            <div
              className={cn(
                "w-1.5 h-1.5 rounded-full animate-pulse",
                status === "running"
                  ? "bg-green-500"
                  : status === "connecting"
                    ? "bg-yellow-500"
                    : "bg-gray-500",
              )}
            />
            {t("logs")}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto font-mono text-xs space-y-0.5 p-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
          {logs.length === 0 && (
            <div className="text-gray-600 italic text-center mt-4 text-[10px]">
              {status === "connecting" ? t("waiting") : "Waiting for logs..."}
            </div>
          )}
          {logs.map((log, index) => (
            <div
              key={`${log.timestamp}-${index}`}
              className={cn(
                "break-all pl-2 border-l-2 py-0.5 hover:bg-white/5 transition-colors rounded-r",
                log.level === "error" ? "border-red-500 bg-red-500/5" : "border-transparent",
              )}
            >
              <span className="opacity-30 mr-2 text-[10px] text-gray-400 select-none">[{log.timestamp}]</span>
              <span className="text-gray-300">
                <Ansi>{log.msg}</Ansi>
              </span>
            </div>
          ))}
          <div ref={logsEndRef} />
        </div>
      </div>
    </motion.div>
  );
});
