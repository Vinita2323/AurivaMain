import React, { useState, useEffect, useCallback } from 'react';
import { 
  Bell, Check, Trash2, ArrowUpRight, RefreshCw, AlertCircle, 
  Send, Radio, Smartphone, CheckCircle2, ShieldCheck, Sparkles, Loader2 
} from 'lucide-react';
import { Link } from 'react-router-dom';
import AdminSidebar from '../components/AdminSidebar';
import AdminHeader from '../components/AdminHeader';
import { adminNotificationApi, fcmApi } from '../../../utils/api';
import pushNotificationService from '../../../services/pushNotificationService';

export default function AdminNotifications() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all', 'unread', 'read'
  const [actionInProgress, setActionInProgress] = useState(false);

  // FCM Push Notifications State
  const [fcmStatus, setFcmStatus] = useState(null);
  const [pushPermission, setPushPermission] = useState(pushNotificationService.getPermissionStatus());
  const [isEnablingPush, setIsEnablingPush] = useState(false);
  const [isSendingTestPush, setIsSendingTestPush] = useState(false);
  const [pushFeedback, setPushFeedback] = useState(null);

  // Fetch notifications from live backend API
  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await adminNotificationApi.getNotifications({
        status: filter !== 'all' ? filter : undefined,
        limit: 50
      });
      if (res && res.data) {
        setNotifications(res.data.notifications || []);
        if (typeof res.data.unreadCount === 'number') {
          setUnreadCount(res.data.unreadCount);
        }
      }
    } catch (err) {
      console.error('Failed to load admin notifications:', err);
      setError(err.message || 'Unable to connect to notifications service.');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  // Fetch unread count independently
  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await adminNotificationApi.getUnreadCount();
      if (res?.data?.unreadCount !== undefined) {
        setUnreadCount(res.data.unreadCount);
      }
    } catch (e) {
      // Fail silently
    }
  }, []);

  // Fetch backend FCM status
  const fetchFcmStatus = useCallback(async () => {
    try {
      const res = await fcmApi.getStatus();
      if (res && res.data) {
        setFcmStatus(res.data);
      }
    } catch (e) {
      console.warn('FCM status check notice:', e.message);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();
    fetchFcmStatus();
    pushNotificationService.initializePushNotifications().catch(() => {});
  }, [fetchNotifications, fetchUnreadCount, fetchFcmStatus]);

  // Request browser permission and register FCM device token
  const handleEnablePush = async () => {
    try {
      setIsEnablingPush(true);
      setPushFeedback(null);
      const res = await pushNotificationService.registerFCMToken(true);
      setPushPermission(pushNotificationService.getPermissionStatus());

      if (res.success) {
        setPushFeedback({
          type: 'success',
          message: 'Web push notifications enabled! Device token registered with backend.'
        });
        fetchFcmStatus();
      } else {
        setPushFeedback({
          type: 'warning',
          message: res.message || 'Notification permission was not granted.'
        });
      }
    } catch (err) {
      setPushFeedback({
        type: 'error',
        message: err.message || 'Failed to enable push notifications.'
      });
    } finally {
      setIsEnablingPush(false);
    }
  };

  // Send a test push notification to this device
  const handleSendTestPush = async () => {
    try {
      setIsSendingTestPush(true);
      setPushFeedback(null);
      const res = await fcmApi.sendTestNotification({
        title: 'Aurivá Order Dispatch Test 🔔',
        body: 'Roasted Makhana Order #ORD-2026 dispatched via Quick Delivery!',
        link: '/admin/orders'
      });

      if (res && res.data) {
        setPushFeedback({
          type: 'success',
          message: res.data?.status?.isInitialized 
            ? 'Live push notification dispatched through Firebase Cloud Messaging!' 
            : 'Push notification simulated in Standby Mode! (Logs written in backend)'
        });
      }
    } catch (err) {
      setPushFeedback({
        type: 'error',
        message: err.message || 'Could not send test push notification.'
      });
    } finally {
      setIsSendingTestPush(false);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      setActionInProgress(true);
      await adminNotificationApi.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    } finally {
      setActionInProgress(false);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await adminNotificationApi.markAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id || n._id === id ? { ...n, read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark as read:', err);
    }
  };

  const handleDeleteNotification = async (id) => {
    try {
      await adminNotificationApi.deleteNotification(id);
      const target = notifications.find(n => n.id === id || n._id === id);
      if (target && !target.read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      setNotifications(prev => prev.filter(n => n.id !== id && n._id !== id));
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex font-sans">
      <AdminSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <div className="flex-1 lg:pl-64 flex flex-col min-w-0 w-full">
        <AdminHeader onMenuClick={() => setIsSidebarOpen(true)} title="Notifications" />

        <main className="p-4 sm:p-6 lg:p-8 space-y-4 w-full font-sans">
          
          {/* Header Bar with Filter Tabs and Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <h2 className="font-sans text-base sm:text-lg font-bold text-[#0E2A1B]">Notifications</h2>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-[#0E2A1B] text-[#D4AF37] text-[11px] font-bold">
                  {unreadCount} unread
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Filter Tabs */}
              <div className="inline-flex bg-white rounded-lg p-0.5 border border-[#E8E2D5] text-xs font-semibold">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-3 py-1 rounded-md transition-all ${
                    filter === 'all'
                      ? 'bg-[#0E2A1B] text-[#D4AF37]'
                      : 'text-stone-500 hover:text-[#0E2A1B]'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilter('unread')}
                  className={`px-3 py-1 rounded-md transition-all ${
                    filter === 'unread'
                      ? 'bg-[#0E2A1B] text-[#D4AF37]'
                      : 'text-stone-500 hover:text-[#0E2A1B]'
                  }`}
                >
                  Unread
                </button>
                <button
                  onClick={() => setFilter('read')}
                  className={`px-3 py-1 rounded-md transition-all ${
                    filter === 'read'
                      ? 'bg-[#0E2A1B] text-[#D4AF37]'
                      : 'text-stone-500 hover:text-[#0E2A1B]'
                  }`}
                >
                  Read
                </button>
              </div>

              {/* Refresh Button */}
              <button
                onClick={fetchNotifications}
                disabled={loading}
                className="p-1.5 rounded-lg border border-[#E8E2D5] bg-white text-stone-500 hover:text-[#0E2A1B] hover:bg-stone-50 transition-colors"
                title="Refresh notifications"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              </button>

              {/* Mark All As Read */}
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  disabled={actionInProgress}
                  className="text-xs font-semibold text-stone-600 hover:text-[#0E2A1B] px-2.5 py-1.5 rounded-lg border border-[#E8E2D5] bg-white hover:bg-stone-50 flex items-center gap-1 transition-colors"
                >
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Mark all as read</span>
                </button>
              )}
            </div>
          </div>

          {/* FCM Push Notification Control Center */}
          <div className="bg-gradient-to-br from-[#0E2A1B] via-[#143D27] to-[#0E2A1B] text-white rounded-2xl p-5 sm:p-6 shadow-md border border-[#D4AF37]/30 relative overflow-hidden">
            {/* Background luxury subtle accents */}
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-1/3 -mb-16 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
              <div className="space-y-2 max-w-2xl">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <div className="w-8 h-8 rounded-lg bg-[#D4AF37]/20 border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37]">
                    <Radio className="w-4 h-4 animate-pulse" />
                  </div>
                  <h3 className="font-serif text-lg sm:text-xl font-bold tracking-tight text-white">
                    Firebase Cloud Messaging (FCM) Push Engine
                  </h3>
                  {fcmStatus?.isInitialized ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      <CheckCircle2 className="w-3 h-3" /> Live Delivery
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      <Sparkles className="w-3 h-3" /> Standby Mock Mode (Credentials Pending)
                    </span>
                  )}
                </div>

                <p className="text-xs sm:text-[13px] text-stone-300 font-normal leading-relaxed">
                  Real-time push delivery across Web & Mobile with multi-device token capping (10 tokens/user). Dispatches instant alerts on new orders, status changes, and stock alerts.
                </p>

                {/* Status Badges */}
                <div className="flex items-center gap-2 sm:gap-3 flex-wrap pt-1 text-xs">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/10 text-stone-200 border border-white/10">
                    <Smartphone className="w-3.5 h-3.5 text-[#D4AF37]" />
                    <span>Browser Permission: </span>
                    <strong className={`font-semibold ${
                      pushPermission === 'granted' ? 'text-emerald-400' : 
                      pushPermission === 'denied' ? 'text-rose-400' : 'text-amber-300'
                    }`}>
                      {pushPermission ? (pushPermission.charAt(0).toUpperCase() + pushPermission.slice(1)) : 'Default'}
                    </strong>
                  </span>

                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/10 text-stone-200 border border-white/10">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#D4AF37]" />
                    <span>Registered Devices: </span>
                    <strong className="text-white">
                      {fcmStatus?.activeTokensCount || 0} Web / {fcmStatus?.activeMobileTokensCount || 0} Mobile
                    </strong>
                  </span>

                  <span className="text-[11px] text-stone-400 hidden sm:inline">
                    Max 10 per account
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
                <button
                  onClick={handleEnablePush}
                  disabled={isEnablingPush}
                  className="px-4 py-2.5 rounded-xl bg-[#D4AF37] hover:bg-[#c5a030] text-[#0E2A1B] text-xs font-bold transition-all shadow-sm hover:shadow flex items-center justify-center gap-2 disabled:opacity-50"
                  id="enable-web-push-btn"
                >
                  {isEnablingPush ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Enabling...</span>
                    </>
                  ) : (
                    <>
                      <Radio className="w-4 h-4" />
                      <span>{pushPermission === 'granted' ? 'Sync Device Token' : 'Enable Web Push'}</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleSendTestPush}
                  disabled={isSendingTestPush}
                  className="px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/20 text-white text-xs font-semibold border border-white/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  id="send-test-push-btn"
                >
                  {isSendingTestPush ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-stone-300" />
                      <span>Dispatching...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5 text-[#D4AF37]" />
                      <span>Send Test Push</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Push Feedback Banner */}
            {pushFeedback && (
              <div className={`mt-4 p-3 rounded-xl border text-xs flex items-center justify-between gap-3 ${
                pushFeedback.type === 'success' 
                  ? 'bg-emerald-950/70 border-emerald-500/40 text-emerald-200' 
                  : pushFeedback.type === 'warning'
                  ? 'bg-amber-950/70 border-amber-500/40 text-amber-200'
                  : 'bg-rose-950/70 border-rose-500/40 text-rose-200'
              }`}>
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 shrink-0 text-[#D4AF37]" />
                  <span>{pushFeedback.message}</span>
                </div>
                <button 
                  onClick={() => setPushFeedback(null)} 
                  className="text-white/60 hover:text-white text-xs px-1.5 py-0.5 rounded hover:bg-white/10"
                >
                  ✕
                </button>
              </div>
            )}
          </div>

          {/* Error Banner */}
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Notifications List Container */}
          <div className="bg-white rounded-xl border border-[#E8E2D5] shadow-2xs divide-y divide-stone-100 overflow-hidden w-full">
            {loading ? (
              <div className="p-8 space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex items-center gap-3 animate-pulse">
                    <div className="w-2 h-2 rounded-full bg-stone-200 shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3.5 bg-stone-200 rounded w-1/3" />
                      <div className="h-3 bg-stone-100 rounded w-2/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-12 text-center text-stone-400 space-y-1">
                <Bell className="w-8 h-8 mx-auto text-stone-300 stroke-[1.5]" />
                <p className="text-xs font-medium">No notifications right now</p>
                <p className="text-[11px] text-stone-400">Order updates, inventory alerts, and customer activity will appear here.</p>
              </div>
            ) : (
              notifications.map((n) => {
                const notifId = n.id || n._id;
                const linkTarget = n.link || (n.type?.startsWith('ORDER') ? '/admin/orders' : (n.type === 'LOW_STOCK' ? '/admin/inventory' : '/admin/orders'));
                return (
                  <div
                    key={notifId}
                    className={`p-3.5 sm:p-4 flex items-center justify-between gap-3 transition-colors hover:bg-stone-50/80 ${
                      !n.read ? 'bg-amber-50/20' : ''
                    }`}
                  >
                    <div className="flex items-start sm:items-center gap-3 min-w-0">
                      {/* Unread indicator dot */}
                      <span
                        className={`w-2 h-2 rounded-full shrink-0 mt-1.5 sm:mt-0 ${
                          !n.read ? 'bg-[#D4AF37]' : 'bg-transparent'
                        }`}
                      />

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Link
                            to={linkTarget}
                            onClick={() => handleMarkAsRead(notifId)}
                            className="font-sans text-xs sm:text-[13px] font-bold text-[#0E2A1B] hover:text-[#D4AF37] transition-colors truncate"
                          >
                            {n.title}
                          </Link>
                          <span className="text-[11px] text-stone-400 font-normal shrink-0">
                            • {n.time || 'Just now'}
                          </span>
                        </div>
                        <p className="text-xs text-stone-500 font-normal truncate mt-0.5">
                          {n.message || n.description}
                        </p>
                      </div>
                    </div>

                    {/* Actions on right */}
                    <div className="flex items-center gap-2 shrink-0">
                      <Link
                        to={linkTarget}
                        onClick={() => handleMarkAsRead(notifId)}
                        className="text-stone-400 hover:text-[#0E2A1B] p-1.5 rounded-md hover:bg-stone-100 transition-colors"
                        title="View details"
                      >
                        <ArrowUpRight className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => handleDeleteNotification(notifId)}
                        className="text-stone-300 hover:text-rose-600 p-1.5 rounded-md hover:bg-rose-50 transition-colors"
                        title="Dismiss notification"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

        </main>
      </div>
    </div>
  );
}
