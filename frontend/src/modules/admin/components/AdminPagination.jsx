import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

// 1 … 4 5 [6] 7 8 … 20
function pageWindow(page, totalPages) {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
  const pages = new Set([1, totalPages, page - 1, page, page + 1]);
  if (page <= 3) [2, 3, 4].forEach((p) => pages.add(p));
  if (page >= totalPages - 2) [totalPages - 3, totalPages - 2, totalPages - 1].forEach((p) => pages.add(p));
  const sorted = [...pages].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b);
  const out = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) out.push('…');
    out.push(p);
  });
  return out;
}

/**
 * Pagination bar for admin tables. Pair with hooks/usePagination.
 * `pagination` is the object returned by usePagination; `label` is the item noun ("products").
 */
export default function AdminPagination({ pagination, label = 'items' }) {
  const { page, setPage, totalItems, totalPages, from, to } = pagination;

  const btn =
    'min-w-[34px] h-8 px-2 rounded-lg border text-xs font-semibold transition-colors flex items-center justify-center';

  return (
    <div className="p-3.5 border-t border-stone-200 bg-[#FAF7F2] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs sm:text-sm text-stone-500">
      <span className="font-medium">
        {totalItems === 0 ? `No ${label}` : `Showing ${from}–${to} of ${totalItems} ${label}`}
      </span>

      <nav className="flex items-center gap-1 sm:ml-auto" aria-label="Pagination">
        <button
          type="button"
          onClick={() => setPage(page - 1)}
          disabled={page <= 1}
          className={`${btn} border-stone-300 bg-white text-stone-700 hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed`}
          aria-label="Previous page"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {pageWindow(page, totalPages).map((p, i) =>
          p === '…' ? (
            <span key={`gap-${i}`} className="px-1 text-stone-400">…</span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => setPage(p)}
              aria-current={p === page ? 'page' : undefined}
              className={`${btn} ${
                p === page
                  ? 'bg-[#0E2A1B] border-[#0E2A1B] text-[#D4AF37]'
                  : 'border-stone-300 bg-white text-stone-700 hover:bg-stone-50'
              }`}
            >
              {p}
            </button>
          )
        )}

        <button
          type="button"
          onClick={() => setPage(page + 1)}
          disabled={page >= totalPages}
          className={`${btn} border-stone-300 bg-white text-stone-700 hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed`}
          aria-label="Next page"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </nav>
    </div>
  );
}
