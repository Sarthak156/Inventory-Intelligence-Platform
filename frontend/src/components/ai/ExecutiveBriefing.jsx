import { ClipboardList, CheckCircle2 } from "lucide-react";
import AIStatus from "./AIStatus";

export default function ExecutiveBriefing({ insight, loading = false }) {
  if (!insight) return null;
  return (
    <section className="theme-bg-card border theme-cyan-border rounded-2xl p-6 backdrop-blur-md shadow-[0_0_24px_rgba(34,211,238,0.06)]">
      <div className="flex flex-col sm:flex-row justify-between gap-3 mb-5">
        <div><h2 className="text-sm uppercase tracking-widest theme-text font-semibold flex items-center gap-2"><ClipboardList size={16} className="theme-cyan" />Daily Operations Briefing</h2><p className="text-xs theme-muted mt-1">Current-cycle intelligence synthesized from live analytics.</p></div>
        <AIStatus source={insight.source} loading={loading} compact />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {insight.briefing.map((item, index) => <div key={index} className="flex items-start gap-2.5 theme-bg-card-soft border theme-border rounded-xl p-3"><CheckCircle2 size={15} className="theme-cyan mt-0.5 shrink-0" /><p className="text-sm theme-text">{item}</p></div>)}
      </div>
    </section>
  );
}
