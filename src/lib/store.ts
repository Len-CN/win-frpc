import { load } from "@tauri-apps/plugin-store";
import { DEFAULT_APP_CONFIG, type AppConfig } from "../types/frpc";

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
  return val ?? DEFAULT_APP_CONFIG;
}
