import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Menu, Bell, Volume2, VolumeX, CheckCircle2, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import NewOrderAlertModal from './NewOrderAlertModal';
import { adminNotificationApi, adminOrderApi } from '../../../utils/api';
import { formatOrder } from '../../../context/AuthContext';
import { useAdmin } from '../../../context/AdminContext';
import useOrderAlertSound from '../../../hooks/useOrderAlertSound';

const HANDLED_IDS_KEY = 'auriva_admin_handled_order_ids';
const QUEUE_KEY = 'auriva_admin_order_alert_queue';
const POLL_INTERVAL_MS = 5_000;

function orderKey(order) {
  return String(order?._id || order?.id || order?.orderNumber || '');
}

function readHandledIds() {
  try {
    const raw = sessionStorage.getItem(HANDLED_IDS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(parsed) ? parsed.map(String) : []);
  } catch {
    return new Set();
  }
}

function writeHandledIds(set) {
  try {
    sessionStorage.setItem(HANDLED_IDS_KEY, JSON.stringify([...set].slice(-120)));
  } catch {
    /* ignore */
  }
}

function readQueue() {
  try {
    const raw = sessionStorage.getItem(QUEUE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeQueue(queue) {
  try {
    sessionStorage.setItem(QUEUE_KEY, JSON.stringify(queue.slice(0, 20)));
  } catch {
    /* ignore */
  }
}

export default function AdminHeader({ onMenuClick, title = 'Dashboard' }) {
  const { adminUser, settings } = useAdmin();
  const { muted, toggleMute, start: startAlertSound, stop: stopAlertSound } = useOrderAlertSound();

  const displayName = adminUser?.name || 'Admin Manager';
  const initials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('') || 'AD';
  const hubLabel = settings?.warehouseCity
    ? `${settings.warehouseCity} Hub`
    : 'Sonipat Hub';

  const pickupAddress =
    settings?.hubAddress ||
    [
      settings?.warehouseName,
      settings?.warehouseAddress,
      settings?.warehouseCity,
      settings?.warehouseState,
      settings?.warehousePincode
    ]
      .filter(Boolean)
      .join(', ') ||
    'AURIVÁ Fulfillment Hub';

  const [unreadCount, setUnreadCount] = useState(0);
  const [pendingOrders, setPendingOrders] = useState(() => readQueue());
  const [alertOrder, setAlertOrder] = useState(null);
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');
  const [toast, setToast] = useState(null);

  const pollRef = useRef(null);
  const handledIdsRef = useRef(readHandledIds());
  const toastTimerRef = useRef(null);
  const alertOrderRef = useRef(null);

  const showToast = useCallback((type, message) => {
    setToast({ type, message });
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(null), 3500);
  }, []);

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
    return () => {
      isMounted = false;
      clearInterval(iv);
    };
  }, []);

  const markHandled = useCallback((orderOrId) => {
    const key = typeof orderOrId === 'string' || typeof orderOrId === 'number'
      ? String(orderOrId)
      : orderKey(orderOrId);
    if (!key) return;
    handledIdsRef.current.add(key);
    writeHandledIds(handledIdsRef.current);
  }, []);

  const enqueueFreshOrders = useCallback((ordersRaw) => {
    if (!Array.isArray(ordersRaw) || ordersRaw.length === 0) return;

    const activeKey = orderKey(alertOrderRef.current);
    const fresh = [];

    for (const o of ordersRaw) {
      const formatted = formatOrder(o);
      const key = orderKey(formatted);
      if (!key) continue;
      // Skip only if already accepted / rejected / dismissed this session
      if (handledIdsRef.current.has(key)) continue;
      if (activeKey && key === activeKey) continue;
      fresh.push(formatted);
    }

    if (fresh.length === 0) return;

    setPendingOrders((prev) => {
      const combined = [...prev, ...fresh];
      const seen = new Set();
      const next = combined.filter((ord) => {
        const id = orderKey(ord);
        if (!id || seen.has(id) || handledIdsRef.current.has(id)) return false;
        if (activeKey && id === activeKey) return false;
        seen.add(id);
        return true;
      });
      writeQueue(next);
      return next;
    });
  }, []);

  const checkForNewOrders = useCallback(async () => {
    if (typeof document !== 'undefined' && document.hidden) return;
    try {
      const res = await adminOrderApi.getAllOrders({
        page: 1,
        limit: 15,
        status: 'Order Received',
        sortBy: 'createdAt:desc'
      });
      const orders = res?.data?.orders;
      if (!Array.isArray(orders)) {
        console.warn('[NewOrderAlert] Unexpected orders payload', res);
        return;
      }
      enqueueFreshOrders(orders);
    } catch (err) {
      console.warn('[NewOrderAlert] Poll failed:', err?.message || err);
    }
  }, [enqueueFreshOrders]);

  // Keep queue persisted across admin page navigations
  useEffect(() => {
    writeQueue(pendingOrders);
  }, [pendingOrders]);

  // Queue → currently displayed modal
  useEffect(() => {
    if (!alertOrder && pendingOrders.length > 0) {
      setActionError('');
      setActionSuccess('');
      const next = pendingOrders[0];
      setAlertOrder(next);
      alertOrderRef.current = next;
      setPendingOrders((prev) => {
        const rest = prev.slice(1);
        writeQueue(rest);
        return rest;
      });
    }
  }, [pendingOrders, alertOrder]);

  // Ringtone for the active alert only
  useEffect(() => {
    if (alertOrder) {
      const id = alertOrder._id || alertOrder.id || alertOrder.orderNumber;
      startAlertSound(id);
    } else {
      stopAlertSound();
    }
    return () => stopAlertSound();
  }, [alertOrder, startAlertSound, stopAlertSound]);

  useEffect(() => {
    // Clear legacy last-seen gate that previously suppressed still-open CONFIRMED orders
    try {
      localStorage.removeItem('auriva_admin_last_seen_order_ts');
      sessionStorage.removeItem('auriva_admin_alerted_order_ids');
    } catch (_) { /* ignore */ }

    checkForNewOrders();
    pollRef.current = setInterval(checkForNewOrders, POLL_INTERVAL_MS);

    const onVisibility = () => {
      if (!document.hidden) checkForNewOrders();
    };
    const onPush = (event) => {
      const type = event?.detail?.type || event?.detail?.data?.type;
      if (!type || String(type).toUpperCase().includes('ORDER')) {
        checkForNewOrders();
      }
    };

    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('auriva:new-order', onPush);
    window.addEventListener('auriva:fcm-message', onPush);

    return () => {
      clearInterval(pollRef.current);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('auriva:new-order', onPush);
      window.removeEventListener('auriva:fcm-message', onPush);
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, [checkForNewOrders]);

  const closeAlert = (markAsHandled = true) => {
    if (markAsHandled && alertOrderRef.current) {
      markHandled(alertOrderRef.current);
    }
    stopAlertSound();
    setAlertOrder(null);
    alertOrderRef.current = null;
    setActionError('');
  };

  const handleAcceptOrder = async (orderId) => {
    setActionError('');
    setActionSuccess('');
    try {
      // Accept → ACCEPTED (not PACKED). Pack only from Orders dropdown / fulfillment.
      try {
        const detail = await adminOrderApi.getOrderById(orderId);
        const status = String(detail?.data?.order?.status || detail?.data?.status || '').toUpperCase();
        if (status === 'CANCELLED' || status === 'CANCELED') {
          const msg = 'This order was cancelled and is no longer available.';
          setActionError(msg);
          showToast('error', msg);
          stopAlertSound();
          setTimeout(() => {
            markHandled(orderId);
            setAlertOrder(null);
            alertOrderRef.current = null;
            checkForNewOrders();
          }, 1600);
          return;
        }
        if (status === 'PACKED' || status === 'SHIPPED' || status === 'OUT_FOR_DELIVERY' || status === 'DELIVERED') {
          const msg = `This order was already processed (status: ${status}).`;
          setActionError(msg);
          showToast('error', msg);
          stopAlertSound();
          setTimeout(() => {
            markHandled(orderId);
            setAlertOrder(null);
            alertOrderRef.current = null;
          }, 1600);
          return;
        }
      } catch (_) {
        // Continue — accept API will validate
      }

      await adminOrderApi.updateStatus(orderId, 'Accepted', 'Order accepted by admin');
      stopAlertSound();
      setActionSuccess('Order accepted successfully!');
      showToast('success', 'Order accepted successfully!');
      markHandled(orderId);
      try {
        window.dispatchEvent(
          new CustomEvent('auriva:order-alert-accepted', { detail: { orderId } })
        );
      } catch (_) { /* ignore */ }
      setTimeout(() => {
        setAlertOrder(null);
        alertOrderRef.current = null;
        setActionSuccess('');
      }, 700);
    } catch (err) {
      const msg =
        err?.message ||
        'Could not accept this order. Please try again.';
      setActionError(msg);
      showToast('error', msg);
    }
  };

  const handleRejectOrder = async (orderId, reason) => {
    setActionError('');
    setActionSuccess('');
    try {
      await adminOrderApi.cancelOrder(orderId, reason || 'Rejected by admin');
      stopAlertSound();
      setActionSuccess('Order rejected successfully.');
      showToast('success', 'Order rejected successfully.');
      markHandled(orderId);
      setTimeout(() => {
        setAlertOrder(null);
        alertOrderRef.current = null;
        setActionSuccess('');
      }, 700);
    } catch (err) {
      const msg = err?.message || 'Could not reject this order. Please try again.';
      setActionError(msg);
      showToast('error', msg);
    }
  };

  const handleDismissAlert = () => {
    closeAlert(true);
  };

  return (
    <>
      <header className="sticky top-0 z-30 bg-white border-b border-[#E8E2D5] px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-xs font-sans">
        <div className="flex items-center gap-3">
          <button
            type="button"
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

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={toggleMute}
            className="p-2 rounded-xl bg-stone-50 border border-stone-200 text-stone-600 hover:text-[#0E2A1B] hover:bg-stone-100 transition-colors"
            title={muted ? 'Unmute order alert sound' : 'Mute order alert sound'}
            aria-label={muted ? 'Unmute alerts' : 'Mute alerts'}
          >
            {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

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

          <Link
            to="/admin/profile"
            className="flex items-center gap-2.5 pl-2 sm:pl-3 border-l border-stone-200 hover:bg-stone-50 p-1.5 rounded-xl transition-all cursor-pointer group text-left"
            title="Open Admin Profile"
          >
            <div className="w-8.5 h-8.5 rounded-full bg-[#0E2A1B] text-[#D4AF37] font-bold text-xs flex items-center justify-center border border-[#D4AF37] group-hover:scale-105 transition-transform shadow-2xs">
              {initials}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-xs sm:text-[13px] font-bold text-[#0E2A1B] group-hover:text-[#D4AF37] transition-colors leading-tight">{displayName}</p>
              <p className="text-[11px] text-stone-400 font-medium">{hubLabel}</p>
            </div>
          </Link>
        </div>
      </header>

      {toast && (
        <div className="fixed top-16 right-4 z-[1000] max-w-sm animate-in fade-in slide-in-from-top-2 duration-200">
          <div
            className={`flex items-start gap-2 rounded-xl border px-3.5 py-3 shadow-lg text-sm font-semibold ${
              toast.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-rose-50 border-rose-200 text-rose-900'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            )}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {alertOrder && (
        <NewOrderAlertModal
          order={alertOrder}
          pendingCount={1 + pendingOrders.length}
          pickupAddress={pickupAddress}
          muted={muted}
          onToggleMute={toggleMute}
          actionError={actionError}
          actionSuccess={actionSuccess}
          onAccept={handleAcceptOrder}
          onReject={handleRejectOrder}
          onClose={handleDismissAlert}
        />
      )}
    </>
  );
}
