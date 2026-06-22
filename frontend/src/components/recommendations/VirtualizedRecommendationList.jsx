import { List } from "react-window";
import { ArrowUpRight, Clock3, Cpu } from "lucide-react";

const ITEM_HEIGHT = 320;

const severityClass = {
  HIGH: "text-rose-400 bg-rose-500/10 border-rose-500/25",
  MEDIUM: "text-amber-400 bg-amber-500/10 border-amber-500/25",
  LOW: "text-emerald-400 bg-emerald-500/10 border-emerald-500/25",
};

const RowComponent = ({ index, style, items }) => {
  const item = items?.[index];
  if (!item || typeof item !== "object") return null;

  const severity = item.severity ?? "LOW";
  const category = item.category ?? "";
  const partNo = item.partNo ?? item.partNumber ?? "";
  const title = item.title ?? "";
  const reasoning = item.reasoning ?? "";
  const confidence =
    typeof item.confidence === "number" ? item.confidence : Number(item.confidence ?? 0);

  const tags = Array.isArray(item.tags) ? item.tags : [];
  const time = item.timestamp
    ? new Date(item.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : "";

  return (
    <div style={style}>
      <button
        type="button"
        className="w-full text-left theme-bg-card border theme-border rounded-2xl p-5 hover:theme-card-hover hover:-translate-y-0.5 transition-all duration-300 group mx-1 my-2"
      >
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
          <div className="flex flex-wrap gap-2">
            <span
              className={`text-[10px] border rounded-md px-2 py-1 font-bold tracking-widest ${
                severityClass[severity] ?? severityClass.LOW
              }`}
            >
              {severity} PRIORITY
            </span>
            <span className="text-[10px] theme-cyan-bg theme-cyan-border theme-cyan border rounded-md px-2 py-1 font-bold tracking-widest">
              {category}
            </span>
          </div>
          <span className="flex items-center gap-1.5 text-[10px] theme-muted">
            <Clock3 size={11} />
            {time}
          </span>
        </div>

        <div className="flex justify-between gap-4">
          <div>
            <p className="text-[10px] theme-muted uppercase tracking-widest mb-1">
              Part {partNo}
            </p>
            <h3 className="theme-text font-semibold group-hover:theme-cyan transition-colors">
              {title}
            </h3>
            <p className="text-sm theme-muted leading-relaxed mt-2">{reasoning}</p>
          </div>
          <ArrowUpRight size={18} className="theme-muted group-hover:theme-cyan shrink-0" />
        </div>

        <div className="flex flex-wrap items-end justify-between gap-3 mt-5 pt-4 border-t theme-border">
          <div className="flex flex-wrap gap-1.5">
            {tags.map((tag, i) => (
              <span
                key={`${tag ?? "tag"}-${i}`}
                className="text-[9px] theme-bg-card-soft border theme-border theme-muted rounded px-2 py-1 tracking-wider"
              >
                {tag}
              </span>
            ))}
          </div>

          <div className="text-right">
            <p className="text-[10px] theme-text font-semibold">
              {confidence}% CONFIDENCE
            </p>
            <p className="text-[9px] theme-muted flex items-center gap-1 mt-1">
              <Cpu size={10} />
              Fallback Intelligence Engine
            </p>
          </div>
        </div>
      </button>
    </div>
  );
};

function VirtualizedRecommendationList({ items }) {
  const safeItems = Array.isArray(items) ? items : [];
  const rowProps = { items: safeItems };

  if (safeItems.length === 0) {
    return (
      <div className="border theme-border rounded-2xl overflow-hidden">
        <div className="theme-bg-card border theme-border rounded-2xl p-10 text-center theme-muted text-sm">
          No active recommendations in this category.
        </div>
      </div>
    );
  }

  return (
    <div className="border theme-border rounded-2xl overflow-hidden" style={{ height: 900 }}>
      <List
        height={900}
        width={1200}
        rowCount={safeItems.length}
        rowHeight={ITEM_HEIGHT}
        rowComponent={RowComponent}
        rowProps={rowProps}
      />
    </div>
  );
}

export default VirtualizedRecommendationList;
