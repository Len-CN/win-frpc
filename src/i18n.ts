import i18n from "i18next";
import { initReactI18next } from "react-i18next";

const resources = {
  en: {
    translation: {
      status: "Status",
      config: "Config",
      settings: "Settings",
      server_addr: "Server Address",
      server_port: "Server Port",
      token: "Auth Token (Optional)",
      tunnels: "Tunnels",
      add_tunnel: "Add Tunnel",
      name: "Name",
      type: "Type",
      local_port: "Local Port",
      remote_port: "Remote Port",
      custom_domain: "Custom Domain",
      start: "START SERVER",
      stop: "STOP SERVER",
      running: "Service Active",
      stopped: "Service Inactive",
      connecting: "Connecting...", // <--- 新增
      waiting: "Waiting for server...", // <--- 新增
      connected: "Connected to server",
      ready: "Ready to connect",
      logs: "System Logs",
      no_tunnels: "No tunnels configured", // <--- 新增
      language: "Language",
      save: "Save Configuration",
      remote_addr: "Remote Address", // <--- 顺便把这个也加上
      err_required: "Required",
      err_invalid_port: "Invalid port (1-65535)",
      err_domain_required: "Domain is required for HTTP/HTTPS"
    }
  },
  zh: {
    translation: {
      status: "状态概览",
      config: "配置管理",
      settings: "通用设置",
      server_addr: "服务器地址",
      server_port: "服务器端口",
      token: "连接令牌 (Token)",
      tunnels: "穿透隧道",
      add_tunnel: "添加隧道",
      name: "名称",
      type: "类型",
      local_port: "本地端口",
      remote_port: "远程端口",
      custom_domain: "自定义域名",
      start: "启动服务",
      stop: "停止服务",
      running: "服务运行中",
      stopped: "服务已停止",
      connecting: "正在连接...", // <--- 新增
      waiting: "等待服务器响应...", // <--- 新增
      connected: "已连接到服务器",
      ready: "等待连接",
      no_tunnels: "暂无隧道配置",
      logs: "系统日志",
      language: "界面语言",
      save: "保存配置",
      remote_addr: "远程访问地址", // <--- 顺便把这个也加上
      err_required: "必填项",
      err_invalid_port: "端口无效 (1-65535)",
      err_domain_required: "HTTP/HTTPS 需要填写域名"
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: "en", 
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
