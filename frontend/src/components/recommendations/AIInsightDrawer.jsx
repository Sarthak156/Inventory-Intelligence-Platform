import { X, Activity, ShieldAlert, TrendingUp, Target, Loader2 } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from "recharts";
import AIStatus from "../ai/AIStatus";
import AILoadingPulse from "../ai/LoadingPulse";

export default function AIInsightDrawer({ recommendation, insight, loading, chartData, chartLoading, onClose }) {
  if (!recommendation) return null;
  
  const blocks = [
    ["Operational Summary", insight.summary, Activity],
    ["Risk Analysis", insight.riskExplanation, ShieldAlert],
    ["Forecast Commentary", recommendation.reasoning, TrendingUp],
    ["AI Recommendation", insight.recommendation, Target],
    ["Confidence Commentary", insight.confidenceCommentary, Activity],
    ["Strategic Action", recommendation.strategicAction, Target],
  ];

  return <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end" onClick={onClose}>
    <aside className="theme-app border-l theme-border h-full w-full max-w-3xl shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-500" onClick={e => e.stopPropagation()}>
      <header className="sticky top-0 z-10 theme-bg-header backdrop-blur-xl border-b theme-border p-6 flex justify-between gap-4">
        <div>
          <p className="text-[10px] theme-cyan uppercase tracking-[0.2em] font-bold">Recommendation Intelligence</p>
          <h2 className="text-2xl theme-text mt-1">{recommendation.title}</h2>
          <p className="text-xs theme-muted mt-1">Part {recommendation.partNo} · {recommendation.category}</p>
        </div>
        <button onClick={onClose} className="p-2 border theme-border rounded-lg theme-muted hover:theme-cyan"><X size={19} /></button>
      </header>
      <div className="p-6 space-y-5">
        <div className="theme-bg-card border theme-cyan-border rounded-xl p-4 flex flex-col sm:flex-row justify-between gap-4">
          <AIStatus source={insight.source} loading={loading} />
          <div className="sm:text-right">
            <p className="text-2xl theme-text font-semibold">{recommendation.confidence}%</p>
            <p className="text-[10px] theme-muted uppercase tracking-widest">Recommendation Confidence</p>
          </div>
        </div>
        
        {loading && (
          <div className="theme-bg-card border theme-cyan-border rounded-xl p-4">
            <AILoadingPulse />
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {blocks.map(([title, text, Icon]) => (
            <section key={title} className="theme-bg-card border theme-border rounded-xl p-4">
              <h3 className="text-[10px] theme-cyan uppercase tracking-widest font-bold flex items-center gap-2 mb-2">
                <Icon size={14} />{title}
              </h3>
              {text ? (
                <p className="text-sm theme-text leading-relaxed">{text}</p>
              ) : loading ? (
                <div className="h-4 theme-bg-card-soft rounded-md animate-pulse" />
              ) : (
                <p className="text-sm theme-muted italic">Unavailable</p>
              )}
            </section>
          ))}
        </div>
        
        <section className="theme-bg-card border theme-border rounded-xl p-5">
          <h3 className="text-xs theme-text uppercase tracking-widest font-semibold mb-4">Demand / Forecast Telemetry</h3>
          <div className="h-56">
            {chartLoading ? (
              <div className="h-full grid place-items-center">
                <Loader2 className="theme-cyan animate-spin" />
              </div>
            ) : chartData?.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--theme-border)" vertical={false} />
                  <XAxis dataKey="Month" stroke="var(--theme-muted)" fontSize={9} />
                  <YAxis stroke="var(--theme-muted)" fontSize={9} />
                  <Tooltip contentStyle={{ background: "var(--theme-card)", borderColor: "var(--theme-border)", borderRadius: 8 }} />
                  <Line dataKey="Demand" stroke="var(--theme-cyan)" strokeWidth={2} dot={false} />
                  <Line dataKey="Forecast" stroke="#8b5cf6" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full grid place-items-center text-sm theme-muted">No timeline telemetry available</div>
            )}
          </div>
        </section>
      </div>
    </aside>
  </div>;
}