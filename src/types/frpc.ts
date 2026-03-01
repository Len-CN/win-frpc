export type AppStatus = "stopped" | "connecting" | "running";

export interface ProxyItem {
  id: string;
  name: string;
  type: "tcp" | "udp" | "http" | "https";
  local_ip: string;
  local_port: string;
  remote_port?: string;
  custom_domains?: string;
}

export interface LogEntry {
  msg: string;
  level: string;
  timestamp: string;
}

export interface LogEventPayload {
  msg?: string;
  level?: string;
}

export interface AppConfig {
  language: "en" | "zh";
  serverAddr: string;
  serverPort: string;
  token: string;
  proxies: ProxyItem[];
}

export const DEFAULT_APP_CONFIG: AppConfig = {
  language: "zh",
  serverAddr: "127.0.0.1",
  serverPort: "7000",
  token: "",
  proxies: [],
};

export interface StartFrpcInput {
  serverAddr: string;
  serverPort: string;
  token: string;
  proxies: ProxyItem[];
}
