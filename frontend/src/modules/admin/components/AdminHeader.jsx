import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Menu, Bell } from 'lucide-react';
import { Link } from 'react-router-dom';
import AdminProfileModal from './AdminProfileModal';
import NewOrderAlertModal from './NewOrderAlertModal';
import { adminNotificationApi, adminOrderApi } from '../../../utils/api';
import { formatOrder } from '../../../context/AuthContext';

const NEW_ORDER_LS_KEY = 'auriva_admin_last_seen_order_ts';
const POLL_INTERVAL_MS = 15_000; // 15 seconds

export default function AdminHeader({ onMenuClick, title = "Dashboard" }) {
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // New-order alert state
  const [pendingOrders, setPendingOrders] = useState([]);   // queue of new orders
  const [alertOrder, setAlertOrder] = useState(null);       // currently displayed order
  const pollRef = useRef(null);

  // ── Notification unread count poll (30s) ──────────────────────────────
  useEffect(() => {
    let isMounted = true;
    const loadUnread = async () => {
      try {
        const res = await adminNotificationApi.getUnreadCount();
        if (isMounted && res?.data?.unreadCount !== undefined) {
          setUnreadCount(res.data.unreadCount);
        }
      } catch (_) { /* silent */ }
    };
    loadUnread();
    const iv = setInterval(loadUnread, 30_000);
    return () => { isMounted = false; clearInterval(iv); };
  }, []);

  // ── New-order polling (15s) ───────────────────────────────────────────
  const checkForNewOrders = useCallback(async () => {
    try {
      // Fetch the most recent confirmed/new orders (page 1, limit 5, newest first)
      const res = await adminOrderApi.getAllOrders({ page: 1, limit: 5, status: 'Order Received' });
      const orders = res?.data?.orders;
      if (!Array.isArray(orders) || orders.length === 0) return;

      const lastSeenTs = Number(localStorage.getItem(NEW_ORDER_LS_KEY) || 0);
      const freshOrders = orders
        .filter(o => {
          const ts = o.createdAt ? new Date(o.createdAt).getTime() : 0;
          return ts > lastSeenTs;
        })
        .map(formatOrder);

      if (freshOrders.length === 0) return;

      // Update last-seen to newest order's timestamp
      const newestTs = Math.max(
        ...orders.map(o => (o.createdAt ? new Date(o.createdAt).getTime() : 0))
      );
      localStorage.setItem(NEW_ORDER_LS_KEY, String(newestTs));

      // Push to queue – show first immediately
      setPendingOrders(prev => {
        const combined = [...prev, ...freshOrders];
        // Deduplicate by id
        const seen = new Set();
        return combined.filter(o => {
          if (seen.has(o.id)) return false;
          seen.add(o.id);
          return true;
        });
      });
    } catch (_) { /* silent poll failure */ }
  }, []);

  // Show next alert whenever queue changes and none is displayed
  useEffect(() => {
    if (!alertOrder && pendingOrders.length > 0) {
      setAlertOrder(pendingOrders[0]);
      setPendingOrders(prev => prev.slice(1));
    }
  }, [pendingOrders, alertOrder]);

  useEffect(() => {
    // Run immediately on mount, then on interval
    checkForNewOrders();
    pollRef.current = setInterval(checkForNewOrders, POLL_INTERVAL_MS);
    return () => clearInterval(pollRef.current);
  }, [checkForNewOrders]);

  // ── Alert action handlers ─────────────────────────────────────────────
  const handleAcceptOrder = async (orderId) => {
    try {
      await adminOrderApi.updateStatus(orderId, 'Packed', 'Order accepted by admin');
    } catch (err) {
      console.warn('[NewOrderAlert] Accept error:', err.message);
    } finally {
      setAlertOrder(null);
    }
  };

  const handleRejectOrder = async (orderId, reason) => {
    try {
      await adminOrderApi.cancelOrder(orderId, reason || 'Rejected by admin');
    } catch (err) {
      console.warn('[NewOrderAlert] Reject error:', err.message);
    } finally {
      setAlertOrder(null);
    }
  };

  const handleDismissAlert = () => {
    setAlertOrder(null);
  };

  return (
    <>
      <header className="sticky top-0 z-30 bg-white border-b border-[#E8E2D5] px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-xs font-sans">
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-xl text-stone-600 hover:bg-stone-100 transition-colors"
            aria-label="Toggle menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <h1 className="font-sans text-lg sm:text-xl font-bold text-[#0E2A1B]">
            {title}
          </h1>
        </div>

        <div className="flex items-center gap-3 sm:gap-4">
          {/* Notifications Button */}
          <Link
            to="/admin/notifications"
            className="relative p-2 rounded-xl bg-stone-50 border border-stone-200 text-stone-600 hover:text-[#0E2A1B] hover:bg-stone-100 transition-colors"
            title="View Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-[#D4AF37] text-[#0E2A1B] text-[10px] font-extrabold px-1 min-w-4 h-4 rounded-full flex items-center justify-center ring-2 ring-white shadow-2xs">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </Link>

          {/* Interactive Admin Avatar & Profile Button */}
          <button
            onClick={() => setIsProfileModalOpen(true)}
            className="flex items-center gap-2.5 pl-2 sm:pl-3 border-l border-stone-200 hover:bg-stone-50 p-1.5 rounded-xl transition-all cursor-pointer group text-left"
            title="Open Admin Profile"
          >
            <div className="w-8.5 h-8.5 rounded-full bg-[#0E2A1B] text-[#D4AF37] font-bold text-xs flex items-center justify-center border border-[#D4AF37] group-hover:scale-105 transition-transform shadow-2xs">
              AD
            </div>
            <div className="hidden md:block text-left">
              <p className="text-xs sm:text-[13px] font-bold text-[#0E2A1B] group-hover:text-[#D4AF37] transition-colors leading-tight">Admin Manager</p>
              <p className="text-[11px] text-stone-400 font-medium">Head Office</p>
            </div>
          </button>
        </div>
      </header>

      {/* Admin Profile Modal */}
      <AdminProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />

      {/* New Order Alert Modal */}
      {alertOrder && (
        <NewOrderAlertModal
          order={alertOrder}
          pendingCount={1 + pendingOrders.length}
          onAccept={handleAcceptOrder}
          onReject={handleRejectOrder}
          onClose={handleDismissAlert}
        />
      )}
    </>
  );
}


