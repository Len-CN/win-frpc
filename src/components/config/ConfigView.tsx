import { memo, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, Server, Globe, Shield } from "lucide-react";
import type { TFunction } from "i18next";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import type { ProxyItem } from "../../types/frpc";
import type { ConfigFieldErrors } from "../../lib/validation";

interface ConfigViewProps {
  t: TFunction;
  serverAddr: string;
  setServerAddr: (value: string) => void;
  serverPort: string;
  setServerPort: (value: string) => void;
  token: string;
  setToken: (value: string) => void;
  proxies: ProxyItem[];
  setProxies: (value: ProxyItem[]) => void;
  fieldErrors: ConfigFieldErrors;
}

type EditableProxyField = "name" | "type" | "local_port" | "remote_port" | "custom_domains";

function generateProxyId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `proxy_${Math.random().toString(36).slice(2, 11)}`;
}

function Label({ children }: { children: ReactNode }) {
  return (
    <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1.5 block select-none">
      {children}
    </label>
  );
}

function FieldHint({ error, t }: { error?: string; t: TFunction }) {
  if (!error) {
    return null;
  }

  return (
    <p className="text-[10px] text-red-400 mt-1 leading-tight select-none">
      {t(error)}
    </p>
  );
}

export const ConfigView = memo(function ConfigView({
  serverAddr,
  setServerAddr,
  serverPort,
  setServerPort,
  token,
  setToken,
  proxies,
  setProxies,
  t,
  fieldErrors,
}: ConfigViewProps) {
  const addProxy = () => {
    const id = generateProxyId();
    setProxies([
      ...proxies,
      {
        id,
        name: `service_${proxies.length + 1}`,
        type: "tcp",
        local_ip: "127.0.0.1",
        local_port: "80",
        remote_port: "",
      },
    ]);
  };

  const updateProxy = <K extends EditableProxyField>(index: number, field: K, value: ProxyItem[K]) => {
    const next = [...proxies];
    const current = next[index];
    if (!current) {
      return;
    }

    next[index] = {
      ...current,
      [field]: value,
    };

    setProxies(next);
  };

  const removeProxy = (index: number) => {
    const current = proxies[index];
    const targetName = current?.name || `${index + 1}`;
    if (!window.confirm(`Delete tunnel ${targetName}?`)) {
      return;
    }

    const next = [...proxies];
    next.splice(index, 1);
    setProxies(next);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="h-full flex flex-col gap-4 overflow-hidden"
    >
      <div className="bg-white/5 border border-white/10 p-6 rounded-2xl backdrop-blur-sm shadow-lg shrink-0">
        <div className="flex items-center gap-2 mb-6 text-blue-400 border-b border-white/5 pb-2">
          <Server size={18} />
          <h3 className="font-bold text-sm uppercase tracking-wider">{t("settings")}</h3>
        </div>
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-8">
            <Label>{t("server_addr")}</Label>
            <Input
              value={serverAddr}
              onChange={(e) => setServerAddr(e.target.value)}
              placeholder="0.0.0.0"
              className={fieldErrors.server.serverAddr ? "bg-black/20 focus:bg-black/40 border-red-500/50" : "bg-black/20 focus:bg-black/40"}
            />
            <FieldHint error={fieldErrors.server.serverAddr} t={t} />
          </div>
          <div className="col-span-4">
            <Label>{t("server_port")}</Label>
            <Input
              value={serverPort}
              onChange={(e) => setServerPort(e.target.value)}
              placeholder="7000"
              className={fieldErrors.server.serverPort ? "bg-black/20 focus:bg-black/40 border-red-500/50" : "bg-black/20 focus:bg-black/40"}
            />
            <FieldHint error={fieldErrors.server.serverPort} t={t} />
          </div>
          <div className="col-span-12">
            <Label>{t("token")}</Label>
            <div className="relative group">
              <Shield className="absolute left-3 top-2.5 h-4 w-4 text-gray-500 group-focus-within:text-blue-500 transition-colors" />
              <Input
                className="pl-9 bg-black/20 focus:bg-black/40"
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="..."
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex justify-between items-center mb-4 sticky top-0 z-10 py-2 bg-transparent backdrop-blur-md rounded-lg px-2 -mx-2 shrink-0">
          <div className="flex items-center gap-2 text-blue-400">
            <Globe size={18} />
            <h3 className="font-bold text-sm uppercase tracking-wider">{t("tunnels")}</h3>
            <span className="bg-blue-500/20 text-blue-300 text-[10px] px-1.5 py-0.5 rounded-full font-mono">
              {proxies.length}
            </span>
          </div>
          <Button
            onClick={addProxy}
            size="sm"
            variant="ghost"
            className="border border-white/10 hover:bg-blue-500/10 hover:text-blue-400 hover:border-blue-500/30 transition-all"
          >
            <Plus size={16} className="mr-1" /> {t("add_tunnel")}
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 pb-10 scrollbar-thin scrollbar-thumb-white/10">
          <div className="flex flex-col gap-4">
            <AnimatePresence mode="popLayout" initial={false}>
              {proxies.map((proxy, idx) => (
                <motion.div
                  key={proxy.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{
                    layout: { type: "spring", stiffness: 300, damping: 30 },
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
                      <Input
                        value={proxy.name}
                        onChange={(e) => updateProxy(idx, "name", e.target.value)}
                        className="bg-black/20 focus:bg-black/40"
                      />
                    </div>
                    <div className="col-span-2">
                      <Label>{t("type")}</Label>
                      <div className="relative">
                        <select
                          className="w-full h-10 bg-black/20 border border-white/10 rounded-md px-3 text-xs font-mono outline-none focus:border-blue-500 appearance-none text-white cursor-pointer hover:bg-black/30 transition-colors"
                          value={proxy.type}
                          onChange={(e) => updateProxy(idx, "type", e.target.value as ProxyItem["type"])}
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
                      <Input
                        value={proxy.local_port}
                        onChange={(e) => updateProxy(idx, "local_port", e.target.value)}
                        className={fieldErrors.proxies[idx]?.local_port ? "bg-black/20 focus:bg-black/40 font-mono border-red-500/50" : "bg-black/20 focus:bg-black/40 font-mono"}
                      />
                      <FieldHint error={fieldErrors.proxies[idx]?.local_port} t={t} />
                    </div>
                    <div className="col-span-4">
                      <Label>{["http", "https"].includes(proxy.type) ? t("custom_domain") : t("remote_port")}</Label>
                      <Input
                        value={["http", "https"].includes(proxy.type) ? proxy.custom_domains : proxy.remote_port}
                        onChange={(e) =>
                          updateProxy(
                            idx,
                            ["http", "https"].includes(proxy.type) ? "custom_domains" : "remote_port",
                            e.target.value,
                          )
                        }
                        placeholder={["http", "https"].includes(proxy.type) ? "example.com" : "6000"}
                        className={
                          (fieldErrors.proxies[idx]?.remote_port || fieldErrors.proxies[idx]?.custom_domains)
                            ? "bg-black/20 focus:bg-black/40 font-mono text-blue-300 border-red-500/50"
                            : "bg-black/20 focus:bg-black/40 font-mono text-blue-300"
                        }
                      />
                      <FieldHint
                        error={
                          ["http", "https"].includes(proxy.type)
                            ? fieldErrors.proxies[idx]?.custom_domains
                            : fieldErrors.proxies[idx]?.remote_port
                        }
                        t={t}
                      />
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {proxies.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
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
});
