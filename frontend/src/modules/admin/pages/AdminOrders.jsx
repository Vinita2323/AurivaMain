import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { 
  Search, Eye, Edit3, Truck, UserCheck, Package, 
  X, CheckCircle, ChevronLeft, ChevronRight, Ban, RefreshCw 
} from 'lucide-react';
import AdminSidebar from '../components/AdminSidebar';
import AdminHeader from '../components/AdminHeader';
import OrderStatusModal from '../components/OrderStatusModal';
import { useAuth, formatOrder } from '../../../context/AuthContext';
import { adminOrderApi } from '../../../utils/api';

const STATUS_FILTERS = [
  { id: 'All', label: 'All Orders' },
  { id: 'Order Received', label: 'Received (Confirmed)' },
  { id: 'Packed', label: 'Packed' },
  { id: 'Ready for Dispatch', label: 'Dispatched (Shipped)' },
  { id: 'Out for Delivery', label: 'Out for Delivery' },
  { id: 'Delivered', label: 'Delivered' },
  { id: 'Cancelled', label: 'Cancelled' }
];

export default function AdminOrders() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { orders: localContextOrders } = useAuth();

  const [ordersList, setOrdersList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, totalPages: 1 });

  const [selectedOrderForStatus, setSelectedOrderForStatus] = useState(null);
  const [selectedOrderForDetail, setSelectedOrderForDetail] = useState(null);

  // Lock background scrolling when either modal is open
  useEffect(() => {
    if (selectedOrderForDetail || selectedOrderForStatus) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [selectedOrderForDetail, selectedOrderForStatus]);

  // Load orders from backend API
  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await adminOrderApi.getAllOrders({
        page,
        limit: 20,
        status: statusFilter !== 'All' ? statusFilter : undefined,
        search: search.trim() || undefined
      });

      if (res && res.data && Array.isArray(res.data.orders)) {
        const formatted = res.data.orders.map(formatOrder);
        setOrdersList(formatted);
        if (res.data.pagination) {
          setPagination(res.data.pagination);
        }
      } else {
        // Fallback to local context orders if no server orders returned
        const filteredLocal = (localContextOrders || []).filter(o => {
          if (statusFilter !== 'All' && o.status !== statusFilter) return false;
          if (search.trim()) {
            const q = search.toLowerCase();
            return (
              o.id.toLowerCase().includes(q) ||
              (o.customer && o.customer.toLowerCase().includes(q)) ||
              (o.phone && o.phone.includes(q))
            );
          }
          return true;
        });
        setOrdersList(filteredLocal);
        setPagination({
          total: filteredLocal.length,
          page: 1,
          limit: 20,
          totalPages: Math.ceil(filteredLocal.length / 20) || 1
        });
      }
    } catch (err) {
      console.warn('[AdminOrders] Backend order fetch fallback note:', err.message);
      const filteredLocal = (localContextOrders || []).filter(o => {
        if (statusFilter !== 'All' && o.status !== statusFilter) return false;
        if (search.trim()) {
          const q = search.toLowerCase();
          return (
            o.id.toLowerCase().includes(q) ||
            (o.customer && o.customer.toLowerCase().includes(q)) ||
            (o.phone && o.phone.includes(q))
          );
        }
        return true;
      });
      setOrdersList(filteredLocal);
      setPagination({
        total: filteredLocal.length,
        page: 1,
        limit: 20,
        totalPages: Math.ceil(filteredLocal.length / 20) || 1
      });
    } finally {
      setIsLoading(false);
    }
  }, [page, statusFilter, search, localContextOrders]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchOrders();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchOrders]);

  // Update order status and dispatch logistics
  const handleUpdateOrderStatus = async (orderId, newStatus, extraData = {}) => {
    // Optimistic UI update
    setOrdersList(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus, ...extraData } : o));

    try {
      // 1. If dispatch info provided, update dispatch
      if (extraData.courierName || extraData.awbNumber || extraData.rider) {
        await adminOrderApi.dispatchOrder(orderId, {
          courierName: extraData.courierName,
          awbNumber: extraData.awbNumber,
          rider: extraData.rider,
          deliveryNotes: extraData.deliveryNotes
        });
      }

      // 2. Update status
      const res = await adminOrderApi.updateStatus(orderId, newStatus, extraData.note);
      if (res && res.data && res.data.order) {
        const formatted = formatOrder(res.data.order);
        setOrdersList(prev => prev.map(o => o.id === orderId ? formatted : o));
      }
    } catch (err) {
      alert(`Status update note: ${err.message || 'Error updating order'}`);
      fetchOrders();
    }
  };

  // Admin order cancellation with stock restoration
  const handleCancelOrder = async (orderId) => {
    const reason = window.prompt('Enter reason for cancelling this order:', 'Cancelled by administrator');
    if (reason === null) return; // Cancelled prompt

    try {
      const res = await adminOrderApi.cancelOrder(orderId, reason);
      if (res && res.data && res.data.order) {
        const formatted = formatOrder(res.data.order);
        setOrdersList(prev => prev.map(o => o.id === orderId ? formatted : o));
        alert(`Order #${orderId} has been cancelled and inventory stock was restored to warehouse.`);
      }
    } catch (err) {
      alert(`Cancellation failed: ${err.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex font-sans">
      <AdminSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <div className="flex-1 lg:pl-64 flex flex-col min-w-0 w-full">
        <AdminHeader onMenuClick={() => setIsSidebarOpen(true)} title="Orders Fulfillment & Dispatch" />

        <main className="p-4 sm:p-6 lg:p-8 space-y-5 w-full font-sans">
          
          {/* Top Header Row with Search & Refresh */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="font-sans text-xl sm:text-2xl font-bold tracking-tight text-[#0E2A1B]">
                Live Order Stream ({pagination.total})
              </h2>
              <p className="text-xs sm:text-sm text-stone-500 font-normal mt-0.5">
                Manage incoming orders, dispatch riders, assign AWB numbers, and update customer tracking.
              </p>
            </div>

            {/* Clean Full-Width Search Input & Refresh Button */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="bg-white px-3.5 py-2.5 rounded-xl border border-[#E8E2D5] shadow-2xs flex items-center gap-2.5 w-full sm:w-80 lg:w-96">
                <Search className="w-4 h-4 text-stone-400 shrink-0" />
                <input
                  type="text"
                  value={search}
                  onChange={e => { setSearch(e.target.value); setPage(1); }}
                  placeholder="Search Order ID, Customer, Phone..."
                  className="bg-transparent focus:outline-none text-xs sm:text-sm w-full text-stone-800 placeholder:text-stone-400 font-medium"
                />
                {search && (
                  <button onClick={() => { setSearch(''); setPage(1); }} className="text-stone-400 hover:text-stone-600">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <button 
                onClick={fetchOrders}
                disabled={isLoading}
                title="Refresh live orders"
                className="p-2.5 rounded-xl bg-white border border-[#E8E2D5] text-stone-600 hover:text-[#0E2A1B] hover:bg-stone-50 shadow-2xs transition-all shrink-0 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Status Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {STATUS_FILTERS.map(f => {
              const isActive = statusFilter === f.id;
              return (
                <button
                  key={f.id}
                  onClick={() => { setStatusFilter(f.id); setPage(1); }}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-[#0E2A1B] text-[#D4AF37] shadow-xs'
                      : 'bg-white text-stone-600 border border-[#E8E2D5] hover:bg-stone-50'
                  }`}
                >
                  {f.label}
                </button>
              );
            })}
          </div>

          {/* Full-Width Orders Table */}
          <div className="bg-white rounded-xl border border-[#E8E2D5] shadow-2xs overflow-hidden w-full">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-[#0E2A1B] text-[#E8DFC8] uppercase tracking-wider text-xs sm:text-[12.5px] font-bold">
                  <tr>
                    <th className="py-3.5 px-5 w-[14%]">Order ID</th>
                    <th className="py-3.5 px-5 w-[22%]">Customer Info</th>
                    <th className="py-3.5 px-5 w-[22%]">Items Summary</th>
                    <th className="py-3.5 px-5 w-[12%]">Amount</th>
                    <th className="py-3.5 px-5 w-[14%]">Status</th>
                    <th className="py-3.5 px-5 w-[10%]">Date</th>
                    <th className="py-3.5 px-5 w-[6%] text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 font-medium text-xs sm:text-sm">
                  {isLoading && ordersList.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-stone-400">
                        <RefreshCw className="w-8 h-8 mx-auto mb-2 text-[#D4AF37] animate-spin" />
                        <p className="font-semibold text-sm text-stone-600">Loading orders stream...</p>
                      </td>
                    </tr>
                  ) : ordersList.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-stone-400">
                        <Package className="w-10 h-10 mx-auto mb-2 text-stone-300" />
                        <p className="font-semibold text-sm text-stone-600">No orders found matching "{search || statusFilter}".</p>
                        <p className="text-xs text-stone-400 mt-1">Try switching status filters or clearing your search term.</p>
                      </td>
                    </tr>
                  ) : (
                    ordersList.map(ord => (
                      <tr key={ord.id} className="hover:bg-stone-50/80 transition-colors">
                        <td className="py-4 px-5">
                          <button
                            onClick={() => setSelectedOrderForDetail(ord)}
                            className="font-bold text-sm sm:text-[15px] text-[#0E2A1B] hover:text-[#D4AF37] hover:underline"
                          >
                            #{ord.id}
                          </button>
                          {ord.awbNumber && (
                            <span className="block text-[10.5px] font-mono text-stone-400 mt-0.5 truncate max-w-[120px]">
                              AWB: {ord.awbNumber}
                            </span>
                          )}
                        </td>

                        <td className="py-4 px-5">
                          <div className="font-semibold text-stone-900 text-xs sm:text-[14px]">{ord.customer}</div>
                          <div className="text-xs text-stone-400 font-normal mt-0.5">{ord.phone || '+91 9876543210'}</div>
                        </td>

                        <td className="py-4 px-5 text-stone-700">
                          <div className="font-medium text-stone-900 text-xs sm:text-[14px] truncate max-w-[240px]">
                            {ord.items?.[0]?.name || 'Snack Item'}
                            {(ord.items?.length || 1) > 1 && ` +${ord.items.length - 1} more`}
                          </div>
                          <span className="text-xs text-stone-400 font-normal">{ord.items?.length || 1} snack items total</span>
                        </td>

                        <td className="py-4 px-5">
                          <div className="font-bold text-sm sm:text-base text-stone-900">₹{ord.total}</div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                              ord.paymentStatus === 'PAID'
                                ? 'bg-emerald-100 text-emerald-800'
                                : ord.paymentStatus === 'FAILED'
                                ? 'bg-rose-100 text-rose-800'
                                : ord.paymentStatus === 'REFUNDED' || ord.paymentStatus === 'PARTIALLY_REFUNDED'
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}>
                              {ord.paymentStatus || 'PENDING'}
                            </span>
                            <span className="text-[10px] text-stone-400 font-medium">({ord.paymentMethod || 'COD'})</span>
                          </div>
                        </td>

                        <td className="py-4 px-5">
                          <select
                            value={ord.status}
                            disabled={ord.status === 'Cancelled' || ord.status === 'Delivered'}
                            onChange={(e) => handleUpdateOrderStatus(ord.id, e.target.value)}
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider border focus:outline-none cursor-pointer transition-all disabled:opacity-60 disabled:cursor-not-allowed ${
                              ord.status === 'Delivered'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                : ord.status === 'Out for Delivery'
                                ? 'bg-amber-50 text-amber-800 border-amber-300'
                                : ord.status === 'Cancelled'
                                ? 'bg-rose-50 text-rose-800 border-rose-300'
                                : ord.status === 'Packed'
                                ? 'bg-cyan-50 text-cyan-800 border-cyan-300'
                                : ord.status === 'Ready for Dispatch'
                                ? 'bg-purple-50 text-purple-800 border-purple-300'
                                : 'bg-blue-50 text-blue-800 border-blue-300'
                            }`}
                          >
                            <option value="Order Received">Order Received</option>
                            <option value="Packed">Packed</option>
                            <option value="Ready for Dispatch">Ready for Dispatch</option>
                            <option value="Out for Delivery">Out for Delivery</option>
                            <option value="Delivered">Delivered</option>
                            <option value="Cancelled">Cancelled</option>
                          </select>
                        </td>

                        <td className="py-4 px-5 text-stone-600 font-medium text-xs sm:text-[13.5px]">
                          {ord.date}
                        </td>

                        <td className="py-4 px-5 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {/* Fulfillment / Dispatch Details Modal Trigger */}
                            <button
                              onClick={() => setSelectedOrderForStatus(ord)}
                              className="p-2 text-stone-600 hover:text-[#0E2A1B] hover:bg-stone-100 rounded-lg transition-colors"
                              title="Update Fulfillment & Dispatch"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>

                            {/* View Details Modal Trigger */}
                            <button
                              onClick={() => setSelectedOrderForDetail(ord)}
                              className="p-2 text-stone-600 hover:text-[#0E2A1B] hover:bg-stone-100 rounded-lg transition-colors"
                              title="View Order Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            {/* Admin Order Cancel Button */}
                            {ord.status !== 'Delivered' && ord.status !== 'Cancelled' && (
                              <button
                                onClick={() => handleCancelOrder(ord.id)}
                                className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                                title="Cancel Order (Restores Stock)"
                              >
                                <Ban className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Bottom count & pagination */}
            <div className="p-4 border-t border-stone-200 bg-[#FAF7F2] flex flex-col sm:flex-row items-center justify-between text-xs sm:text-sm text-stone-500 gap-3">
              <span className="font-medium">
                Showing {ordersList.length} of {pagination.total} orders (Page {pagination.page} of {pagination.totalPages || 1})
              </span>

              {pagination.totalPages > 1 && (
                <div className="flex items-center gap-2">
                  <button
                    disabled={page <= 1}
                    onClick={() => setPage(prev => Math.max(1, prev - 1))}
                    className="p-1.5 rounded-lg border border-[#E8E2D5] bg-white text-stone-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-stone-50 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <span className="font-bold text-xs text-stone-800 px-2">
                    {page} / {pagination.totalPages}
                  </span>

                  <button
                    disabled={page >= pagination.totalPages}
                    onClick={() => setPage(prev => Math.min(pagination.totalPages, prev + 1))}
                    className="p-1.5 rounded-lg border border-[#E8E2D5] bg-white text-stone-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-stone-50 transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

        </main>
      </div>

      {/* Order Status & Assignment Modal */}
      <OrderStatusModal
        isOpen={!!selectedOrderForStatus}
        onClose={() => setSelectedOrderForStatus(null)}
        order={selectedOrderForStatus}
        onUpdateStatus={handleUpdateOrderStatus}
      />

      {/* Order Detail Modal */}
      {selectedOrderForDetail && (
        <div 
          data-lenis-prevent
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedOrderForDetail(null);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs font-sans overflow-y-auto"
        >
          <div 
            data-lenis-prevent
            className="bg-white rounded-xl max-w-2xl w-full border border-[#E8E2D5] shadow-2xl overflow-hidden my-auto flex flex-col h-[85vh] max-h-[85vh] animate-in fade-in zoom-in-95 duration-200"
          >
            
            {/* Header */}
            <div className="p-5 bg-[#0E2A1B] text-white flex items-center justify-between border-b border-[#D4AF37]/30 shrink-0">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#D4AF37]">ORDER INVOICE BREAKDOWN</span>
                <h3 className="font-sans text-lg font-bold">Order #{selectedOrderForDetail.id}</h3>
                <div className="flex flex-wrap items-center gap-2 text-xs text-stone-300 font-normal mt-0.5">
                  <span>{selectedOrderForDetail.date}</span>
                  <span>•</span>
                  <span>{selectedOrderForDetail.paymentMethod}</span>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                    selectedOrderForDetail.paymentStatus === 'PAID'
                      ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-400/40'
                      : selectedOrderForDetail.paymentStatus === 'FAILED'
                      ? 'bg-rose-500/30 text-rose-300 border border-rose-400/40'
                      : selectedOrderForDetail.paymentStatus === 'REFUNDED' || selectedOrderForDetail.paymentStatus === 'PARTIALLY_REFUNDED'
                      ? 'bg-purple-500/30 text-purple-300 border border-purple-400/40'
                      : 'bg-amber-500/30 text-amber-300 border border-amber-400/40'
                  }`}>
                    {selectedOrderForDetail.paymentStatus || 'PENDING'}
                  </span>
                  {selectedOrderForDetail.transactionId && (
                    <span className="text-[10.5px] font-mono text-stone-300 truncate max-w-[170px]">
                      TXN: {selectedOrderForDetail.transactionId}
                    </span>
                  )}
                </div>
              </div>
              <button onClick={() => setSelectedOrderForDetail(null)} className="p-1 rounded-lg text-stone-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div 
              data-lenis-prevent
              className="p-5 space-y-5 overflow-y-auto flex-1 min-h-0 font-sans overscroll-contain"
            >
              {/* Customer & Address */}
              <div className="p-4 rounded-xl bg-[#FAF7F2] border border-[#E8E2D5] grid grid-cols-2 gap-4 text-xs sm:text-sm">
                <div>
                  <span className="text-stone-400 block text-[10px] font-bold uppercase">Customer</span>
                  <strong className="text-stone-800 font-semibold">{selectedOrderForDetail.customer}</strong>
                  <p className="text-stone-500 mt-0.5">{selectedOrderForDetail.phone}</p>
                  <p className="text-stone-500">{selectedOrderForDetail.email}</p>
                </div>
                <div>
                  <span className="text-stone-400 block text-[10px] font-bold uppercase">Delivery Address ({selectedOrderForDetail.address?.type || 'Home'})</span>
                  <p className="text-stone-700 font-medium leading-relaxed mt-0.5">
                    {selectedOrderForDetail.address?.street}, {selectedOrderForDetail.address?.city}, {selectedOrderForDetail.address?.state} - {selectedOrderForDetail.address?.pincode}
                  </p>
                </div>
              </div>

              {/* Courier & Dispatch Info if present */}
              {(selectedOrderForDetail.courierName || selectedOrderForDetail.awbNumber || selectedOrderForDetail.rider?.name) && (
                <div className="p-3.5 rounded-xl bg-white border border-[#E8E2D5] space-y-1 text-xs">
                  <span className="text-stone-400 block text-[10px] font-bold uppercase">Dispatch Information</span>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-stone-700">
                    {selectedOrderForDetail.courierName && <span>Courier: <strong className="text-stone-900">{selectedOrderForDetail.courierName}</strong></span>}
                    {selectedOrderForDetail.awbNumber && <span>AWB: <strong className="text-stone-900 font-mono">{selectedOrderForDetail.awbNumber}</strong></span>}
                    {selectedOrderForDetail.rider?.name && <span>Rider: <strong className="text-stone-900">{selectedOrderForDetail.rider.name} ({selectedOrderForDetail.rider.phone || ''})</strong></span>}
                  </div>
                  {selectedOrderForDetail.deliveryNotes && <p className="text-stone-500 text-[11px] italic mt-1">Notes: {selectedOrderForDetail.deliveryNotes}</p>}
                </div>
              )}

              {/* Items List */}
              <div className="space-y-2.5">
                <h4 className="font-sans text-xs font-bold uppercase tracking-wider text-[#0E2A1B]">Ordered Snack Items</h4>
                <div className="divide-y divide-stone-100 border border-stone-200 rounded-xl overflow-hidden">
                  {selectedOrderForDetail.items?.map((it, i) => (
                    <div key={i} className="p-3.5 bg-white flex items-center justify-between text-xs sm:text-sm">
                      <div className="flex items-center gap-3">
                        <img src={it.image} alt="" className="w-11 h-11 rounded-lg object-cover border border-stone-200 bg-stone-50" />
                        <div>
                          <div className="font-semibold text-stone-900">{it.name}</div>
                          <span className="text-xs text-stone-400 font-normal">{it.weight || '150g'} • Qty: {it.qty}</span>
                        </div>
                      </div>
                      <div className="font-bold text-stone-900">₹{(it.price || 0) * (it.qty || 1)}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Price Summary */}
              <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-2 text-xs sm:text-sm">
                <div className="flex justify-between text-stone-600">
                  <span>Subtotal</span>
                  <span>₹{selectedOrderForDetail.subtotal}</span>
                </div>
                {selectedOrderForDetail.discount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-semibold">
                    <span>Discount ({selectedOrderForDetail.couponApplied || 'Promo'})</span>
                    <span>-₹{selectedOrderForDetail.discount}</span>
                  </div>
                )}
                <div className="flex justify-between text-stone-600">
                  <span>Delivery Fee</span>
                  <span>{selectedOrderForDetail.deliveryFee === 0 ? 'FREE' : `₹${selectedOrderForDetail.deliveryFee}`}</span>
                </div>
                <div className="flex justify-between text-stone-600">
                  <span>GST Tax</span>
                  <span>₹{selectedOrderForDetail.tax}</span>
                </div>
                <div className="pt-2 border-t border-stone-200 flex justify-between font-sans text-sm font-bold text-[#0E2A1B]">
                  <span>Total Paid</span>
                  <span>₹{selectedOrderForDetail.total}</span>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-stone-200 bg-[#FAF7F2] flex justify-between items-center">
              {selectedOrderForDetail.status !== 'Cancelled' && selectedOrderForDetail.status !== 'Delivered' ? (
                <button
                  onClick={() => {
                    const idToCancel = selectedOrderForDetail.id;
                    setSelectedOrderForDetail(null);
                    handleCancelOrder(idToCancel);
                  }}
                  className="px-4 py-2 rounded-lg border border-rose-300 text-xs font-semibold text-rose-700 hover:bg-rose-50 transition-colors"
                >
                  Cancel Order & Restore Stock
                </button>
              ) : <div />}

              <button
                onClick={() => setSelectedOrderForDetail(null)}
                className="px-5 py-2 rounded-lg border border-stone-300 text-xs font-semibold uppercase tracking-wider text-stone-700 hover:bg-stone-100 transition-colors"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
