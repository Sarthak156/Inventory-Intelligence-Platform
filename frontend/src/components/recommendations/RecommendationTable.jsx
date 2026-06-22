import { Clock3 } from "lucide-react";

const severityClass = {
  HIGH: "text-rose-400 bg-rose-500/10 border-rose-500/25",
  MEDIUM: "text-amber-400 bg-amber-500/10 border-amber-500/25",
  LOW: "text-emerald-400 bg-emerald-500/10 border-emerald-500/25",
};

function formatTime(ts) {
  try {
    return ts
      ? new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      : "";
  } catch {
    return "";
  }
}

function formatConfidence(conf) {
  const n = typeof conf === "number" ? conf : Number(conf ?? 0);
  return Number.isFinite(n) ? `${n}%` : "0%";
}

export default function RecommendationTable({ items, onRowClick }) {
  return (
    <div className="border theme-border rounded-2xl overflow-hidden theme-app">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse" style={{ minWidth: 1200 }}>
          <thead className="sticky top-0 z-10 theme-bg-header backdrop-blur-xl">
            <tr className="text-[10px] theme-muted uppercase tracking-[0.22em]">
              <th className="text-left px-4 py-3 font-bold">Part No</th>
              <th className="text-left px-4 py-3 font-bold">Priority</th>
              <th className="text-left px-4 py-3 font-bold">Category</th>
              <th className="text-left px-4 py-3 font-bold">Recommendation</th>
              <th className="text-left px-4 py-3 font-bold">Volatility</th>
              <th className="text-left px-4 py-3 font-bold">Forecast Growth</th>
              <th className="text-left px-4 py-3 font-bold">Confidence</th>
              <th className="text-left px-4 py-3 font-bold">Timestamp</th>
              <th className="text-left px-4 py-3 font-bold">Action</th>
            </tr>
          </thead>

          <tbody>
            {items.map((item, idx) => {
              const severity = item?.severity ?? "LOW";
              const category = item?.category ?? "";
              const partNo = item?.partNo ?? item?.partNumber ?? "";
              const title = item?.title ?? "";
              const reasoning = item?.reasoning ?? "";
              const time = formatTime(item?.timestamp);
              const confidence = formatConfidence(item?.confidence);

              const vol = item?.metrics?.Volatility ?? item?.volatility ?? item?.Volatility ?? item?.metrics?.Volatility ?? "";
              const growth =
                item?.metrics?.ForecastGrowth ??
                item?.forecastGrowth ??
                item?.ForecastGrowth ??
                item?.metrics?.ForecastGrowth ??
                "";

              // keep recommendation text short for table cell
              const recommendationText = (title || reasoning || "").toString().slice(0, 90);

              return (
                <tr
                  key={item?.id ?? `${partNo}-${idx}`}
                  className="border-t border-theme-border/30 hover:theme-cyan/10 transition-colors cursor-pointer"
                  onClick={() => onRowClick?.(item)}
                >
                  <td className="px-4 py-3 text-sm theme-text">{partNo}</td>

                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-lg border text-[10px] font-bold tracking-wider ${
                        severityClass[severity] ?? severityClass.LOW
                      }`}
                    >
                      {severity}
                    </span>
                  </td>

                  <td className="px-4 py-3 text-sm theme-muted">{category}</td>

                  <td className="px-4 py-3 text-sm">
                    <div className="theme-text font-semibold">{recommendationText}</div>
                  </td>

                  <td className="px-4 py-3 text-sm theme-muted">{vol !== "" ? vol : "—"}</td>

                  <td className="px-4 py-3 text-sm theme-muted">
                    {growth !== "" ? growth : "—"}
                  </td>

                  <td className="px-4 py-3 text-sm theme-muted">{confidence}</td>

                  <td className="px-4 py-3 text-sm theme-muted">
                    <div className="flex items-center gap-1.5">
                      <Clock3 size={12} className="theme-muted" />
                      {time || "—"}
                    </div>
                  </td>

                  <td className="px-4 py-3">
                    <button
                      type="button"
                      className="text-[10px] theme-cyan hover:underline"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRowClick?.(item);
                      }}
                    >
                      Open
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
