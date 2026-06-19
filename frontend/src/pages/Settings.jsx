import { useEffect, useState } from "react";
import {
  Activity,
  Bot,
  CheckCircle2,
  Cpu,
  Gauge,
  MonitorCog,
  Moon,
  Radio,
  ShieldAlert,
  SlidersHorizontal,
  Sparkles,
  Terminal,
  Zap,
} from "lucide-react";

const modules = [
  { name: "Forecast Engine", status: "ACTIVE", tone: "emerald", icon: Activity },
  { name: "Risk Surveillance", status: "ONLINE", tone: "cyan", icon: ShieldAlert },
  { name: "Optimization Core", status: "STABLE", tone: "emerald", icon: Cpu },
  { name: "AI Recommendation Engine", status: "STANDBY", tone: "amber", icon: Bot },
];

const engineSettings = [
  { key: "commentary", label: "AI Commentary", icon: Sparkles },
  { key: "sync", label: "Live Forecast Sync", icon: Radio },
  { key: "alerts", label: "Risk Alerts", icon: ShieldAlert },
  { key: "recommendations", label: "Auto Recommendations", icon: Bot },
];

const statusTone = {
  cyan: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30 shadow-[0_0_18px_rgba(34,211,238,0.12)]",
  emerald: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-[0_0_18px_rgba(52,211,153,0.12)]",
  amber: "bg-amber-500/10 text-amber-400 border-amber-500/30 shadow-[0_0_18px_rgba(251,191,36,0.10)]",
};

const ToggleSwitch = ({ checked, onChange, label }) => (
  <button
    type="button"
    aria-pressed={checked}
    aria-label={label}
    onClick={onChange}
    className={`relative h-7 w-12 shrink-0 rounded-full border transition-all duration-300 ${
      checked
        ? "border-cyan-400/50 bg-cyan-500/20 shadow-[0_0_16px_rgba(34,211,238,0.20)]"
        : "theme-border theme-bg-card-soft"
    }`}
  >
    <span
      className={`absolute top-1 h-4.5 w-4.5 rounded-full transition-all duration-300 ${
        checked
          ? "left-6 bg-cyan-300 shadow-[0_0_12px_rgba(103,232,249,0.85)]"
          : "left-1 bg-slate-500"
      }`}
    />
  </button>
);

const SettingsRow = ({ icon: Icon, label, checked, onChange }) => (
  <div className="flex items-center justify-between gap-4 rounded-xl border theme-border theme-bg-card-soft px-4 py-3 transition-all duration-300 hover:border-cyan-500/40 hover:shadow-[0_0_18px_rgba(34,211,238,0.08)]">
    <div className="flex min-w-0 items-center gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-cyan-500/20 bg-cyan-500/10">
        <Icon size={16} className="text-cyan-400" />
      </div>
      <span className="truncate text-sm font-medium theme-text">{label}</span>
    </div>
    <ToggleSwitch checked={checked} onChange={onChange} label={label} />
  </div>
);

