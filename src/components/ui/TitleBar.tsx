import { getCurrentWindow } from "@tauri-apps/api/window";
import { X, Minus, Square, Copy } from "lucide-react"; // 引入 Copy 图标作为还原图标的替代
import { useState, useEffect } from "react";

export function TitleBar() {
  const [isMaximized, setIsMaximized] = useState(false);

  // 初始化时检查窗口状态
  useEffect(() => {
    const checkMaximized = async () => {
      const max = await getCurrentWindow().isMaximized();
      setIsMaximized(max);
    };
    checkMaximized();
    
    // 监听窗口尺寸变化事件（可选，为了简单起见，这里只在点击按钮时更新状态）
  }, []);

  const minimize = () => getCurrentWindow().minimize();
  
  const toggleMaximize = async () => {
    const win = getCurrentWindow();
    const max = await win.isMaximized();
    if (max) {
      await win.unmaximize();
      setIsMaximized(false);
    } else {
      await win.maximize();
      setIsMaximized(true);
    }
  };
  
  const close = () => getCurrentWindow().close();

  return (
    <div data-tauri-drag-region className="h-10 bg-transparent flex justify-end items-center fixed top-0 left-0 right-0 z-50 select-none">
      <div className="flex h-full">
        <button onClick={minimize} className="w-12 h-full flex items-center justify-center hover:bg-white/10 text-white transition-colors">
          <Minus size={16} />
        </button>
        <button onClick={toggleMaximize} className="w-12 h-full flex items-center justify-center hover:bg-white/10 text-white transition-colors">
          {/* 这里使用了 isMaximized 变量，解决了报错 */}
          {isMaximized ? <Copy size={14} className="rotate-180" /> : <Square size={14} />}
        </button>
        <button onClick={close} className="w-12 h-full flex items-center justify-center hover:bg-red-500 text-white transition-colors rounded-tr-xl">
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
