import { useCallback, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Settings, Activity, Languages } from "lucide-react";
import { useTranslation } from "react-i18next";
import { TitleBar } from "./components/TitleBar";
import { ConfigView } from "./components/config/ConfigView";
import { StatusView } from "./components/status/StatusView";
import { cn } from "./lib/utils";
import { validateConfigFields } from "./lib/validation";
import { useAppConfig } from "./hooks/useAppConfig";
import { useFrpcService } from "./hooks/useFrpcService";

type AppTab = "status" | "config";

interface NavBtnProps {
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
  active: boolean;
  onClick: () => void;
  label: string;
}

function NavBtn({ icon: Icon, active, onClick, label }: NavBtnProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative flex flex-col items-center justify-center gap-1 group w-14 h-16 rounded-xl transition-all duration-300",
        active
          ? "bg-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.4)] text-white scale-105"
          : "hover:bg-white/10 text-gray-400 hover:text-white",
      )}
    >
      <div className="flex items-center justify-center h-6">
        <Icon size={24} strokeWidth={active ? 2.5 : 2} />
      </div>
      <span className="text-[10px] font-medium truncate w-full text-center opacity-80 leading-none mt-1">
        {label}
      </span>
      {active && (
        <motion.div
          layoutId="active-dot"
          className="absolute -right-3 top-0 bottom-0 my-auto w-1 h-6 bg-blue-400 rounded-l-full shadow-[0_0_8px_rgba(96,165,250,0.8)]"
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        />
      )}
    </button>
  );
}

export default function App() {
  const { t, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState<AppTab>("status");
  const { status, logs, isBusy, start, stop } = useFrpcService();
  const {
    isLoaded,
    serverAddr,
    setServerAddr,
    serverPort,
    setServerPort,
    token,
    setToken,
    proxies,
    setProxies,
    toggleLanguage,
  } = useAppConfig(i18n);

  const handleToggleService = useCallback(() => {
    if (status === "stopped") {
      void start({ serverAddr, serverPort, token, proxies });
      return;
    }

    void stop();
  }, [proxies, serverAddr, serverPort, start, status, stop, token]);

  const languageLabel = useMemo(() => (i18n.language === "en" ? "EN" : "中"), [i18n.language]);

  const fieldErrors = useMemo(
    () => validateConfigFields(serverAddr, serverPort, proxies),
    [serverAddr, serverPort, proxies],
  );

  if (!isLoaded) {
    return null;
  }

  return (
    <div className="h-screen w-screen flex flex-col pt-10 text-white selection:bg-blue-500/30 font-sans bg-transparent">
      <TitleBar />

      <div className="flex-1 flex overflow-hidden">
        <div className="w-20 flex flex-col items-center py-6 gap-4 bg-black/20 border-r border-white/5 backdrop-blur-md justify-between z-10">
          <div className="flex flex-col gap-4 w-full items-center">
            <NavBtn
              icon={Activity}
              label={t("status")}
              active={activeTab === "status"}
              onClick={() => setActiveTab("status")}
            />
            <NavBtn
              icon={Settings}
              label={t("config")}
              active={activeTab === "config"}
              onClick={() => setActiveTab("config")}
            />
          </div>

          <div className="mb-4">
            <button
              onClick={toggleLanguage}
              className="p-3 rounded-xl hover:bg-white/10 text-gray-400 hover:text-white transition-colors flex flex-col items-center gap-1 group"
            >
              <Languages size={20} className="group-hover:text-blue-400 transition-colors" />
              <span className="text-[10px] font-bold">{languageLabel}</span>
            </button>
          </div>
        </div>

        <div className="flex-1 relative p-6 overflow-hidden flex flex-col">
          <AnimatePresence mode="wait">
            {activeTab === "status" ? (
              <StatusView
                key="status"
                t={t}
                status={status}
                logs={logs}
                isBusy={isBusy}
                proxies={proxies}
                serverAddr={serverAddr}
                onToggle={handleToggleService}
              />
            ) : (
              <ConfigView
                key="config"
                t={t}
                serverAddr={serverAddr}
                setServerAddr={setServerAddr}
                serverPort={serverPort}
                setServerPort={setServerPort}
                token={token}
                setToken={setToken}
                proxies={proxies}
                setProxies={setProxies}
                fieldErrors={fieldErrors}
              />
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
