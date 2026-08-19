import React, { useState } from 'react';
import { Bell, Check, Trash2, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import AdminSidebar from '../components/AdminSidebar';
import AdminHeader from '../components/AdminHeader';

export default function AdminNotifications() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [notifications, setNotifications] = useState([
    {
      id: 'notif-1',
      title: 'New Prepaid Order #AV10033',
      description: 'Order placed by Vini Sharma (₹459) via Standard Express delivery.',
      time: '10m ago',
      read: false,
      link: '/admin/orders',
    },
    {
      id: 'notif-2',
      title: 'Low Stock Warning: Peri Peri Makhana',
      description: 'Warehouse stock has fallen to 28 units remaining.',
      time: '45m ago',
      read: false,
      link: '/admin/inventory',
    },
    {
      id: 'notif-3',
      title: 'New Customer Review',
      description: 'Dr. Arjun Mehta gave a 5.0 rating on Roasted Classic Makhana.',
      time: '2h ago',
      read: false,
      link: '/admin/reviews',
    },
    {
      id: 'notif-4',
      title: 'Shipment Dispatched #TRK99214',
      description: 'Consignment handed over to Delhivery logistics partner.',
      time: '3h ago',
      read: true,
      link: '/admin/orders',
    },
    {
      id: 'notif-5',
      title: 'Coupon Milestone Reached',
      description: 'Voucher code MONSOON20 was redeemed 500 times.',
      time: '5h ago',
      read: true,
      link: '/admin/coupons',
    },
    {
      id: 'notif-6',
      title: 'Database Backup Completed',
      description: 'Automatic system snapshot saved securely.',
      time: '8h ago',
      read: true,
      link: '/admin/settings',
    }
  ]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const markAsRead = (id) => {
    setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const deleteNotification = (id) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex font-sans">
      <AdminSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <div className="flex-1 lg:pl-64 flex flex-col min-w-0 w-full">
        <AdminHeader onMenuClick={() => setIsSidebarOpen(true)} title="Notifications" />

        <main className="p-4 sm:p-6 lg:p-8 space-y-4 w-full font-sans">
          
          {/* Simple Header Bar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="font-sans text-base sm:text-lg font-bold text-[#0E2A1B]">All Notifications</h2>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-[#0E2A1B] text-[#D4AF37] text-[11px] font-bold">
                  {unreadCount} unread
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs font-semibold text-stone-600 hover:text-[#0E2A1B] flex items-center gap-1 transition-colors"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Mark all as read</span>
              </button>
            )}
          </div>

          {/* Single Clean List Card */}
          <div className="bg-white rounded-xl border border-[#E8E2D5] shadow-2xs divide-y divide-stone-100 overflow-hidden w-full">
            {notifications.length === 0 ? (
              <div className="p-12 text-center text-stone-400 space-y-1">
                <Bell className="w-8 h-8 mx-auto text-stone-300 stroke-[1.5]" />
                <p className="text-xs font-medium">No notifications right now</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
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
                          to={n.link}
                          onClick={() => markAsRead(n.id)}
                          className="font-sans text-xs sm:text-[13px] font-bold text-[#0E2A1B] hover:text-[#D4AF37] transition-colors truncate"
                        >
                          {n.title}
                        </Link>
                        <span className="text-[11px] text-stone-400 font-normal shrink-0">• {n.time}</span>
                      </div>
                      <p className="text-xs text-stone-500 font-normal truncate mt-0.5">
                        {n.description}
                      </p>
                    </div>
                  </div>

                  {/* Actions on right */}
                  <div className="flex items-center gap-2 shrink-0">
                    <Link
                      to={n.link}
                      onClick={() => markAsRead(n.id)}
                      className="text-stone-400 hover:text-[#0E2A1B] p-1.5 rounded-md hover:bg-stone-100 transition-colors"
                      title="View"
                    >
                      <ArrowUpRight className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() => deleteNotification(n.id)}
                      className="text-stone-300 hover:text-rose-600 p-1.5 rounded-md hover:bg-rose-50 transition-colors"
                      title="Dismiss"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

        </main>
      </div>
    </div>
  );
}
