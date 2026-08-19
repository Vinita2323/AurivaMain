import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Eye, Edit3, Truck, UserCheck, Package, X, CheckCircle } from 'lucide-react';
import AdminSidebar from '../components/AdminSidebar';
import AdminHeader from '../components/AdminHeader';
import OrderStatusModal from '../components/OrderStatusModal';
import { useAuth } from '../../../context/AuthContext';

export default function AdminOrders() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { orders, updateOrderStatus, cancelOrder } = useAuth();
  const [search, setSearch] = useState('');
  
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

  const filteredOrders = orders.filter(o => {
    if (search) {
      const q = search.toLowerCase();
      return (
        o.id.toLowerCase().includes(q) ||
        o.customer.toLowerCase().includes(q) ||
        (o.phone && o.phone.includes(q)) ||
        (o.status && o.status.toLowerCase().includes(q)) ||
        (o.deliveryType && o.deliveryType.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex font-sans">
      <AdminSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <div className="flex-1 lg:pl-64 flex flex-col min-w-0 w-full">
        <AdminHeader onMenuClick={() => setIsSidebarOpen(true)} title="Orders Fulfillment & Dispatch" />

        <main className="p-4 sm:p-6 lg:p-8 space-y-5 w-full font-sans">
          
          {/* Top Header Row with Search */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="font-sans text-xl sm:text-2xl font-bold tracking-tight text-[#0E2A1B]">
                Live Order Stream ({orders.length})
              </h2>
              <p className="text-xs sm:text-sm text-stone-500 font-normal mt-0.5">
                Manage incoming orders, dispatch riders, assign AWB numbers, and update customer tracking.
              </p>
            </div>

            {/* Clean Full-Width Search Input */}
            <div className="bg-white px-3.5 py-2.5 rounded-xl border border-[#E8E2D5] shadow-2xs flex items-center gap-2.5 w-full sm:w-80 lg:w-96">
              <Search className="w-4 h-4 text-stone-400 shrink-0" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search Order ID, Customer, Phone..."
                className="bg-transparent focus:outline-none text-xs sm:text-sm w-full text-stone-800 placeholder:text-stone-400 font-medium"
              />
              {search && (
                <button onClick={() => setSearch('')} className="text-stone-400 hover:text-stone-600">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Full-Width Orders Table */}
          <div className="bg-white rounded-xl border border-[#E8E2D5] shadow-2xs overflow-hidden w-full">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-[#0E2A1B] text-[#E8DFC8] uppercase tracking-wider text-xs sm:text-[12.5px] font-bold">
                  <tr>
                    <th className="py-3.5 px-5 w-[13%]">Order ID</th>
                    <th className="py-3.5 px-5 w-[24%]">Customer Info</th>
                    <th className="py-3.5 px-5 w-[24%]">Items Summary</th>
                    <th className="py-3.5 px-5 w-[12%]">Amount</th>
                    <th className="py-3.5 px-5 w-[13%]">Status</th>
                    <th className="py-3.5 px-5 w-[10%]">Date</th>
                    <th className="py-3.5 px-5 w-[7%] text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 font-medium text-xs sm:text-sm">
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-stone-400">
                        <Package className="w-10 h-10 mx-auto mb-2 text-stone-300" />
                        <p className="font-semibold text-sm text-stone-600">No orders found matching "{search}".</p>
                        <p className="text-xs text-stone-400 mt-1">Try searching with a different ID, customer name, or phone number.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map(ord => (
                      <tr key={ord.id} className="hover:bg-stone-50/80 transition-colors">
                        <td className="py-4 px-5">
                          <button
                            onClick={() => setSelectedOrderForDetail(ord)}
                            className="font-bold text-sm sm:text-[15px] text-[#0E2A1B] hover:text-[#D4AF37] hover:underline"
                          >
                            #{ord.id}
                          </button>
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

                        <td className="py-4 px-5 font-bold text-sm sm:text-base text-stone-900">
                          ₹{ord.total}
                        </td>

                        <td className="py-4 px-5">
                          <select
                            value={ord.status}
                            onChange={(e) => updateOrderStatus(ord.id, e.target.value)}
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider border focus:outline-none cursor-pointer transition-all ${
                              ord.status === 'Delivered'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                                : ord.status === 'Out for Delivery'
                                ? 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
                                : ord.status === 'Cancelled'
                                ? 'bg-rose-50 text-rose-800 border-rose-300 hover:bg-rose-100'
                                : ord.status === 'Packed'
                                ? 'bg-cyan-50 text-cyan-800 border-cyan-300 hover:bg-cyan-100'
                                : 'bg-blue-50 text-blue-800 border-blue-300 hover:bg-blue-100'
                            }`}
                          >
                            <option value="Order Received">Order Received</option>
                            <option value="Packed">Packed</option>
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
                            <button
                              onClick={() => setSelectedOrderForStatus(ord)}
                              className="p-2 text-stone-600 hover:text-[#0E2A1B] hover:bg-stone-100 rounded-lg transition-colors"
                              title="Update Fulfillment Status"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => setSelectedOrderForDetail(ord)}
                              className="p-2 text-stone-600 hover:text-[#0E2A1B] hover:bg-stone-100 rounded-lg transition-colors"
                              title="View Order Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Bottom count & sync indicator */}
            <div className="p-4 border-t border-stone-200 bg-[#FAF7F2] flex flex-col sm:flex-row items-center justify-between text-xs sm:text-sm text-stone-500 gap-2">
              <span className="font-medium">Showing {filteredOrders.length} of {orders.length} orders</span>
              <span className="text-xs text-stone-400">Status changes and fulfillment updates reflect in customer tracking in real time</span>
            </div>
          </div>

        </main>
      </div>

      {/* Order Status & Assignment Modal */}
      <OrderStatusModal
        isOpen={!!selectedOrderForStatus}
        onClose={() => setSelectedOrderForStatus(null)}
        order={selectedOrderForStatus}
        onUpdateStatus={updateOrderStatus}
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
                <p className="text-xs text-stone-300 font-normal">{selectedOrderForDetail.date} • {selectedOrderForDetail.paymentMethod}</p>
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
                          <span className="text-xs text-stone-400 font-normal">{it.weight || '250g'} • Qty: {it.qty}</span>
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

            <div className="p-4 border-t border-stone-200 bg-[#FAF7F2] flex justify-end items-center">
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
