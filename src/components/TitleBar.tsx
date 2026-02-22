import { getCurrentWindow } from "@tauri-apps/api/window";
import { Minus, Square, X } from "lucide-react";

export function TitleBar() {
  const appWindow = getCurrentWindow();

  return (
    // 关键点 1: data-tauri-drag-region 属性必须在最外层 div 上
    // 关键点 2: z-index 必须足够高 (z-50)
    <div data-tauri-drag-region className="h-10 flex justify-between items-center px-4 bg-black/10 backdrop-blur-sm fixed top-0 left-0 right-0 z-50 border-b border-white/5 select-none">
      
      {/* 左侧标题 (添加 pointer-events-none 防止阻挡拖拽) */}
      <div className="flex items-center gap-2 pointer-events-none opacity-80">
        <div className="w-3 h-3 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
        <span className="text-xs font-bold tracking-widest text-white">NEON FRPC</span>
      </div>

      {/* 右侧按钮区 (必须没有 data-tauri-drag-region，否则无法点击) */}
      <div className="flex gap-2 text-white">
        <button 
          onClick={() => appWindow.minimize()} 
          className="p-1.5 hover:bg-white/10 rounded-md transition-colors"
        >
          <Minus size={14} strokeWidth={3} />
        </button>
        <button 
          onClick={() => appWindow.toggleMaximize()} 
          className="p-1.5 hover:bg-white/10 rounded-md transition-colors"
        >
          <Square size={12} strokeWidth={3} />
        </button>
        <button 
          onClick={() => appWindow.close()} 
          className="p-1.5 hover:bg-red-500 hover:text-white rounded-md transition-colors"
        >
          <X size={14} strokeWidth={3} />
        </button>
      </div>
    </div>
  );
}