const Settings = () => {
  const [mode, setMode] = useState(localStorage.getItem("operationalMode") || "Balanced");
  const [syncComplete, setSyncComplete] = useState(false);
  const [engine, setEngine] = useState({
    commentary: true,
    sync: true,
    alerts: true,
    recommendations: false,
  });
  const [appearance, setAppearance] = useState({
    darkMode: (localStorage.getItem("theme") || "light") === "dark",
    cyanIntensity: localStorage.getItem("cyanIntensity") || "High",
    compactMode: localStorage.getItem("compactMode") === "true",
    terminalMode: localStorage.getItem("terminalMode") === "true",
  });

  useEffect(() => {
    const timer = setTimeout(() => setSyncComplete(true), 1800);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    localStorage.setItem("operationalMode", mode);
  }, [mode]);

  useEffect(() => {
    const theme = appearance.darkMode ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", theme);
    document.documentElement.setAttribute("data-cyan-intensity", appearance.cyanIntensity.toLowerCase());
    document.documentElement.toggleAttribute("data-compact", appearance.compactMode);
    document.documentElement.toggleAttribute("data-terminal", appearance.terminalMode);
    localStorage.setItem("theme", theme);
    localStorage.setItem("cyanIntensity", appearance.cyanIntensity);
    localStorage.setItem("compactMode", String(appearance.compactMode));
    localStorage.setItem("terminalMode", String(appearance.terminalMode));
    window.dispatchEvent(new CustomEvent("inventory-theme-change", { detail: { theme } }));
  }, [appearance]);

  const toggleEngine = (key) => {
    setEngine((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const updateAppearance = (key, value) => {
    setAppearance((prev) => ({ ...prev, [key]: value ?? !prev[key] }));
  };

  return (
    <div className="settings-terminal p-8 flex w-full flex-col gap-6 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-cyan-400">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-300 shadow-[0_0_10px_rgba(103,232,249,0.9)]" />
            Command Terminal
          </div>
          <h1 className="text-3xl font-light tracking-tight theme-text">System Settings</h1>
          <p className="mt-1 max-w-2xl text-sm theme-muted">
            Global controls for forecasting posture, AI automation, and command-center appearance.
          </p>
        </div>

        <div className="flex min-h-11 items-center gap-3 rounded-xl border theme-border theme-bg-card px-4 py-3">
          {syncComplete ? (
            <CheckCircle2 size={17} className="text-emerald-400" />
          ) : (
            <Zap size={17} className="animate-pulse text-cyan-400" />
          )}
          <span className="text-xs font-semibold uppercase tracking-widest text-cyan-400">
            {syncComplete ? "Operational Sync Complete" : "Synchronizing Forecast Engine..."}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-4">
        {modules.map(({ name, status, tone, icon: Icon }) => (
          <div
            key={name}
            className="group rounded-2xl border theme-border theme-bg-card p-5 backdrop-blur-md transition-all duration-500 hover:-translate-y-1 hover:border-cyan-500/50 hover:shadow-[0_0_28px_rgba(34,211,238,0.14)]"
          >
            <div className="mb-5 flex items-start justify-between gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-cyan-500/20 bg-cyan-500/10 transition-colors group-hover:border-cyan-400/40">
                <Icon size={18} className="text-cyan-400" />
              </div>
              <span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold tracking-widest ${statusTone[tone]}`}>
                {status}
              </span>
            </div>
            <p className="text-[10px] font-semibold uppercase tracking-widest theme-muted">Module</p>
            <h3 className="mt-1 text-base font-semibold theme-text">{name}</h3>
            <div className="mt-4 h-1 overflow-hidden rounded-full bg-slate-500/10">
              <div className="h-full w-4/5 rounded-full bg-cyan-400 shadow-[0_0_14px_rgba(34,211,238,0.8)]" />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.05fr_1fr]">
        <section className="rounded-2xl border theme-border theme-bg-card p-6 backdrop-blur-md">
          <div className="mb-5 flex items-center gap-3">
            <Gauge size={19} className="text-cyan-400" />
            <h2 className="text-sm font-semibold uppercase tracking-widest theme-text">Operational Modes</h2>
          </div>
          <div className="grid grid-cols-1 gap-2 rounded-2xl border theme-border theme-bg-card-soft p-2 sm:grid-cols-3">
            {["Conservative", "Balanced", "Aggressive"].map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setMode(item)}
                className={`rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-300 ${
                  mode === item
                    ? "bg-cyan-400 text-slate-950 shadow-[0_0_20px_rgba(34,211,238,0.25)]"
                    : "theme-muted hover:bg-cyan-500/10 hover:text-cyan-300"
                }`}
              >
                {item}
              </button>
            ))}
          </div>
          <div className="mt-5 rounded-xl border border-cyan-500/20 bg-cyan-500/5 px-4 py-3 text-xs leading-relaxed theme-muted">
            Active posture: <span className="font-semibold text-cyan-400">{mode}</span>. Forecast thresholds and recommendation confidence gates will follow this global mode.
          </div>
        </section>

        <section className="rounded-2xl border theme-border theme-bg-card p-6 backdrop-blur-md">
          <div className="mb-5 flex items-center gap-3">
            <SlidersHorizontal size={19} className="text-cyan-400" />
            <h2 className="text-sm font-semibold uppercase tracking-widest theme-text">AI Engine Settings</h2>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {engineSettings.map((item) => (
              <SettingsRow
                key={item.key}
                icon={item.icon}
                label={item.label}
                checked={engine[item.key]}
                onChange={() => toggleEngine(item.key)}
              />
            ))}
          </div>
        </section>
      </div>

      <section className="rounded-2xl border theme-border theme-bg-card p-6 backdrop-blur-md">
        <div className="mb-5 flex items-center gap-3">
          <MonitorCog size={19} className="text-cyan-400" />
          <h2 className="text-sm font-semibold uppercase tracking-widest theme-text">Appearance & Theme</h2>
        </div>
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-4">
          <SettingsRow
            icon={Moon}
            label="Dark Mode"
            checked={appearance.darkMode}
            onChange={() => updateAppearance("darkMode")}
          />
          <div className="rounded-xl border theme-border theme-bg-card-soft px-4 py-3">
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-cyan-500/20 bg-cyan-500/10">
                <Zap size={16} className="text-cyan-400" />
              </div>
              <span className="text-sm font-medium theme-text">Cyan Intensity</span>
            </div>
            <div className="grid grid-cols-3 gap-1 rounded-lg border theme-border p-1">
              {["Low", "High", "Max"].map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => updateAppearance("cyanIntensity", level)}
                  className={`rounded-md px-2 py-1.5 text-xs font-semibold transition-colors ${
                    appearance.cyanIntensity === level
                      ? "bg-cyan-400 text-slate-950"
                      : "theme-muted hover:bg-cyan-500/10 hover:text-cyan-300"
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>
          <SettingsRow
            icon={SlidersHorizontal}
            label="Compact Mode"
            checked={appearance.compactMode}
            onChange={() => updateAppearance("compactMode")}
          />
          <SettingsRow
            icon={Terminal}
            label="Terminal Mode"
            checked={appearance.terminalMode}
            onChange={() => updateAppearance("terminalMode")}
          />
        </div>
      </section>

      <footer className="grid grid-cols-1 gap-3 rounded-2xl border border-cyan-500/30 bg-cyan-500/10 px-5 py-4 text-[11px] font-bold uppercase tracking-widest text-cyan-300 shadow-[0_0_24px_rgba(34,211,238,0.10)] md:grid-cols-3">
        <div>SYSTEM UPTIME: 99.2%</div>
        <div className="md:text-center">LAST SYNC: JUST NOW</div>
        <div className="flex items-center gap-2 md:justify-end">
          <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.9)]" />
          STATUS: OPERATIONAL
        </div>
      </footer>
    </div>
  );
};

export default Settings;
