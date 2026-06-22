import { useMemo } from "react";
import {
  X,
  Cpu,
  Bot,
  Activity,
  ShieldAlert,
  Target,
  Clock3,
} from "lucide-react";
import AIStatus from "../ai/AIStatus";
import AILoadingPulse from "../ai/LoadingPulse";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";

const chipBase =
  "text-[9px] theme-bg-card-soft border theme-border theme-muted rounded px-2 py-1 tracking-wider";

function confidenceToPct(confidence) {
  const n = typeof confidence === "number" ? confidence : Number(confidence ?? 0);
  return Number.isFinite(n) ? Math.max(0, Math.min(100, n)) : 0;
}

function formatTime(ts) {
  try {
    return ts
      ? new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      : "";
  } catch {
    return "";
  }
}

function MiniChart({ chartData }) {
  const data = Array.isArray(chartData) ? chartData : [];
  return (
    <div className="h-44">
      {data.length ? (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--theme-border)" vertical={false} />
            <XAxis dataKey="Month" stroke="var(--theme-muted)" fontSize={9} />
            <YAxis stroke="var(--theme-muted)" fontSize={9} />
            <Line dataKey="Demand" stroke="var(--theme-cyan)" strokeWidth={2} dot={false} />
            <Line dataKey="Forecast" stroke="#8b5cf6" strokeWidth={2} strokeDasharray="5 5" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <div className="h-full grid place-items-center text-sm theme-muted">
          No telemetry
        </div>
      )}
    </div>
  );
}

