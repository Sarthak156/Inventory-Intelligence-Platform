import { Activity, ShieldAlert, Target, Gauge } from "lucide-react";
import AIStatus from "./AIStatus";

const cards = [
  ["Operational Summary", "summary", Activity, "border-cyan-500/20 bg-cyan-500/5 text-cyan-400"],
  ["Strategic Recommendation", "recommendation", Target, "border-emerald-500/20 bg-emerald-500/5 text-emerald-400"],
  ["Risk Explanation", "riskExplanation", ShieldAlert, "border-amber-500/20 bg-amber-500/5 text-amber-400"],
  ["Confidence Commentary", "confidenceCommentary", Gauge, "border-violet-500/20 bg-violet-500/5 text-violet-400"],
];

export default function AIInsightPanel({ insight, loading = false, title = "AI Operations Analysis" }) {
  if (!insight) return null;
  return (
    <section className="theme-bg-card border theme-border rounded-2xl p-6 backdrop-blur-md transition-all duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <h2 className="text-sm uppercase tracking-widest theme-text font-semibold">{title}</h2>
        <AIStatus source={insight.source} loading={loading} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {cards.map(([label, field, Icon, tone]) => (
          <div key={field} className={`rounded-xl border p-4 transition-opacity duration-300 ${tone} ${loading ? "opacity-60" : "opacity-100"}`}>
            <p className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold mb-2"><Icon size={14} />{label}</p>
            <p className="text-sm theme-text leading-relaxed">{insight[field]}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
