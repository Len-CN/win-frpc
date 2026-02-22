# Win-FRPC

![Platform](https://img.shields.io/badge/Platform-Windows-blue)
![Tech Stack](https://img.shields.io/badge/Tech-Tauri_v2_%2B_React-orange)
![AI Generated](https://img.shields.io/badge/Code_by-AI_(Gemini)-8A2BE2)

一个基于 **Tauri v2 + React** 构建的现代化 FRPC (Fast Reverse Proxy Client) Windows 图形界面客户端。

> **🤖 声明 / Disclaimer**
>
> 本项目的所有代码逻辑、UI 设计及架构决策均由 **人工智能 (Google Gemini)** 辅助编写完成。
> This project's code, UI design, and architecture were entirely generated with the assistance of AI.

---

## ⚠️ 重要提示 / Important Note

**本软件不包含 FRPC 核心程序，无法直接运行！**
**This software does not contain the FRPC core binary and cannot run directly!**

出于版权和灵活性考虑，你需要手动下载官方的 `frpc.exe` 并放置在指定目录。

### 🛠️ 如何安装与运行

1. **下载本软件**：从 [Releases](../../releases) 页面下载最新的 `win-frpc.exe` (绿色版) 或安装包。
2. **下载 FRPC 核心**：
   前往 [fatedier/frp](https://github.com/fatedier/frp/releases) 下载适用于 Windows 的版本（通常是 `frp_x.x.x_windows_amd64.zip`）。
3. **放置文件**：
   解压下载的 frp 压缩包，找到 `frpc.exe` 文件。
   * **如果你使用的是绿色版**：在 `win-frpc.exe` 同级目录下新建一个 `bin` 文件夹，将 `frpc.exe` 放入其中。
   * **如果你使用的是安装版**：安装完成后，打开安装目录（通常在 `AppData` 或 `Program Files`），在主程序旁边新建 `bin` 文件夹并放入 `frpc.exe`。

**目录结构示例：**
```text
📂 win-frpc/
├── 📄 win-frpc.exe  (本软件)
└── 📂 bin/
    └── ⚙️ frpc.exe  (官方核心程序，必须叫这个名字)
```
---

## ✨ 功能特性

*   **现代化 UI**：基于 Framer Motion 的丝滑动画，支持暗色模式风格。
*   **多隧道管理**：支持可视化的 TCP, UDP, HTTP, HTTPS 隧道配置。
*   **智能状态监控**：
    *   🟡 **连接中**：自动重连机制。
    *   🟢 **运行中**：连接成功。
    *   🔴 **已停止**：错误或手动停止。
*   **实时日志**：内置带颜色高亮的日志查看器，支持自动滚动。
*   **配置持久化**：自动保存服务器信息和隧道配置，下次打开即用。
*   **多语言支持**：支持 简体中文 / English 一键切换。
*   **便捷操作**：点击绿色地址即可自动复制到剪贴板。

---

## 💻 本地开发构建

如果你想修改源码或自己编译：

### 环境要求
*   Node.js (建议 v18+)
*   Rust (最新稳定版)
*   Windows Build Tools (C++ 生成工具)

### 构建步骤

1.  **克隆仓库**
    ```bash
    git clone https://github.com/你的用户名/win-frpc.git
    cd win-frpc
    ```

2.  **安装依赖**
    ```bash
    npm install
    ```

3.  **放置开发用的 frpc.exe**
    在 `src-tauri/bin/` 目录下放入 `frpc.exe`（如果目录不存在请手动创建）。

4.  **启动开发模式**
    ```bash
    npm run tauri dev
    ```

5.  **打包发布**
    ```bash
    npm run tauri build
    ```

---

## 📄 许可证

本项目开源，具体的 FRPC 核心程序遵循其原作者的开源协议。