export default function RecommendationModal({
  recommendation,
  insight,
  loading,
  chartData,
  chartLoading,
  onClose,
  source = "fallback",
}) {
  const safe = useMemo(() => recommendation || {}, [recommendation]);
  const safeInsight = useMemo(() => insight || {}, [insight]);

  if (!recommendation) return null;

  const confidencePct = confidenceToPct(safe?.confidence);
  const tags = Array.isArray(safe?.tags) ? safe.tags : [];

  const blocks = [
    {
      title: "Operational Summary",
      text: safeInsight?.summary,
      Icon: Activity,
    },
    {
      title: "Risk Analysis",
      text: safeInsight?.riskExplanation,
      Icon: ShieldAlert,
    },
    {
      title: "AI Recommendation",
      text: safeInsight?.recommendation,
      Icon: Target,
    },
    {
      title: "Confidence Commentary",
      text: safeInsight?.confidenceCommentary,
      Icon: Activity,
    },
  ];

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-center p-2"
      onClick={onClose}
    >
      <aside
        className="theme-app border theme-border h-full w-full max-w-4xl shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-500 rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="sticky top-0 z-10 theme-bg-header backdrop-blur-xl border-b p-6 flex justify-between gap-4">
          <div>
            <p className="text-[10px] theme-cyan uppercase tracking-[0.2em] font-bold">
              SKU Intelligence
            </p>
            <h2 className="text-2xl theme-text mt-1">
              {safe?.partNo ?? "—"}{" "}
              <span className="text-sm theme-muted font-semibold">· {safe?.category ?? ""}</span>
            </h2>

            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center px-3 py-1 rounded-lg border text-[10px] font-bold tracking-wider ${
                  safe?.severity === "HIGH"
                    ? "text-rose-400 bg-rose-500/10 border-rose-500/25"
                    : safe?.severity === "MEDIUM"
                      ? "text-amber-400 bg-amber-500/10 border-amber-500/25"
                      : "text-emerald-400 bg-emerald-500/10 border-emerald-500/25"
                }`}
              >
                {safe?.severity ?? "LOW"} PRIORITY
              </span>
              <span className="text-[10px] theme-muted flex items-center gap-1">
                <Clock3 size={12} /> {formatTime(safe?.timestamp) || "—"}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 border theme-border rounded-lg theme-muted hover:theme-cyan"
            aria-label="Close modal"
            type="button"
          >
            <X size={19} />
          </button>
        </header>

        <div className="p-6 space-y-5">
          {/* AI engine status + metrics */}
          <section className="theme-bg-card border theme-cyan-border rounded-xl p-4 flex flex-col lg:flex-row lg:items-start justify-between gap-4">
            <div className="flex-1 min-w-[260px]">
              <AIStatus source={safeInsight?.source ?? source} loading={loading} compact />
              <p className="text-[10px] theme-muted uppercase tracking-widest mt-3">
                Sync Status
              </p>
              <p className="text-sm theme-text font-semibold mt-1">Sync: Live</p>
            </div>

            <div className="flex flex-wrap gap-3 justify-end">
              <div className="theme-bg-card-soft border theme-border rounded-lg p-3 min-w-[160px]">
                <p className="text-[10px] theme-muted uppercase tracking-widest font-bold">
                  Confidence
                </p>
                <p className="text-2xl theme-text font-light mt-2">{confidencePct}%</p>
                <div className="mt-3 h-2 rounded-full bg-theme-border overflow-hidden">
                  <div
                    className="h-full bg-cyan-400"
                    style={{ width: `${confidencePct}%` }}
                  />
                </div>
              </div>

              <div className="theme-bg-card-soft border theme-border rounded-lg p-3 min-w-[160px]">
                <p className="text-[10px] theme-muted uppercase tracking-widest font-bold">
                  AI Engine
                </p>
                <p className="text-sm theme-text mt-2 flex items-center gap-2">
                  {source === "gemini" ? <Bot size={14} /> : <Cpu size={14} />}
                  {source === "gemini" ? "Gemini AI" : "Fallback Intelligence Engine"}
                </p>
                <p className="text-[10px] theme-muted mt-2">
                  Mode: {safeInsight?.source ?? (source === "gemini" ? "gemini" : "fallback")}
                </p>
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <section className="theme-bg-card border theme-border rounded-xl p-4">
              <h3 className="text-xs theme-text uppercase tracking-widest font-semibold mb-3">
                Historical vs Forecast (Mini)
              </h3>
              {chartLoading ? (
                <div className="h-44 grid place-items-center">
                  <AILoadingPulse />
                </div>
              ) : (
                <MiniChart chartData={chartData} />
              )}
            </section>

            <section className="theme-bg-card border theme-border rounded-xl p-4">
              <h3 className="text-xs theme-text uppercase tracking-widest font-semibold mb-3">
                Recommendation Reasoning
              </h3>

              <div className="space-y-3">
                <div className="theme-bg-card-soft border theme-border rounded-lg p-3">
                  <p className="text-[10px] theme-muted uppercase tracking-widest font-bold">
                    Reasoning
                  </p>
                  <p className="text-sm theme-text leading-relaxed mt-2">
                    {safe?.reasoning || "—"}
                  </p>
                </div>

                <div className="theme-bg-card-soft border theme-border rounded-lg p-3">
                  <p className="text-[10px] theme-muted uppercase tracking-widest font-bold">
                    Action
                  </p>
                  <p className="text-sm theme-text leading-relaxed mt-2">
                    {(safe?.strategicAction || []).join?.(" · ") || safe?.strategicAction || "—"}
                  </p>
                </div>
              </div>
            </section>
          </section>

          {/* AI insight summary blocks */}
          <section className="theme-bg-card border theme-border rounded-xl p-4">
            <h3 className="text-xs theme-text uppercase tracking-widest font-semibold mb-4">
              AI Insight Summary
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {blocks.map((b) => (
                <div key={b.title} className="theme-bg-card-soft border theme-border rounded-xl p-3">
                  <h4 className="text-[10px] theme-cyan uppercase tracking-widest font-bold flex items-center gap-2">
                    <b.Icon size={14} /> {b.title}
                  </h4>
                  {b.text ? (
                    <p className="text-sm theme-text leading-relaxed mt-2">{b.text}</p>
                  ) : loading ? (
                    <div className="h-4 mt-2 theme-bg-card-soft rounded-md animate-pulse" />
                  ) : (
                    <p className="text-sm theme-muted italic mt-2">Unavailable</p>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Tags */}
          <section className="theme-bg-card border theme-border rounded-xl p-4">
            <h3 className="text-xs theme-text uppercase tracking-widest font-semibold mb-3">
              Tags / Chips
            </h3>
            {tags.length ? (
              <div className="flex flex-wrap gap-2">
                {tags.map((t, i) => (
                  <span key={`${t ?? "tag"}-${i}`} className={chipBase}>
                    {t}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm theme-muted">—</p>
            )}
          </section>
        </div>
      </aside>
    </div>
  );
}
