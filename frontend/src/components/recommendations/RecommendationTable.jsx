import { useMemo, useState } from "react";
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search,
  LayoutGrid,
  LayoutList,
  Clock3,
  ChevronDown,
} from "lucide-react";

const CATEGORY_STYLES = {
  RISK: "text-rose-400 bg-rose-500/10 border-rose-500/25",
  FORECAST: "text-cyan-400 bg-cyan-500/10 border-cyan-500/25",
  OPTIMIZATION: "text-emerald-400 bg-emerald-500/10 border-emerald-500/25",
  MONITORING: "text-amber-400 bg-amber-500/10 border-amber-500/25",
};

const SEVERITY_STYLES = {
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

function getConfidenceValue(conf) {
  const n = typeof conf === "number" ? conf : Number(conf ?? 0);
  return Number.isFinite(n) ? Math.max(0, Math.min(100, n)) : 0;
}

function resolveNested(obj, path) {
  if (!obj) return undefined;
  const parts = path.split(".");
  let current = obj;
  for (const p of parts) {
    if (current == null) return undefined;
    current = current[p];
  }
  return current;
}

function getMetricValue(item, keys, fallback = "") {
  for (const key of keys) {
    const val = resolveNested(item, key);
    if (val !== undefined && val !== null && val !== "") return val;
  }
  return fallback;
}

export default function RecommendationTable({ items, onRowClick }) {
  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [confidenceFilter, setConfidenceFilter] = useState("ALL");
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState("desc");
  const [density, setDensity] = useState("comfortable");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(100);

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const setSearchSafe = (val) => {
    setSearch(val);
    setPage(1);
  };

  const setPriorityFilterSafe = (val) => {
    setPriorityFilter(val);
    setPage(1);
  };

  const setCategoryFilterSafe = (val) => {
    setCategoryFilter(val);
    setPage(1);
  };

  const setConfidenceFilterSafe = (val) => {
    setConfidenceFilter(val);
    setPage(1);
  };

  const setPageSizeSafe = (val) => {
    setPageSize(val);
    setPage(1);
  };

  const filteredData = useMemo(() => {
    let data = Array.isArray(items) ? [...items] : [];

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      data = data.filter((item) => {
        const partNo = String(item?.partNo ?? item?.partNumber ?? "").toLowerCase();
        const sku = String(item?.metrics?.SKU ?? item?.sku ?? "").toLowerCase();
        const text = String(
          item?.title ?? item?.reasoning ?? item?.recommendation ?? ""
        ).toLowerCase();
        return partNo.includes(q) || sku.includes(q) || text.includes(q);
      });
    }

    if (priorityFilter !== "ALL") {
      data = data.filter((item) => (item?.severity ?? "").toUpperCase() === priorityFilter);
    }

    if (categoryFilter !== "ALL") {
      data = data.filter((item) => (item?.category ?? "").toUpperCase() === categoryFilter);
    }

    if (confidenceFilter !== "ALL") {
      const [min, max] = confidenceFilter.split("-").map(Number);
      data = data.filter((item) => {
        const c = getConfidenceValue(item?.confidence);
        return c >= min && c <= max;
      });
    }

    if (sortKey) {
      data.sort((a, b) => {
        let av, bv;
        switch (sortKey) {
          case "volatility":
            av = getMetricValue(a, ["metrics.Volatility", "volatility", "Volatility"], -Infinity);
            bv = getMetricValue(b, ["metrics.Volatility", "volatility", "Volatility"], -Infinity);
            break;
          case "forecastGrowth":
            av = getMetricValue(a, ["metrics.ForecastGrowth", "forecastGrowth", "ForecastGrowth"], -Infinity);
            bv = getMetricValue(b, ["metrics.ForecastGrowth", "forecastGrowth", "ForecastGrowth"], -Infinity);
            break;
          case "confidence":
            av = getConfidenceValue(a?.confidence);
            bv = getConfidenceValue(b?.confidence);
            break;
          case "timestamp":
            av = a?.timestamp ? new Date(a.timestamp).getTime() : 0;
            bv = b?.timestamp ? new Date(b.timestamp).getTime() : 0;
            break;
          default:
            return 0;
        }
        if (av < bv) return sortDir === "asc" ? -1 : 1;
        if (av > bv) return sortDir === "asc" ? 1 : -1;
        return 0;
      });
    }

    return data;
  }, [items, search, priorityFilter, categoryFilter, confidenceFilter, sortKey, sortDir]);

  const paginatedData = useMemo(() => {
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    return filteredData.slice(start, end);
  }, [filteredData, page, pageSize]);

  const rowHeight = density === "compact" ? "h-9" : "h-12";
  const cellPadding = density === "compact" ? "px-3 py-1" : "px-4 py-3";

  const COLUMNS = {
    partNo: "140px",
    priority: "120px",
    category: "120px",
    recommendation: "1fr",
    volatility: "120px",
    forecastGrowth: "140px",
    confidence: "140px",
    timestamp: "140px",
    action: "100px",
  };

  const filters = [
    {
      label: "Priority",
      value: priorityFilter,
      onChange: setPriorityFilterSafe,
      options: ["ALL", "HIGH", "MEDIUM", "LOW"],
    },
    {
      label: "Category",
      value: categoryFilter,
      onChange: setCategoryFilterSafe,
      options: [
        "ALL",
        "RISK",
        "FORECAST",
        "OPTIMIZATION",
        "MONITORING",
        "SPARSE DEMAND",
        "INVENTORY",
      ],
    },
    {
      label: "Confidence",
      value: confidenceFilter,
      onChange: setConfidenceFilterSafe,
      options: ["ALL", "90-100", "75-89", "50-74", "0-49"],
    },
  ];

  const totalPages = Math.max(1, Math.ceil(filteredData.length / pageSize));
  const startItem = filteredData.length === 0 ? 0 : (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, filteredData.length);

  return (
    <div className="rounded-2xl border theme-border overflow-hidden theme-app">
      <div className="border-b theme-border bg-[var(--theme-card-soft)]">
        <div className="p-4">
          <div className="flex flex-wrap items-end gap-4">
            <div className="relative flex-1 min-w-[240px]">
              <label className="block text-[9px] theme-muted uppercase tracking-widest font-bold mb-1.5">
                Search
              </label>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 theme-muted" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearchSafe(e.target.value)}
                  placeholder="Part No, SKU, or recommendation..."
                  className="w-full h-9 pl-9 pr-3 rounded-lg border theme-border theme-bg-input theme-text text-xs placeholder:theme-subtle focus:outline-none focus:border-cyan-500/40 focus:shadow-[0_0_0_3px_rgba(6,182,212,0.12)] transition-all"
                />
              </div>
            </div>

            {filters.map((filter) => (
              <div key={filter.label} className="min-w-[130px]">
                <label className="block text-[9px] theme-muted uppercase tracking-widest font-bold mb-1.5">
                  {filter.label}
                </label>
                <div className="relative">
                  <select
                    value={filter.value}
                    onChange={(e) => filter.onChange(e.target.value)}
                    className="w-full h-9 pl-3 pr-8 rounded-lg border theme-border theme-bg-input theme-text text-xs appearance-none focus:outline-none focus:border-cyan-500/40 focus:shadow-[0_0_0_3px_rgba(6,182,212,0.12)] transition-all cursor-pointer"
                  >
                    {filter.options.map((opt) => (
                      <option key={opt} value={opt}>
                        {filter.label === "Confidence" && opt !== "ALL"
                          ? `${opt}%`
                          : opt}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 theme-muted pointer-events-none" />
                </div>
              </div>
            ))}

            <div className="min-w-[100px]">
              <label className="block text-[9px] theme-muted uppercase tracking-widest font-bold mb-1.5">
                Density
              </label>
              <button
                type="button"
                onClick={() => setDensity(density === "comfortable" ? "compact" : "comfortable")}
                className={`w-full h-9 px-3 rounded-lg border text-[10px] font-bold tracking-wider flex items-center justify-center gap-1.5 transition-all ${
                  density === "compact"
                    ? "border-cyan-500/40 bg-cyan-500/10 text-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.12)]"
                    : "theme-border theme-muted hover:border-cyan-500/30"
                }`}
              >
                {density === "compact" ? <LayoutList size={13} /> : <LayoutGrid size={13} />}
                {density === "compact" ? "Compact" : "Comfortable"}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table
          className="w-full border-collapse"
          style={{ tableLayout: "fixed", width: "100%" }}
        >
          <colgroup>
            <col style={{ width: COLUMNS.partNo }} />
            <col style={{ width: COLUMNS.priority }} />
            <col style={{ width: COLUMNS.category }} />
            <col style={{ width: COLUMNS.recommendation }} />
            <col style={{ width: COLUMNS.volatility }} />
            <col style={{ width: COLUMNS.forecastGrowth }} />
            <col style={{ width: COLUMNS.confidence }} />
            <col style={{ width: COLUMNS.timestamp }} />
            <col style={{ width: COLUMNS.action }} />
          </colgroup>
          <thead className="sticky top-0 z-20 theme-bg-header backdrop-blur-xl">
            <tr className={`${rowHeight} text-[10px] theme-muted uppercase tracking-[0.16em] font-bold`}>
              <th className={`text-left ${cellPadding}`}>Part No</th>
              <th className={`text-left ${cellPadding}`}>Priority</th>
              <th className={`text-left ${cellPadding}`}>Category</th>
              <th className={`text-left ${cellPadding}`}>Recommendation</th>
              <th
                className={`text-left ${cellPadding} cursor-pointer select-none hover:text-cyan-400 transition-colors`}
                onClick={() => handleSort("volatility")}
              >
                <span className="inline-flex items-center gap-1.5">
                  Volatility{" "}
                  {sortKey === "volatility" ? (
                    sortDir === "asc" ? (
                      <ArrowUp size={11} className="text-cyan-400" />
                    ) : (
                      <ArrowDown size={11} className="text-cyan-400" />
                    )
                  ) : (
                    <ArrowUpDown size={11} className="opacity-40" />
                  )}
                </span>
              </th>
              <th
                className={`text-left ${cellPadding} cursor-pointer select-none hover:text-cyan-400 transition-colors`}
                onClick={() => handleSort("forecastGrowth")}
              >
                <span className="inline-flex items-center gap-1.5">
                  Forecast Growth{" "}
                  {sortKey === "forecastGrowth" ? (
                    sortDir === "asc" ? (
                      <ArrowUp size={11} className="text-cyan-400" />
                    ) : (
                      <ArrowDown size={11} className="text-cyan-400" />
                    )
                  ) : (
                    <ArrowUpDown size={11} className="opacity-40" />
                  )}
                </span>
              </th>
              <th
                className={`text-left ${cellPadding} cursor-pointer select-none hover:text-cyan-400 transition-colors`}
                onClick={() => handleSort("confidence")}
              >
                <span className="inline-flex items-center gap-1.5">
                  Confidence{" "}
                  {sortKey === "confidence" ? (
                    sortDir === "asc" ? (
                      <ArrowUp size={11} className="text-cyan-400" />
                    ) : (
                      <ArrowDown size={11} className="text-cyan-400" />
                    )
                  ) : (
                    <ArrowUpDown size={11} className="opacity-40" />
                  )}
                </span>
              </th>
              <th
                className={`text-left ${cellPadding} cursor-pointer select-none hover:text-cyan-400 transition-colors`}
                onClick={() => handleSort("timestamp")}
              >
                <span className="inline-flex items-center gap-1.5">
                  Timestamp{" "}
                  {sortKey === "timestamp" ? (
                    sortDir === "asc" ? (
                      <ArrowUp size={11} className="text-cyan-400" />
                    ) : (
                      <ArrowDown size={11} className="text-cyan-400" />
                    )
                  ) : (
                    <ArrowUpDown size={11} className="opacity-40" />
                  )}
                </span>
              </th>
              <th className={`text-left ${cellPadding}`}>Action</th>
            </tr>
          </thead>

          <tbody>
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center py-16 theme-muted text-xs">
                  No recommendations match the current filters.
                </td>
              </tr>
            ) : (
              paginatedData.map((item, idx) => {
                const severity = item?.severity ?? "LOW";
                const category = (item?.category ?? "").toUpperCase();
                const partNo = item?.partNo ?? item?.partNumber ?? "";
                const title = item?.title ?? "";
                const reasoning = item?.reasoning ?? "";
                const time = formatTime(item?.timestamp);
                const confidence = getConfidenceValue(item?.confidence);

                const vol = getMetricValue(item, ["metrics.Volatility", "Volatility"], null);
                const growth = getMetricValue(item, ["metrics.ForecastGrowth", "ForecastGrowth"], null);

                const categoryStyle =
                  CATEGORY_STYLES[category] ??
                  "text-slate-300 bg-slate-500/10 border-slate-500/25";
                const severityStyle =
                  SEVERITY_STYLES[severity] ?? SEVERITY_STYLES.LOW;

                const confidenceColor =
                  confidence >= 75
                    ? "bg-emerald-400"
                    : confidence >= 50
                    ? "bg-amber-400"
                    : "bg-rose-400";

                const confidenceTextColor =
                  confidence >= 75
                    ? "text-emerald-400"
                    : confidence >= 50
                    ? "text-amber-400"
                    : "text-rose-400";

                const displayText = (title || reasoning || "").toString();
                const truncated =
                  displayText.length > 120 ? displayText.slice(0, 120) + "…" : displayText;

                const volDisplay = vol !== null && vol !== undefined ? vol.toFixed(2) : "—";
                const growthDisplay = growth !== null && growth !== undefined ? `${growth.toFixed(2)}x` : "—";

                return (
                  <tr
                    key={item?.id ?? `${partNo}-${idx}`}
                    className={`border-t border-theme-border/30 transition-all duration-200 cursor-pointer group ${rowHeight}`}
                    onClick={() => onRowClick?.(item)}
                    style={{ backgroundColor: "transparent" }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "rgba(0,180,255,0.03)";
                      e.currentTarget.style.boxShadow = "inset 3px 0 0 rgba(0,180,255,0.35)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "transparent";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  >
                    <td className={`${cellPadding} text-xs font-mono theme-text tracking-wide whitespace-nowrap`}>
                      {partNo || "—"}
                    </td>

                    <td className={`${cellPadding} whitespace-nowrap`}>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-md border text-[10px] font-bold tracking-wider ${severityStyle}`}
                      >
                        {severity}
                      </span>
                    </td>

                    <td className={`${cellPadding} whitespace-nowrap`}>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-md border text-[10px] font-bold tracking-wider ${categoryStyle}`}
                      >
                        {category || "—"}
                      </span>
                    </td>

                    <td className={`${cellPadding} text-xs theme-text`}>
                      <span className="font-medium leading-snug">{truncated}</span>
                    </td>

                    <td className={`${cellPadding} text-xs font-mono theme-muted whitespace-nowrap`}>
                      {volDisplay}
                    </td>

                    <td className={`${cellPadding} text-xs font-mono theme-muted whitespace-nowrap`}>
                      {growthDisplay}
                    </td>

                    <td className={`${cellPadding}`}>
                      <div className="flex items-center gap-2">
                        <div className="flex gap-[2px]">
                          {[0, 1, 2, 3].map((seg) => (
                            <div
                              key={seg}
                              className={`h-3.5 w-1 rounded-sm transition-all duration-300 ${
                                seg < Math.ceil(confidence / 25)
                                  ? confidenceColor
                                  : "bg-slate-700/40"
                              }`}
                            />
                          ))}
                        </div>
                        <span className={`text-[10px] font-mono font-bold w-8 text-right ${confidenceTextColor}`}>
                          {confidence}%
                        </span>
                      </div>
                    </td>

                    <td className={`${cellPadding} text-xs theme-muted whitespace-nowrap`}>
                      <div className="flex items-center gap-1.5">
                        <Clock3 size={11} className="theme-subtle" />
                        {time || "—"}
                      </div>
                    </td>

                    <td className={`${cellPadding} whitespace-nowrap`}>
                      <button
                        type="button"
                        className="text-[10px] font-bold tracking-wider theme-cyan hover:underline transition-all"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRowClick?.(item);
                        }}
                      >
                        OPEN
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="border-t theme-border px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
        <div className="text-[10px] theme-muted uppercase tracking-widest font-bold">
          Showing {startItem}-{endItem} of {filteredData.length.toLocaleString()}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] theme-muted uppercase tracking-wider font-bold">
            Per page:
          </span>
            {[25, 50, 100].map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => setPageSizeSafe(size)}
              className={`px-2.5 py-1 rounded-md border text-[10px] font-bold tracking-wider transition-all ${
                pageSize === size
                  ? "border-cyan-500/40 bg-cyan-500/10 text-cyan-400"
                  : "theme-border theme-muted hover:border-cyan-500/30"
              }`}
            >
              {size}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page <= 1}
            className="p-1.5 rounded-md border theme-border theme-muted hover:theme-cyan-border disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            aria-label="Previous page"
          >
            <ChevronDown size={14} className="rotate-90" />
          </button>
          <span className="text-[10px] theme-muted font-mono px-2">
            {page} / {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page >= totalPages}
            className="p-1.5 rounded-md border theme-border theme-muted hover:theme-cyan-border disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            aria-label="Next page"
          >
            <ChevronDown size={14} className="-rotate-90" />
          </button>
        </div>
      </div>
    </div>
  );
}
