import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { writeText } from "@tauri-apps/plugin-clipboard-manager"; 
import { Play, Square, Settings, Activity, Plus, Trash2, Server, Globe, Shield, Languages, Link as LinkIcon, Copy, Check, Loader2 } from "lucide-react";
import ini from "ini";
import { useTranslation } from "react-i18next";
import Ansi from "ansi-to-react"; 
import { TitleBar } from "./components/TitleBar";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { cn } from "./lib/utils";
import { loadConfig, saveConfig, type AppConfig } from "./lib/store";

// --- 类型定义 ---
interface ProxyItem {
  id: string;
  name: string;
  type: "tcp" | "udp" | "http" | "https";
  local_ip: string;
  local_port: string;
  remote_port?: string;
  custom_domains?: string;
}

// 定义三种状态
type AppStatus = "stopped" | "connecting" | "running";

export default function App() {
  const { t, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState<"status" | "config">("status");
  
  const [status, setStatus] = useState<AppStatus>("stopped");
  
  const [logs, setLogs] = useState<{msg: string, level: string}[]>([]);
  
  // 配置状态
  const [serverAddr, setServerAddr] = useState("127.0.0.1");
  const [serverPort, setServerPort] = useState("7000");
  const [token, setToken] = useState("");
  const [proxies, setProxies] = useState<ProxyItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // 1. 初始化
  useEffect(() => {
    loadConfig().then((config) => {
      setServerAddr(config.serverAddr);
      setServerPort(config.serverPort);
      setToken(config.token);
      setProxies(config.proxies);
      if (config.language) i18n.changeLanguage(config.language);
      setIsLoaded(true);
    });
  }, []);

  // 2. 自动保存
  useEffect(() => {
    if (!isLoaded) return;
    const timer = setTimeout(() => {
      const config: AppConfig = {
        language: i18n.language as "en" | "zh",
        serverAddr, serverPort, token, proxies
      };
      saveConfig(config);
    }, 1000);
    return () => clearTimeout(timer);
  }, [serverAddr, serverPort, token, proxies, i18n.language, isLoaded]);

  // 3. 监听日志 & 智能状态切换
  useEffect(() => {
    const unlisten = listen("log", (event: any) => {
      const msg = event.payload.msg;
      const level = event.payload.level;
      
      setLogs((prev) => [...prev, { msg, level }].slice(-200));

      // --- 状态自动机逻辑 ---
      if (msg.includes("login to server success")) {
        setStatus("running");
      }
      else if (msg.includes("try to connect to server")) {
        setStatus("connecting");
      }
      else if (msg.includes("port already used")) {
        setStatus("stopped");
        invoke("stop_frpc").catch(() => {}); 
      }
    });
    return () => { unlisten.then((f) => f()); };
  }, []);

  // 启动逻辑
  const handleStart = async () => {
    try { await invoke("stop_frpc"); } catch (e) {}

    const config: any = {
      common: { 
        server_addr: serverAddr, 
        server_port: serverPort, 
        token: token || undefined,
        login_fail_exit: false 
      }
    };
    
    proxies.forEach(p => {
      const sectionName = p.name.trim() || `service_${p.id}`;
      config[sectionName] = {
        type: p.type,
        local_ip: p.local_ip,
        local_port: p.local_port,
        remote_port: p.remote_port || undefined,
        custom_domains: p.custom_domains || undefined
      };
    });

    try {
      const iniStr = ini.stringify(config);
      await invoke("start_frpc", { configContent: iniStr });
      
      setStatus("connecting");
      setLogs(prev => [...prev, { msg: "--- Service Starting ---", level: "info" }]);
    } catch (err: any) {
      setLogs(prev => [...prev, { msg: `Start Failed: ${err}`, level: "error" }]);
      setStatus("stopped");
    }
  };

  const handleStop = async () => {
    await invoke("stop_frpc");
    setStatus("stopped");
    setLogs(prev => [...prev, { msg: "--- Service Stopped ---", level: "info" }]);
  };

  const toggleLanguage = () => {
    const newLang = i18n.language === "en" ? "zh" : "en";
    i18n.changeLanguage(newLang);
    if (isLoaded) {
        saveConfig({
            language: newLang as "en" | "zh",
            serverAddr, serverPort, token, proxies
        });
    }
  };

  if (!isLoaded) return null;

  return (
    <div className="h-screen w-screen flex flex-col pt-10 text-white selection:bg-blue-500/30 font-sans bg-transparent">
      <TitleBar />
      
      <div className="flex-1 flex overflow-hidden">
        {/* 侧边栏 */}
        <div className="w-20 flex flex-col items-center py-6 gap-4 bg-black/20 border-r border-white/5 backdrop-blur-md justify-between z-10">
           <div className="flex flex-col gap-4 w-full items-center">
             <NavBtn icon={Activity} label={t("status")} active={activeTab === "status"} onClick={() => setActiveTab("status")} />
             <NavBtn icon={Settings} label={t("config")} active={activeTab === "config"} onClick={() => setActiveTab("config")} />
           </div>
           
           <div className="mb-4">
             <button onClick={toggleLanguage} className="p-3 rounded-xl hover:bg-white/10 text-gray-400 hover:text-white transition-colors flex flex-col items-center gap-1 group">
               <Languages size={20} className="group-hover:text-blue-400 transition-colors" />
               <span className="text-[10px] font-bold">{i18n.language === "en" ? "EN" : "中"}</span>
             </button>
           </div>
        </div>

        {/* 主内容区 */}
        <div className="flex-1 relative p-6 overflow-hidden flex flex-col">
          <AnimatePresence mode="wait">
            {activeTab === "status" ? (
              <StatusView 
                key="status" 
                t={t} 
                status={status} 
                logs={logs} 
                proxies={proxies} 
                serverAddr={serverAddr}
                onToggle={status === "stopped" ? handleStart : handleStop} 
              />
            ) : (
              <ConfigView 
                key="config" t={t}
                serverAddr={serverAddr} setServerAddr={setServerAddr}
                serverPort={serverPort} setServerPort={setServerPort}
                token={token} setToken={setToken}
                proxies={proxies} setProxies={setProxies}
              />
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

// --- 组件 ---
function CopyableText({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };
  return (
    <div onClick={handleCopy} className="flex items-center justify-end gap-2 cursor-pointer group hover:opacity-80 transition-opacity select-none" title="Click to copy">
      <div className="text-sm font-mono text-green-400 font-bold">{text}</div>
      <div className="text-gray-500 group-hover:text-white transition-colors">
        {copied ? <Check size={14} className="text-green-500" /> : <Copy size={12} />}
      </div>
    </div>
  );
}

function NavBtn({ icon: Icon, active, onClick, label }: any) {
  return (
    <button onClick={onClick} className={cn("relative flex flex-col items-center justify-center gap-1 group w-14 h-16 rounded-xl transition-all duration-300", active ? "bg-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.4)] text-white scale-105" : "hover:bg-white/10 text-gray-400 hover:text-white")}>
      <div className="flex items-center justify-center h-6"><Icon size={24} strokeWidth={active ? 2.5 : 2} /></div>
      <span className="text-[10px] font-medium truncate w-full text-center opacity-80 leading-none mt-1">{label}</span>
      {active && <motion.div layoutId="active-dot" className="absolute -right-3 top-0 bottom-0 my-auto w-1 h-6 bg-blue-400 rounded-l-full shadow-[0_0_8px_rgba(96,165,250,0.8)]" transition={{ type: "spring", stiffness: 300, damping: 30 }} />}
    </button>
  );
}

function StatusView({ status, logs, onToggle, t, proxies, serverAddr }: { status: AppStatus, logs: any[], onToggle: any, t: any, proxies: any[], serverAddr: string }) {
  const logsEndRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => { 
    requestAnimationFrame(() => {
        logsEndRef.current?.scrollIntoView({ behavior: "smooth" }); 
    });
  }, [logs]);

  const statusConfig = {
    stopped: {
      color: "bg-red-500",
      borderColor: "border-white/10",
      bgColor: "bg-white/5",
      shadow: "",
      text: t("stopped"),
      subText: t("ready"),
      icon: <Play fill="currentColor" className="ml-1" size={24}/>,
      btnColor: "bg-blue-600 hover:bg-blue-500 shadow-blue-600/30"
    },
    connecting: {
      color: "bg-yellow-500",
      borderColor: "border-yellow-500/30",
      bgColor: "bg-yellow-500/10",
      shadow: "shadow-yellow-500/5",
      text: t("connecting"),
      subText: t("waiting"),
      icon: <Loader2 className="animate-spin" size={24}/>,
      btnColor: "bg-yellow-600 hover:bg-yellow-500 shadow-yellow-600/30"
    },
    running: {
      color: "bg-green-500",
      borderColor: "border-green-500/30",
      bgColor: "bg-green-500/10",
      shadow: "shadow-green-500/5",
      text: t("running"),
      subText: t("connected"),
      icon: <Square fill="currentColor" size={20}/>,
      btnColor: "bg-red-500 hover:bg-red-600 shadow-red-500/30"
    }
  };

  const current = statusConfig[status];

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
      className="h-full flex flex-col gap-4 overflow-hidden"
    >
      <div className={cn(
        "p-6 rounded-3xl flex items-center justify-between transition-all duration-500 border backdrop-blur-md shadow-lg",
        current.borderColor, current.bgColor, current.shadow
      )}>
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight text-white">{current.text}</h2>
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <div className={cn("w-2 h-2 rounded-full transition-all duration-500", current.color, status === "running" && "shadow-[0_0_8px_#22c55e]")} />
            {current.subText}
          </div>
        </div>
        <Button 
          size="lg"
          onClick={onToggle}
          className={cn(
            "h-14 w-14 rounded-full p-0 transition-all duration-300 hover:scale-105 active:scale-95 shadow-xl border border-white/10",
            current.btnColor
          )}
        >
          {current.icon}
        </Button>
      </div>

      <AnimatePresence>
        {status === "running" && proxies.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
            className="grid grid-cols-1 gap-2 overflow-hidden"
          >
             {proxies.map((p: any) => (
               <div key={p.id} className="bg-black/20 border border-white/5 p-3 rounded-xl flex items-center justify-between hover:bg-white/5 transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-500/10 text-blue-400 p-2 rounded-lg group-hover:bg-blue-500/20 transition-colors">
                      <LinkIcon size={16} />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-gray-200">{p.name}</div>
                      <div className="text-[10px] text-gray-500 uppercase font-mono">{p.type}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <CopyableText 
                      text={['http', 'https'].includes(p.type) ? p.custom_domains : `${serverAddr}:${p.remote_port}`} 
                    />
                    <div className="text-[10px] text-gray-600">{t("remote_addr")}</div>
                  </div>
               </div>
             ))}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 bg-black/40 rounded-2xl border border-white/10 p-0 overflow-hidden flex flex-col backdrop-blur-md shadow-inner min-h-0">
        <div className="flex justify-between items-center px-4 py-2 border-b border-white/5 bg-white/5">
          <div className="text-[10px] font-bold opacity-50 uppercase tracking-wider flex items-center gap-2">
            <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse", status === "running" ? "bg-green-500" : status === "connecting" ? "bg-yellow-500" : "bg-gray-500")}></div>
            {t("logs")}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto font-mono text-xs space-y-0.5 p-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
          {logs.length === 0 && <div className="text-gray-600 italic text-center mt-4 text-[10px]">Waiting for logs...</div>}
          {logs.map((log: any, i: number) => (
            <div key={i} className={cn("break-all pl-2 border-l-2 py-0.5 hover:bg-white/5 transition-colors rounded-r", log.level === 'error' ? "border-red-500 bg-red-500/5" : "border-transparent")}>
              <span className="opacity-30 mr-2 text-[10px] text-gray-400 select-none">[{new Date().toLocaleTimeString()}]</span>
              <span className="text-gray-300">
                <Ansi>{log.msg}</Ansi>
              </span>
            </div>
          ))}
          <div ref={logsEndRef} />
        </div>
      </div>
    </motion.div>
  );
}

function ConfigView({ serverAddr, setServerAddr, serverPort, setServerPort, token, setToken, proxies, setProxies, t }: any) {
  const addProxy = () => {
    const id = Math.random().toString(36).substr(2, 9);
    setProxies([...proxies, { id, name: `service_${proxies.length+1}`, type: "tcp", local_ip: "127.0.0.1", local_port: "80", remote_port: "" }]);
  };

  const updateProxy = (index: number, field: string, value: string) => {
    const newP = [...proxies];
    (newP[index] as any)[field] = value;
    setProxies(newP);
  };

  const removeProxy = (index: number) => {
    const newP = [...proxies];
    newP.splice(index, 1);
    setProxies(newP);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }} 
      animate={{ opacity: 1, x: 0 }} 
      exit={{ opacity: 0, x: -20 }}
      className="h-full flex flex-col gap-4 overflow-hidden" // 关键修改：容器本身不滚动，overflow-hidden
    >
      {/* 顶部服务器配置卡片 - 固定不动 */}
      <div className="bg-white/5 border border-white/10 p-6 rounded-2xl backdrop-blur-sm shadow-lg shrink-0">
        <div className="flex items-center gap-2 mb-6 text-blue-400 border-b border-white/5 pb-2">
          <Server size={18} />
          <h3 className="font-bold text-sm uppercase tracking-wider">{t("settings")}</h3>
        </div>
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-8">
            <Label>{t("server_addr")}</Label>
            <Input value={serverAddr} onChange={(e) => setServerAddr(e.target.value)} placeholder="0.0.0.0" className="bg-black/20 focus:bg-black/40" />
          </div>
          <div className="col-span-4">
            <Label>{t("server_port")}</Label>
            <Input value={serverPort} onChange={(e) => setServerPort(e.target.value)} placeholder="7000" className="bg-black/20 focus:bg-black/40" />
          </div>
          <div className="col-span-12">
            <Label>{t("token")}</Label>
            <div className="relative group">
              <Shield className="absolute left-3 top-2.5 h-4 w-4 text-gray-500 group-focus-within:text-blue-500 transition-colors" />
              <Input className="pl-9 bg-black/20 focus:bg-black/40" type="password" value={token} onChange={(e) => setToken(e.target.value)} placeholder="..." />
            </div>
          </div>
        </div>
      </div>

      {/* 隧道列表区域 - 独立滚动 */}
      <div className="flex-1 flex flex-col min-h-0"> {/* min-h-0 是 flex 嵌套滚动的关键 */}
        <div className="flex justify-between items-center mb-4 sticky top-0 z-10 py-2 bg-transparent backdrop-blur-md rounded-lg px-2 -mx-2 shrink-0">
          <div className="flex items-center gap-2 text-blue-400">
            <Globe size={18} />
            <h3 className="font-bold text-sm uppercase tracking-wider">{t("tunnels")}</h3>
            <span className="bg-blue-500/20 text-blue-300 text-[10px] px-1.5 py-0.5 rounded-full font-mono">{proxies.length}</span>
          </div>
          <Button onClick={addProxy} size="sm" variant="ghost" className="border border-white/10 hover:bg-blue-500/10 hover:text-blue-400 hover:border-blue-500/30 transition-all">
            <Plus size={16} className="mr-1" /> {t("add_tunnel")}
          </Button>
        </div>
        
        {/* 滚动区域 */}
        <div className="flex-1 overflow-y-auto pr-2 pb-10 scrollbar-thin scrollbar-thumb-white/10">
          <div className="flex flex-col gap-4">
            <AnimatePresence mode="popLayout" initial={false}>
              {proxies.map((proxy: ProxyItem, idx: number) => (
                <motion.div 
                  key={proxy.id}
                  layout // 开启布局动画
                  initial={{ opacity: 0, y: 20 }} 
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ 
                    layout: { type: "spring", stiffness: 300, damping: 30 } 
                  }}
                  className="bg-white/5 border border-white/10 p-5 rounded-xl relative group hover:border-blue-500/40 hover:bg-white/10 transition-colors shadow-sm hover:shadow-lg shrink-0"
                >
                  <button 
                    onClick={() => removeProxy(idx)}
                    className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 hover:bg-red-500/10 p-1.5 rounded-lg transition-all"
                    title="Delete Tunnel"
                  >
                    <Trash2 size={16} />
                  </button>

                  <div className="grid grid-cols-12 gap-4 items-end">
                    <div className="col-span-3">
                      <Label>{t("name")}</Label>
                      <Input value={proxy.name} onChange={(e) => updateProxy(idx, 'name', e.target.value)} className="bg-black/20 focus:bg-black/40" />
                    </div>
                    <div className="col-span-2">
                       <Label>{t("type")}</Label>
                       <div className="relative">
                         <select 
                           className="w-full h-10 bg-black/20 border border-white/10 rounded-md px-3 text-xs font-mono outline-none focus:border-blue-500 appearance-none text-white cursor-pointer hover:bg-black/30 transition-colors"
                           value={proxy.type}
                           onChange={(e) => updateProxy(idx, 'type', e.target.value)}
                         >
                           <option value="tcp">TCP</option>
                           <option value="udp">UDP</option>
                           <option value="http">HTTP</option>
                           <option value="https">HTTPS</option>
                         </select>
                       </div>
                    </div>
                    <div className="col-span-3">
                      <Label>{t("local_port")}</Label>
                      <Input value={proxy.local_port} onChange={(e) => updateProxy(idx, 'local_port', e.target.value)} className="bg-black/20 focus:bg-black/40 font-mono" />
                    </div>
                    <div className="col-span-4">
                      <Label>{['http', 'https'].includes(proxy.type) ? t("custom_domain") : t("remote_port")}</Label>
                      <Input 
                        value={['http', 'https'].includes(proxy.type) ? proxy.custom_domains : proxy.remote_port} 
                        onChange={(e) => updateProxy(idx, ['http', 'https'].includes(proxy.type) ? 'custom_domains' : 'remote_port', e.target.value)}
                        placeholder={['http', 'https'].includes(proxy.type) ? "example.com" : "6000"}
                        className="bg-black/20 focus:bg-black/40 font-mono text-blue-300"
                      />
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {proxies.length === 0 && (
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="text-center py-10 opacity-30 border-2 border-dashed border-white/10 rounded-xl"
              >
                <Globe size={48} className="mx-auto mb-2" />
                <p className="text-sm">{t("no_tunnels")}</p>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1.5 block select-none">{children}</label>;
}
