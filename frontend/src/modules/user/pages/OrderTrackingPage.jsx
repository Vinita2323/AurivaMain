import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  CheckCircle2, Clock, Phone, MapPin, 
  ChevronRight, Navigation, MessageSquare 
} from 'lucide-react';

import AnnouncementBar from '../components/AnnouncementBar';
import Header from '../components/Header';
import Footer from '../components/Footer';

import { useAuth } from '../../../context/AuthContext';
import { INITIAL_ORDERS } from '../../../data/adminData';

export default function OrderTrackingPage() {
  const { orderId } = useParams();
  const { orders } = useAuth();

  // Find target order or default to AV10294 as in reference screen 06
  const order = orders.find(o => o.id === orderId) || INITIAL_ORDERS.find(o => o.id === 'AV10294') || orders[0] || {
    id: orderId || 'AV41186',
    status: 'Out for Delivery',
    date: '18 Aug 2026',
    total: 459,
    items: [
      { name: 'Classic Salted Roasted Makhana', weight: '150g', qty: 2, price: 199, image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=150' },
      { name: 'Peri Peri Gourmet Makhana', weight: '150g', qty: 1, price: 249, image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=150' }
    ]
  };

  const [etaMinutes, setEtaMinutes] = useState(25);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    const interval = setInterval(() => {
      setEtaMinutes(prev => (prev > 5 ? prev - 1 : 25));
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#F7F3E9] text-[#182019] selection:bg-[#D4AF37] selection:text-[#0E2A1B] pb-28 md:pb-12 font-sans">
      <AnnouncementBar />
      <Header />

      <main className="py-3 sm:py-6 md:py-10 max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-[10.5px] sm:text-xs text-stone-500 mb-3 sm:mb-6">
          <Link to="/" className="hover:text-[#0E2A1B] transition-colors">Home</Link>
          <ChevronRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          <Link to="/account?tab=orders" className="hover:text-[#0E2A1B] transition-colors">My Orders</Link>
          <ChevronRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          <span className="text-[#0E2A1B] font-bold">Track Order #{order.id}</span>
        </nav>

        {/* Tracking Card Container */}
        <div className="bg-white rounded-2xl sm:rounded-3xl p-3.5 sm:p-6 lg:p-10 border border-[#E8E2D5] shadow-xs space-y-5 sm:space-y-8">
          
          {/* Header Info */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 border-b border-stone-200 pb-3.5 sm:pb-6">
            <div>
              <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                <h1 className="font-serif text-lg sm:text-2xl lg:text-3xl font-bold text-[#0E2A1B]">
                  Order #{order.id}
                </h1>
                <span className="bg-amber-100 text-amber-800 text-[10px] sm:text-xs font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  {order.status}
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-stone-500 mt-0.5 sm:mt-1">
                Placed on {order.date} • Expected delivery today by 03:15 PM
              </p>
            </div>

            <div className="text-left sm:text-right pt-1 sm:pt-0 border-t sm:border-t-0 border-stone-100">
              <span className="text-[10.5px] sm:text-xs text-stone-500 block">Total Paid Amount</span>
              <p className="font-serif text-base sm:text-xl font-bold text-[#0E2A1B]">₹{order.total}</p>
            </div>
          </div>

          {/* Stepper Timeline (Horizontal on Desktop, Vertical on Mobile) */}
          <div className="py-2 sm:py-4">
            <div className="relative">
              {/* Timeline Track bar */}
              <div className="hidden md:block absolute top-1/2 left-6 right-6 h-1 bg-stone-200 -translate-y-1/2 z-0" />
              <div className="hidden md:block absolute top-1/2 left-6 h-1 bg-emerald-600 -translate-y-1/2 z-0 w-3/4" />

              <div className="grid grid-cols-1 md:grid-cols-5 gap-3 md:gap-2 relative z-10">
                {[
                  { name: 'Order Received', time: '10:30 AM, 12 May', done: true, active: false },
                  { name: 'Packed', time: '11:15 AM, 12 May', done: true, active: false },
                  { name: 'Ready for Dispatch', time: '12:05 PM, 12 May', done: true, active: false },
                  { name: 'Out for Delivery', time: '02:30 PM, 12 May', done: true, active: true },
                  { name: 'Delivered', time: 'Est. 03:15 PM, 12 May', done: false, active: false },
                ].map((step, idx) => (
                  <div key={idx} className="flex md:flex-col items-center gap-3 md:gap-2 text-left md:text-center">
                    <div className={`w-7 h-7 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-[10px] sm:text-xs shadow-sm sm:shadow-md shrink-0 transition-all ${
                      step.active 
                        ? 'bg-[#0E2A1B] text-[#D4AF37] ring-2 sm:ring-4 ring-[#D4AF37]/30 animate-pulse'
                        : step.done 
                        ? 'bg-emerald-600 text-white' 
                        : 'bg-stone-100 text-stone-400 border border-stone-300'
                    }`}>
                      {step.done ? <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" /> : idx + 1}
                    </div>

                    <div>
                      <h4 className={`text-xs sm:text-sm font-bold ${step.active ? 'text-[#0E2A1B]' : step.done ? 'text-stone-800' : 'text-stone-400'}`}>
                        {step.name}
                      </h4>
                      <p className="text-[9.5px] sm:text-[10px] text-stone-400 mt-0.5">{step.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Delivery Details & Live Tracking Map Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-8 items-stretch pt-3 sm:pt-4 border-t border-stone-200">
            
            {/* Left: Delivery Partner Details */}
            <div className="lg:col-span-5 bg-[#FAF7F2] rounded-2xl sm:rounded-3xl p-3.5 sm:p-6 border border-[#E8E2D5] flex flex-col justify-between space-y-3.5 sm:space-y-6">
              <div>
                <span className="text-[9.5px] sm:text-[10px] font-bold uppercase tracking-widest text-[#28543B]">
                  ASSIGNED COURIER / RIDER
                </span>
                <h3 className="font-serif text-base sm:text-lg font-bold text-[#0E2A1B] mt-0.5 sm:mt-1 mb-2.5 sm:mb-4">
                  Delivery Partner
                </h3>

                <div className="flex items-center gap-3 p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white border border-stone-200 shadow-2xs mb-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#1B3B29] text-[#D4AF37] font-serif font-bold text-sm sm:text-lg flex items-center justify-center border border-[#D4AF37]/40 shrink-0">
                    RK
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-serif text-xs sm:text-sm font-bold text-[#0E2A1B]">{order.rider?.name || 'Rohan Kumar'}</h4>
                    <p className="text-[11px] sm:text-xs text-stone-500">★ {order.rider?.rating || '4.9'} • 1,240 deliveries</p>
                    <p className="text-[10.5px] sm:text-[11px] text-stone-400 mt-0.5">Vehicle: <strong className="text-stone-700">{order.rider?.vehicle || 'MP09-AB-1234'}</strong></p>
                  </div>
                </div>

                {/* Delivery Address Target */}
                <div className="space-y-0.5 text-xs text-stone-600 bg-white p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-stone-200">
                  <p className="font-bold text-[#0E2A1B] flex items-center gap-1.5 mb-0.5">
                    <MapPin className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                    <span>Delivering to: {order.address?.type || 'Home'}</span>
                  </p>
                  <p className="text-[11px] sm:text-xs text-stone-600">{order.address?.street || '502 Lotus Orchid, Vijay Nagar'}, {order.address?.city || 'Indore'} - {order.address?.pincode || '452010'}</p>
                </div>
              </div>

              {/* Contact Actions */}
              <div className="grid grid-cols-2 gap-2 pt-1 sm:pt-2">
                <a
                  href={`tel:${order.rider?.phone || '+919876543210'}`}
                  className="py-2.5 sm:py-3 px-3 sm:px-4 rounded-xl bg-[#0E2A1B] text-white text-[11px] sm:text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 sm:gap-2 hover:bg-[#1B3B29] transition-colors shadow-2xs min-h-[38px] sm:min-h-[44px]"
                >
                  <Phone className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>Call Rider</span>
                </a>
                <button
                  type="button"
                  onClick={() => alert(`Chat with rider ${order.rider?.name || 'Rohan'} opened.`)}
                  className="py-2.5 sm:py-3 px-3 sm:px-4 rounded-xl border border-stone-300 bg-white text-stone-800 text-[11px] sm:text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 sm:gap-2 hover:bg-stone-50 transition-colors min-h-[38px] sm:min-h-[44px]"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-[#0E2A1B]" />
                  <span>Message</span>
                </button>
              </div>

            </div>

            {/* Right: Live Tracking Simulated Map */}
            <div className="lg:col-span-7 bg-[#0E2A1B] text-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-[#D4AF37]/30 flex flex-col justify-between relative overflow-hidden shadow-xl min-h-[260px] sm:min-h-[340px]">
              
              {/* Map Top Bar */}
              <div className="relative z-10 flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10 text-[10.5px] sm:text-xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span className="font-semibold text-[#D4AF37]">Live GPS Tracking</span>
                </div>

                <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10 text-[10.5px] sm:text-xs">
                  <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#D4AF37]" />
                  <span>ETA: <strong className="text-[#D4AF37]">{etaMinutes} mins</strong></span>
                </div>
              </div>

              {/* Simulated Map Visual Graphic */}
              <div className="absolute inset-0 z-0 opacity-40">
                <svg viewBox="0 0 600 400" className="w-full h-full object-cover">
                  {/* Grid Lines */}
                  <defs>
                    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(212, 175, 55, 0.15)" strokeWidth="1" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="#0A2014" />
                  <rect width="100%" height="100%" fill="url(#grid)" />
                  
                  {/* Winding Roads */}
                  <path d="M 50 80 Q 200 40 300 180 T 520 320" fill="none" stroke="rgba(255, 255, 255, 0.15)" strokeWidth="8" strokeLinecap="round" />
                  <path d="M 80 340 Q 250 280 350 220 T 550 100" fill="none" stroke="rgba(255, 255, 255, 0.15)" strokeWidth="6" strokeLinecap="round" />
                  
                  {/* Active Route Path in Gold */}
                  <path d="M 120 120 C 180 160, 240 280, 360 220 S 480 300, 480 300" fill="none" stroke="#D4AF37" strokeWidth="4" strokeDasharray="6 4" />

                  {/* Origin Warehouse Pin */}
                  <circle cx="120" cy="120" r="8" fill="#1B3B29" stroke="#D4AF37" strokeWidth="3" />

                  {/* Rider Pin */}
                  <circle cx="320" cy="235" r="14" fill="#D4AF37" className="animate-pulse" />
                  <circle cx="320" cy="235" r="7" fill="#0E2A1B" />

                  {/* Destination Home Pin */}
                  <circle cx="480" cy="300" r="10" fill="#E05A36" stroke="#FFFFFF" strokeWidth="2" />
                </svg>
              </div>

              {/* Map Floating HUD status */}
              <div className="relative z-10 mt-auto pt-16 sm:pt-24 flex items-end justify-between">
                <div className="bg-[#143322]/90 backdrop-blur-md p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl border border-[#D4AF37]/30 text-xs space-y-0.5 sm:space-y-1">
                  <div className="flex items-center gap-1.5 text-[#D4AF37] font-bold text-[11px] sm:text-xs">
                    <Navigation className="w-3.5 h-3.5 shrink-0" />
                    <span>2.5 km away from delivery location</span>
                  </div>
                  <p className="text-[10px] sm:text-[11px] text-[#A2B5A8]">Rider has picked up freshly packed snacks from Fulfillment Hub.</p>
                </div>
              </div>

            </div>

          </div>

          {/* Bottom Items in this Order */}
          <div className="pt-4 sm:pt-6 border-t border-stone-200">
            <h3 className="font-serif text-sm sm:text-base font-bold text-[#0E2A1B] mb-3 sm:mb-4">
              Items in this Package ({order.items?.length || 2})
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-4">
              {(order.items || []).map((item, idx) => (
                <div key={idx} className="flex items-center gap-2.5 sm:gap-3 p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-[#FAF7F2] border border-[#E8E2D5]">
                  <img src={item.image} alt={item.name} className="w-11 h-11 sm:w-14 sm:h-14 rounded-lg sm:rounded-xl object-cover bg-white p-0.5 sm:p-1 border border-stone-200 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-serif text-xs font-bold text-[#0E2A1B] truncate">{item.name}</h4>
                    <p className="text-[10px] sm:text-[11px] text-stone-500">{item.weight} • Qty: {item.qty}</p>
                    <p className="text-[11px] sm:text-xs font-bold text-[#0E2A1B] mt-0.5">₹{item.price * item.qty}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </main>

      <Footer />
    </div>
  );
}
