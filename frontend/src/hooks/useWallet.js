import { useCallback, useEffect, useRef, useState } from 'react';
import { walletApi } from '../utils/api';

export const WALLET_CHANGED_EVENT = 'auriva:wallet-changed';

/** Tell every mounted wallet view to refresh right now (e.g. after an order is placed). */
export const notifyWalletChanged = () => {
  try {
    window.dispatchEvent(new Event(WALLET_CHANGED_EVENT));
  } catch {
    /* non-browser env */
  }
};

/**
 * The signed-in customer's wallet, kept live: loads on mount, polls while the tab is visible,
 * refreshes when the tab regains focus, and when something calls notifyWalletChanged().
 *
 * @param {object}  opts
 * @param {boolean} opts.enabled     skip all network work when false (e.g. logged out)
 * @param {number}  opts.intervalMs  poll interval; 0 disables polling
 * @param {number}  opts.limit       transactions per page
 */
export default function useWallet({ enabled = true, intervalMs = 15000, limit = 15 } = {}) {
  const [balance, setBalance] = useState(null); // null = not loaded yet
  const [transactions, setTransactions] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(Boolean(enabled));
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [updatedAt, setUpdatedAt] = useState(null);
  const pageRef = useRef(1);

  // Re-fetches pages 1..current so already-loaded rows stay in sync with the server
  const refresh = useCallback(
    async ({ silent = false } = {}) => {
      if (!enabled) return;
      if (!silent) setLoading(true);
      try {
        const pages = pageRef.current;
        let rows = [];
        let latest = null;
        for (let p = 1; p <= pages; p += 1) {
          const res = await walletApi.getWallet({ page: p, limit });
          latest = res?.data;
          rows = rows.concat(latest?.transactions || []);
        }
        if (latest) {
          setBalance(Number(latest.balance) || 0);
          setTransactions(rows);
          setPagination(latest.pagination || { total: rows.length, page: pages, totalPages: pages });
          setUpdatedAt(new Date());
          setError('');
        }
      } catch (err) {
        setError(err?.message || 'Could not load your wallet.');
      } finally {
        setLoading(false);
      }
    },
    [enabled, limit]
  );

  const loadMore = useCallback(async () => {
    if (!enabled || loadingMore || pageRef.current >= (pagination.totalPages || 1)) return;
    setLoadingMore(true);
    try {
      const next = pageRef.current + 1;
      const res = await walletApi.getWallet({ page: next, limit });
      pageRef.current = next;
      setTransactions((prev) => prev.concat(res?.data?.transactions || []));
      setPagination(res?.data?.pagination || pagination);
      setBalance(Number(res?.data?.balance) || 0);
    } catch (err) {
      setError(err?.message || 'Could not load more transactions.');
    } finally {
      setLoadingMore(false);
    }
  }, [enabled, limit, loadingMore, pagination]);

  useEffect(() => {
    if (!enabled) {
      setBalance(null);
      setTransactions([]);
      setLoading(false);
      return undefined;
    }
    pageRef.current = 1;
    refresh();

    const refreshIfVisible = () => {
      if (document.visibilityState === 'visible') refresh({ silent: true });
    };
    const timer = intervalMs > 0 ? setInterval(refreshIfVisible, intervalMs) : null;
    document.addEventListener('visibilitychange', refreshIfVisible);
    window.addEventListener('focus', refreshIfVisible);
    const onChanged = () => refresh({ silent: true });
    window.addEventListener(WALLET_CHANGED_EVENT, onChanged);
    return () => {
      if (timer) clearInterval(timer);
      document.removeEventListener('visibilitychange', refreshIfVisible);
      window.removeEventListener('focus', refreshIfVisible);
      window.removeEventListener(WALLET_CHANGED_EVENT, onChanged);
    };
  }, [enabled, intervalMs, refresh]);

  return {
    balance,
    transactions,
    pagination,
    loading,
    loadingMore,
    error,
    updatedAt,
    hasMore: pageRef.current < (pagination.totalPages || 1),
    refresh,
    loadMore
  };
}
