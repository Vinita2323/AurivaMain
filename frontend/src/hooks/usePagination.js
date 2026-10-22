import { useEffect, useMemo, useState } from 'react';

/**
 * Client-side pagination for an already-filtered list.
 * Resets to page 1 whenever `resetKey` changes (e.g. search text / filters),
 * and clamps the page if the list shrinks (e.g. after a delete).
 */
export default function usePagination(items, { initialPageSize = 10, resetKey = '' } = {}) {
  const list = Array.isArray(items) ? items : [];
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  const totalItems = list.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  useEffect(() => {
    setPage(1);
  }, [resetKey, pageSize]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const safePage = Math.min(page, totalPages);
  const startIndex = (safePage - 1) * pageSize;

  const pageItems = useMemo(
    () => list.slice(startIndex, startIndex + pageSize),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [list, startIndex, pageSize]
  );

  return {
    page: safePage,
    setPage,
    pageSize,
    setPageSize,
    totalItems,
    totalPages,
    pageItems,
    from: totalItems === 0 ? 0 : startIndex + 1,
    to: Math.min(startIndex + pageSize, totalItems)
  };
}
