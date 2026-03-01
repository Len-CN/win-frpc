import { useCallback, useEffect, useState } from "react";
import type { i18n as I18nType } from "i18next";
import { loadConfig, saveConfig } from "../lib/store";
import type { AppConfig, ProxyItem } from "../types/frpc";

interface UseAppConfigResult {
  isLoaded: boolean;
  serverAddr: string;
  setServerAddr: (value: string) => void;
  serverPort: string;
  setServerPort: (value: string) => void;
  token: string;
  setToken: (value: string) => void;
  proxies: ProxyItem[];
  setProxies: (value: ProxyItem[]) => void;
  toggleLanguage: () => void;
}

export function useAppConfig(i18n: I18nType): UseAppConfigResult {
  const [isLoaded, setIsLoaded] = useState(false);
  const [serverAddr, setServerAddr] = useState("127.0.0.1");
  const [serverPort, setServerPort] = useState("7000");
  const [token, setToken] = useState("");
  const [proxies, setProxies] = useState<ProxyItem[]>([]);

  useEffect(() => {
    let active = true;

    const initialize = async () => {
      const config = await loadConfig();
      if (!active) {
        return;
      }

      setServerAddr(config.serverAddr);
      setServerPort(config.serverPort);
      setToken(config.token);
      setProxies(config.proxies);

      if (config.language && config.language !== i18n.language) {
        await i18n.changeLanguage(config.language);
      }

      if (active) {
        setIsLoaded(true);
      }
    };

    void initialize();

    return () => {
      active = false;
    };
  }, [i18n]);

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    const timer = window.setTimeout(() => {
      const config: AppConfig = {
        language: i18n.language as "en" | "zh",
        serverAddr,
        serverPort,
        token,
        proxies,
      };

      void saveConfig(config);
    }, 800);

    return () => {
      window.clearTimeout(timer);
    };
  }, [i18n.language, isLoaded, proxies, serverAddr, serverPort, token]);

  const toggleLanguage = useCallback(() => {
    const newLang = i18n.language === "en" ? "zh" : "en";
    void i18n.changeLanguage(newLang);

    if (!isLoaded) {
      return;
    }

    const updatedConfig: AppConfig = {
      language: newLang,
      serverAddr,
      serverPort,
      token,
      proxies,
    };

    void saveConfig(updatedConfig);
  }, [i18n, isLoaded, proxies, serverAddr, serverPort, token]);

  return {
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
  };
}
