import { ChevronLeft, ChevronRight } from "lucide-react";

function pageWindow(currentPage, totalPages, windowSize = 5) {
  if (totalPages <= 1) return [1];
  const half = Math.floor(windowSize / 2);
  let start = Math.max(1, currentPage - half);
  let end = Math.min(totalPages, start + windowSize - 1);
  start = Math.max(1, end - windowSize + 1);
  const pages = [];
  for (let p = start; p <= end; p += 1) pages.push(p);
  return pages;
}

export default function PaginationControls({
  page,
  totalPages,
  pageSize,
  totalItems,
  onPageChange,
}) {
  const safeTotalPages = Math.max(1, totalPages || 1);
  const safePage = Math.min(Math.max(1, page || 1), safeTotalPages);

  const start = totalItems === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const end = Math.min(totalItems, safePage * pageSize);

  const pages = pageWindow(safePage, safeTotalPages, 7);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div className="text-[10px] theme-muted uppercase tracking-widest">
        Showing {start}-{end} of {totalItems}
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, safePage - 1))}
          disabled={safePage <= 1}
          className="p-2 rounded-lg border theme-border theme-muted hover:theme-cyan-border disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Previous page"
        >
          <ChevronLeft size={16} />
        </button>

        <div className="flex items-center gap-1">
          {pages.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => onPageChange(p)}
              className={`px-3 py-2 rounded-lg border text-[10px] font-bold tracking-wider transition-all ${
                p === safePage
                  ? "bg-cyan-500 text-slate-950 border-cyan-400 shadow-[0_0_14px_rgba(34,211,238,0.25)]"
                  : "theme-bg-card-soft theme-border theme-muted hover:theme-cyan-border hover:theme-cyan"
              }`}
            >
              {p}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => onPageChange(Math.min(safeTotalPages, safePage + 1))}
          disabled={safePage >= safeTotalPages}
          className="p-2 rounded-lg border theme-border theme-muted hover:theme-cyan-border disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Next page"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
