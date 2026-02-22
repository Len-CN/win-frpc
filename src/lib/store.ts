import { load } from "@tauri-apps/plugin-store";

export interface AppConfig {
  language: "en" | "zh";
  serverAddr: string;
  serverPort: string;
  token: string;
  proxies: any[];
}

// 初始化 Store
// 注意这里：load 函数必须正确闭合
const store = await load("config.json", {
  autoSave: true,
  defaults: {} // 这里是为了满足类型检查
}); // <--- 之前可能漏掉了这个 });

export async function saveConfig(config: AppConfig) {
  await store.set("app_config", config);
  await store.save();
}

export async function loadConfig(): Promise<AppConfig> {
  const val = await store.get<AppConfig>("app_config");
  if (val) {
    return val;
  } else {
    // 默认配置
    return {
      language: "zh",
      serverAddr: "127.0.0.1",
      serverPort: "7000",
      token: "",
      proxies: []
    };
  }
}
