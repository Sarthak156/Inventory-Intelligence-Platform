import { Bot, Loader2 } from "lucide-react";

export default function AIStatus({ source = "fallback", loading = false, compact = false }) {
  const enhanced = source === "gemini";
  return (
    <div className={`flex ${compact ? "items-center" : "items-start"} gap-2.5`}>
      <span className="relative flex h-2 w-2 mt-1.5 shrink-0">
        {!loading && <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${enhanced ? "bg-cyan-400" : "bg-amber-400"} opacity-60`} />}
        <span className={`relative inline-flex rounded-full h-2 w-2 ${loading ? "bg-slate-500" : enhanced ? "bg-cyan-400" : "bg-amber-400"}`} />
      </span>
      <div>
        <div className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.16em] ${enhanced ? "text-cyan-400" : "text-amber-400"}`}>
          {loading ? <Loader2 size={11} className="animate-spin" /> : <Bot size={11} />}
          AI Engine: {loading ? "Analyzing" : enhanced ? "Enhanced" : "Fallback Mode"}
        </div>
        {!compact && <p className="text-[11px] theme-muted mt-1">{enhanced ? "Gemini intelligence layer online." : "Advanced AI unavailable. Deterministic intelligence systems active."}</p>}
      </div>
    </div>
  );
}

