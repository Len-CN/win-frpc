import type { ProxyItem } from "../types/frpc";

export interface ValidationError {
  index: number;
  field: string;
  message: string;
}

export interface StartValidationInput {
  serverAddr: string;
  serverPort: string;
  proxies: ProxyItem[];
}

function isValidPort(port: string): boolean {
  if (!/^\d+$/.test(port)) {
    return false;
  }

  const value = Number(port);
  return value >= 1 && value <= 65535;
}

export function validateProxiesForStart(proxies: ProxyItem[]): ValidationError[] {
  const errors: ValidationError[] = [];

  proxies.forEach((proxy, index) => {
    if (!isValidPort(proxy.local_port)) {
      errors.push({
        index,
        field: "local_port",
        message: `Tunnel ${proxy.name || index + 1}: local_port is invalid`,
      });
    }

    if (proxy.type === "tcp" || proxy.type === "udp") {
      if (!proxy.remote_port || !isValidPort(proxy.remote_port)) {
        errors.push({
          index,
          field: "remote_port",
          message: `Tunnel ${proxy.name || index + 1}: remote_port is invalid`,
        });
      }
    }

    if ((proxy.type === "http" || proxy.type === "https") && !proxy.custom_domains?.trim()) {
      errors.push({
        index,
        field: "custom_domains",
        message: `Tunnel ${proxy.name || index + 1}: custom domain is required`,
      });
    }
  });

  return errors;
}

export function validateStartInput(input: StartValidationInput): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!input.serverAddr.trim()) {
    errors.push({
      index: -1,
      field: "server_addr",
      message: "Server address is required",
    });
  }

  if (!isValidPort(input.serverPort)) {
    errors.push({
      index: -1,
      field: "server_port",
      message: "Server port is invalid (must be 1-65535)",
    });
  }

  return [...errors, ...validateProxiesForStart(input.proxies)];
}

// --- Real-time field-level validation (for UI hints) ---

export interface ServerFieldErrors {
  serverAddr?: string;
  serverPort?: string;
}

export interface ProxyFieldErrors {
  local_port?: string;
  remote_port?: string;
  custom_domains?: string;
}

export interface ConfigFieldErrors {
  server: ServerFieldErrors;
  proxies: Record<number, ProxyFieldErrors>;
}

export function validateConfigFields(
  serverAddr: string,
  serverPort: string,
  proxies: ProxyItem[],
): ConfigFieldErrors {
  const server: ServerFieldErrors = {};

  if (!serverAddr.trim()) {
    server.serverAddr = "err_required";
  }

  if (serverPort.trim() && !isValidPort(serverPort)) {
    server.serverPort = "err_invalid_port";
  }

  const proxyErrors: Record<number, ProxyFieldErrors> = {};

  proxies.forEach((proxy, index) => {
    const entry: ProxyFieldErrors = {};

    if (proxy.local_port.trim() && !isValidPort(proxy.local_port)) {
      entry.local_port = "err_invalid_port";
    }

    if (proxy.type === "tcp" || proxy.type === "udp") {
      if (proxy.remote_port && proxy.remote_port.trim() && !isValidPort(proxy.remote_port)) {
        entry.remote_port = "err_invalid_port";
      }
    }

    if (
      (proxy.type === "http" || proxy.type === "https") &&
      proxy.custom_domains !== undefined &&
      proxy.custom_domains.trim() === "" &&
      proxy.local_port.trim() !== ""
    ) {
      entry.custom_domains = "err_domain_required";
    }

    if (Object.keys(entry).length > 0) {
      proxyErrors[index] = entry;
    }
  });

  return { server, proxies: proxyErrors };
}
