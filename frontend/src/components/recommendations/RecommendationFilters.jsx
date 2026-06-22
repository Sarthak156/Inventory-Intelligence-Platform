export default function RecommendationFilters({ active, onChange, counts }) {
  return <div className="flex flex-wrap gap-2">
    {Object.keys(counts).map((category) => <button key={category} onClick={() => onChange(category)} className={`px-3 py-2 rounded-lg border text-[10px] font-bold tracking-wider transition-all ${active === category ? "bg-cyan-500 text-slate-950 border-cyan-400 shadow-[0_0_14px_rgba(34,211,238,0.25)]" : "theme-bg-card-soft theme-border theme-muted hover:theme-cyan-border hover:theme-cyan"}`}>{category} <span className="ml-1 opacity-70">{counts[category]}</span></button>)}
  </div>;
}

