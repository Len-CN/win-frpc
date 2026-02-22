// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{Manager, Emitter};
use window_vibrancy::{apply_mica, apply_acrylic};
// use window_shadows::set_shadow; // 暂时注释掉以避免依赖冲突
use std::process::{Command, Stdio};
use std::sync::{Arc, Mutex};
use std::io::{BufRead, BufReader};
use std::thread;
use std::os::windows::process::CommandExt;

// 状态管理结构体
struct FrpState {
    child: Option<std::process::Child>,
}

#[derive(Clone, serde::Serialize)]
struct LogPayload {
    msg: String,
    level: String,
}

// 启动 FRPC
#[tauri::command]
async fn start_frpc(
    config_content: String, 
    state: tauri::State<'_, Arc<Mutex<FrpState>>>,
    app: tauri::AppHandle
) -> Result<String, String> {
    let mut state_guard = state.lock().unwrap();
    
    if state_guard.child.is_some() {
        return Err("FRPC 正在运行中".into());
    }

    // --- 关键修改：使用系统临时目录，避免触发 Tauri 热重载 ---
    let mut config_path_buf = std::env::temp_dir();
    config_path_buf.push("frpc_temp.ini");
    let config_path = config_path_buf.to_string_lossy().to_string();

    // 写入配置文件到临时目录
    if let Err(e) = std::fs::write(&config_path, config_content) {
        return Err(format!("无法写入配置文件: {}", e));
    }

    // CREATE_NO_WINDOW = 0x08000000，防止弹出黑框
    const CREATE_NO_WINDOW: u32 = 0x08000000;

    // 启动子进程
    // 注意：请确保 bin/frpc.exe 存在于 src-tauri/bin/ 目录下
    let mut child = Command::new("bin/frpc.exe")
        .arg("-c")
        .arg(&config_path) // 传入临时配置文件的路径
        .creation_flags(CREATE_NO_WINDOW) 
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|e| format!("启动失败 (请检查 bin/frpc.exe 是否存在): {}", e))?;

    // 处理标准输出 (stdout)
    let stdout = child.stdout.take().unwrap();
    let app_handle = app.clone();
    
    thread::spawn(move || {
        let reader = BufReader::new(stdout);
        for line_result in reader.lines() {
            if let Ok(line) = line_result {
                let _ = app_handle.emit("log", LogPayload { msg: line, level: "info".into() });
            }
        }
    });

    // 处理标准错误 (stderr)
    let stderr = child.stderr.take().unwrap();
    let app_handle_err = app.clone();
    thread::spawn(move || {
        let reader = BufReader::new(stderr);
        for line_result in reader.lines() {
            if let Ok(line) = line_result {
                let _ = app_handle_err.emit("log", LogPayload { msg: line, level: "error".into() });
            }
        }
    });

    state_guard.child = Some(child);
    Ok("已启动".into())
}

// 停止 FRPC
#[tauri::command]
async fn stop_frpc(state: tauri::State<'_, Arc<Mutex<FrpState>>>) -> Result<String, String> {
    let mut state_guard = state.lock().unwrap();
    if let Some(mut child) = state_guard.child.take() {
        let _ = child.kill();
    }
    Ok("已停止".into())
}

fn main() {
    let state = Arc::new(Mutex::new(FrpState { child: None }));
    
    tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::default().build()) // 注册存储插件
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_opener::init()) // 注册打开器插件
        .plugin(tauri_plugin_shell::init())  // 注册 Shell 插件
        .manage(state)
        .setup(|app| {
            let window = app.get_webview_window("main").unwrap();
            
            // 应用 Windows 11 Mica 效果
            #[cfg(target_os = "windows")]
            {
                // 尝试 Mica，失败则 Acrylic
                if let Err(_) = apply_mica(&window, Some(true)) {
                     let _ = apply_acrylic(&window, Some((18, 18, 18, 125)));
                }
                // set_shadow 暂时注释，避免依赖冲突
                // let _ = set_shadow(&window, true);
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![start_frpc, stop_frpc])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
