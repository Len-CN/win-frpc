# Win-FRPC

![Platform](https://img.shields.io/badge/Platform-Windows-blue)
![Tech Stack](https://img.shields.io/badge/Tech-Tauri_v2_%2B_React_19-orange)

一个基于 **Tauri v2 + React 19 + TypeScript** 构建的现代化 FRPC (Fast Reverse Proxy Client) Windows 图形界面客户端。

---

## ⚠️ 重要提示

**本软件不包含 FRPC 核心程序，无法直接运行！**

出于版权和灵活性考虑，你需要手动下载官方的 `frpc.exe` 并放置在指定目录。

### 安装与运行

1. **下载本软件**：从 [Releases](../../releases) 页面下载最新的 `win-frpc.exe` (绿色版) 或安装包。
2. **下载 FRPC 核心**：
   前往 [fatedier/frp](https://github.com/fatedier/frp/releases) 下载适用于 Windows 的版本（通常是 `frp_x.x.x_windows_amd64.zip`）。
3. **放置文件**：
   解压下载的 frp 压缩包，找到 `frpc.exe` 文件。
   - **绿色版**：在 `win-frpc.exe` 同级目录下新建 `bin` 文件夹，将 `frpc.exe` 放入其中。
   - **安装版**：打开安装目录，在主程序旁边新建 `bin` 文件夹并放入 `frpc.exe`。

**目录结构示例：**
```
win-frpc/
├── win-frpc.exe
└── bin/
    └── frpc.exe
```

---

## 功能特性

- **现代化 UI**：基于 Framer Motion 的丝滑动画，Windows 11 Mica/Acrylic 背景效果。
- **多隧道管理**：可视化配置 TCP、UDP、HTTP、HTTPS 隧道。
- **智能状态监控**：自动检测连接状态（连接中 / 运行中 / 已停止），异常自动回退。
- **启动前校验**：端口格式、必填域名等配置项实时校验，输入框下方直接提示错误。
- **实时日志**：内置带颜色高亮的日志查看器，时间戳固定在写入时刻，支持自动滚动。
- **配置持久化**：自动保存服务器信息和隧道配置，下次打开即用。
- **多语言支持**：简体中文 / English 一键切换。
- **便捷操作**：点击绿色地址自动复制到剪贴板。

---

## 项目结构

```
src/
├── App.tsx                          # 应用壳层（tab 路由 + hook 组合）
├── hooks/
│   ├── useAppConfig.ts              # 配置加载/保存/语言切换
│   └── useFrpcService.ts            # FRPC 启停/日志监听/状态机
├── components/
│   ├── TitleBar.tsx                  # 自定义标题栏
│   ├── status/StatusView.tsx         # 状态页（日志 + 代理列表）
│   ├── config/ConfigView.tsx         # 配置页（服务器 + 隧道编辑）
│   └── ui/                          # 通用 UI 组件
├── lib/
│   ├── store.ts                     # Tauri Store 持久化
│   ├── utils.ts                     # 工具函数
│   └── validation.ts                # 配置校验（启动校验 + 实时字段校验）
├── types/
│   └── frpc.ts                      # 共享类型定义
└── i18n.ts                          # 国际化配置

src-tauri/
├── src/main.rs                      # Rust 后端（进程管理 + 日志转发）
├── Cargo.toml
└── tauri.conf.json
```

---

## 本地开发

### 环境要求

- Node.js >= 18
- Rust (最新稳定版，通过 [rustup](https://rustup.rs) 安装)
- Windows Build Tools (C++ 生成工具)

### 构建步骤

```bash
# 1. 克隆仓库
git clone https://github.com/Len-CN/win-frpc.git
cd win-frpc

# 2. 安装前端依赖
npm install

# 3. 放置开发用的 frpc.exe
#    在 src-tauri/bin/ 目录下放入 frpc.exe（目录不存在请手动创建）

# 4. 启动开发模式
npm run tauri dev

# 5. 打包发布
npm run tauri build
```

---

## 许可证

本项目开源，FRPC 核心程序遵循其原作者 [fatedier/frp](https://github.com/fatedier/frp) 的开源协议。
