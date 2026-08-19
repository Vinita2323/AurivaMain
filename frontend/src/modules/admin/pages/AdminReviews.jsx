import React, { useState } from 'react';
import { Star, CheckCircle, XCircle, Trash2, MessageSquare, Award, Search, Sparkles } from 'lucide-react';
import AdminSidebar from '../components/AdminSidebar';
import AdminHeader from '../components/AdminHeader';
import { useAdmin } from '../../../context/AdminContext';

export default function AdminReviews() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { reviews, approveReview, featureReview, rejectReview, replyToReview, deleteReview } = useAdmin();

  const [activeStatus, setActiveStatus] = useState('All');
  const [search, setSearch] = useState('');
  const [replyingReviewId, setReplyingReviewId] = useState(null);
  const [replyText, setReplyText] = useState('');

  // Stats
  const approvedCount = reviews.filter(r => r.status === 'Approved').length;
  const pendingCount = reviews.filter(r => r.status === 'Pending').length;
  const avgRating = (reviews.reduce((acc, r) => acc + (r.rating || 5), 0) / (reviews.length || 1)).toFixed(1);

  const filteredReviews = reviews.filter(r => {
    if (activeStatus !== 'All') {
      if (activeStatus === 'Featured' && !r.featured) return false;
      if (activeStatus !== 'Featured' && r.status !== activeStatus) return false;
    }
    if (search) {
      const q = search.toLowerCase();
      return (
        r.author.toLowerCase().includes(q) ||
        r.product.toLowerCase().includes(q) ||
        (r.title && r.title.toLowerCase().includes(q)) ||
        r.content.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleSendReply = (reviewId) => {
    if (!replyText.trim()) return;
    replyToReview(reviewId, replyText);
    setReplyingReviewId(null);
    setReplyText('');
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex font-sans">
      <AdminSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <div className="flex-1 lg:pl-64 flex flex-col min-w-0 w-full">
        <AdminHeader onMenuClick={() => setIsSidebarOpen(true)} title="Customer Reviews & Testimonials" />

        <main className="p-4 sm:p-6 lg:p-8 space-y-3.5 w-full font-sans">
          
          {/* Top KPI Cards - Compact & Softened Weights */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-white rounded-xl p-3 sm:p-3.5 border border-[#E8E2D5] shadow-2xs space-y-0.5">
              <div className="flex items-center justify-between text-stone-500 text-[11px] sm:text-xs font-medium uppercase tracking-wider">
                <span>Total Reviews</span>
                <MessageSquare className="w-4 h-4 text-[#0E2A1B]" />
              </div>
              <h2 className="font-sans text-xl sm:text-2xl font-semibold text-[#0E2A1B]">{reviews.length}</h2>
              <p className="text-[11px] sm:text-xs text-stone-400 font-normal">Verified buyer ratings</p>
            </div>

            <div className="bg-white rounded-xl p-3 sm:p-3.5 border border-[#E8E2D5] shadow-2xs space-y-0.5">
              <div className="flex items-center justify-between text-amber-800 text-[11px] sm:text-xs font-medium uppercase tracking-wider">
                <span>Average Rating</span>
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              </div>
              <h2 className="font-sans text-xl sm:text-2xl font-semibold text-[#0E2A1B]">{avgRating} <span className="text-xs sm:text-sm font-normal text-stone-400">/ 5.0</span></h2>
              <p className="text-[11px] sm:text-xs text-emerald-700 font-medium">98% 5-Star Satisfaction</p>
            </div>

            <div className="bg-white rounded-xl p-3 sm:p-3.5 border border-[#E8E2D5] shadow-2xs space-y-0.5">
              <div className="flex items-center justify-between text-emerald-800 text-[11px] sm:text-xs font-medium uppercase tracking-wider">
                <span>Approved & Live</span>
                <CheckCircle className="w-4 h-4 text-emerald-600" />
              </div>
              <h2 className="font-sans text-xl sm:text-2xl font-semibold text-emerald-700">{approvedCount}</h2>
              <p className="text-[11px] sm:text-xs text-stone-400 font-normal">Visible on storefront</p>
            </div>

            <div className="bg-white rounded-xl p-3 sm:p-3.5 border border-amber-200 bg-amber-50/40 shadow-2xs space-y-0.5">
              <div className="flex items-center justify-between text-amber-900 text-[11px] sm:text-xs font-medium uppercase tracking-wider">
                <span>Pending Moderation</span>
                <Sparkles className="w-4 h-4 text-amber-600" />
              </div>
              <h2 className="font-sans text-xl sm:text-2xl font-semibold text-amber-800">{pendingCount}</h2>
              <p className="text-[11px] sm:text-xs text-amber-800 font-normal">Awaiting admin review</p>
            </div>
          </div>

          {/* Action Bar & Tabs - Compact */}
          <div className="bg-white rounded-xl p-2.5 sm:p-3 border border-[#E8E2D5] shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar p-1 bg-[#FAF7F2] rounded-lg border border-stone-200 text-xs">
              {[
                { id: 'All', label: 'All Reviews', count: reviews.length },
                { id: 'Pending', label: 'Pending', count: pendingCount },
                { id: 'Approved', label: 'Approved', count: approvedCount },
                { id: 'Featured', label: 'Featured on Home', count: reviews.filter(r => r.featured).length },
                { id: 'Rejected', label: 'Rejected', count: reviews.filter(r => r.status === 'Rejected').length },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveStatus(tab.id)}
                  className={`px-3 py-1 rounded-md font-semibold whitespace-nowrap transition-all ${
                    activeStatus === tab.id
                      ? 'bg-[#0E2A1B] text-[#D4AF37] shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  {tab.label} ({tab.count})
                </button>
              ))}
            </div>

            <div className="bg-[#FAF7F2] px-3 py-1.5 rounded-lg border border-stone-200 flex items-center gap-2 w-full sm:w-80 text-xs">
              <Search className="w-3.5 h-3.5 text-stone-400 shrink-0" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search author, product, content..."
                className="bg-transparent focus:outline-none text-xs w-full text-stone-800 placeholder:text-stone-400 font-medium"
              />
            </div>
          </div>

          {/* Reviews List - Compact Cards */}
          <div className="space-y-3 w-full">
            {filteredReviews.map(r => (
              <div
                key={r.id}
                className="bg-white rounded-xl p-3.5 sm:p-4 border border-[#E8E2D5] shadow-2xs space-y-2.5 hover:shadow-xs transition-all w-full"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="flex items-center gap-3">
                    <img src={r.avatar} alt="" className="w-9 h-9 rounded-full object-cover border border-stone-200 bg-[#FAF7F2] shrink-0" />
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-sans font-bold text-xs sm:text-sm text-[#0E2A1B]">{r.author}</h4>
                        {r.verified && (
                          <span className="text-[10.5px] bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.2 rounded-full border border-emerald-200">
                            Verified Buyer
                          </span>
                        )}
                        {r.featured && (
                          <span className="text-[10.5px] bg-[#D4AF37]/20 text-[#0E2A1B] font-semibold px-2 py-0.2 rounded-full border border-[#D4AF37]/40 flex items-center gap-1">
                            <Award className="w-3 h-3 text-[#D4AF37]" /> Featured
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-stone-400 font-normal">{r.role || 'Health Enthusiast'} • {r.city || 'India'} • {r.date}</p>
                    </div>
                  </div>

                  {/* Rating Stars & Status Badge */}
                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <div className="flex items-center gap-1 text-amber-400 bg-amber-50 px-2.5 py-0.5 rounded-lg border border-amber-200">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3 h-3 ${i < r.rating ? 'fill-amber-400' : 'text-stone-300'}`}
                        />
                      ))}
                      <span className="text-xs font-bold text-amber-900 ml-0.5">{r.rating}.0</span>
                    </div>

                    <span className={`px-2.5 py-0.5 rounded-full text-[10.5px] font-bold uppercase tracking-wider ${
                      r.status === 'Approved'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : r.status === 'Pending'
                        ? 'bg-amber-100 text-amber-800 border border-amber-200'
                        : 'bg-rose-100 text-rose-800 border border-rose-200'
                    }`}>
                      {r.status}
                    </span>
                  </div>
                </div>

                {/* Review Body */}
                <div className="space-y-1 bg-[#FAF7F2] p-3 rounded-lg border border-[#E8E2D5]">
                  <span className="text-[10.5px] font-semibold uppercase text-[#0E2A1B] bg-white px-2 py-0.5 rounded border border-stone-200 inline-block mb-0.5">
                    Product: {r.product}
                  </span>
                  <h5 className="font-sans text-xs sm:text-sm font-bold text-stone-900">"{r.title || 'Exceptional Quality'}"</h5>
                  <p className="text-xs text-stone-600 leading-relaxed font-normal">{r.content}</p>
                </div>

                {/* Admin Reply Display */}
                {r.adminReply && (
                  <div className="bg-[#0E2A1B]/5 border-l-3 border-[#0E2A1B] p-2.5 rounded-r-lg text-xs space-y-0.5">
                    <span className="font-bold text-[#0E2A1B] flex items-center gap-1 text-[11px]">
                      <MessageSquare className="w-3 h-3 text-[#D4AF37]" /> Response from AURIVÁ Team:
                    </span>
                    <p className="text-stone-700 italic font-normal">{r.adminReply}</p>
                  </div>
                )}

                {/* Reply Form Trigger */}
                {replyingReviewId === r.id && (
                  <div className="p-3 bg-white border border-stone-300 rounded-lg space-y-2">
                    <textarea
                      rows={2}
                      value={replyText}
                      onChange={e => setReplyText(e.target.value)}
                      placeholder="Write official store response to customer..."
                      className="w-full text-xs p-2.5 rounded-lg border border-stone-300 focus:outline-none focus:border-[#0E2A1B]"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setReplyingReviewId(null)}
                        className="px-3 py-1 text-xs text-stone-600 hover:text-stone-900 font-semibold"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleSendReply(r.id)}
                        className="px-3.5 py-1 bg-[#0E2A1B] text-white text-xs font-bold rounded-md hover:bg-[#1B3B29] transition-colors"
                      >
                        Publish Reply
                      </button>
                    </div>
                  </div>
                )}

                {/* Action Buttons Bar */}
                <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-stone-100">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {r.status !== 'Approved' && (
                      <button
                        onClick={() => approveReview(r.id)}
                        className="px-3 py-1 rounded-md bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1 hover:bg-emerald-800 transition-colors"
                      >
                        <CheckCircle className="w-3 h-3" />
                        <span>Approve</span>
                      </button>
                    )}

                    <button
                      onClick={() => featureReview(r.id)}
                      className={`px-3 py-1 rounded-md text-xs font-semibold flex items-center gap-1 transition-all ${
                        r.featured
                          ? 'bg-[#D4AF37] text-[#0E2A1B]'
                          : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                      }`}
                    >
                      <Award className="w-3 h-3" />
                      <span>{r.featured ? 'Featured on Home' : 'Feature'}</span>
                    </button>

                    <button
                      onClick={() => {
                        setReplyingReviewId(r.id);
                        setReplyText(r.adminReply || '');
                      }}
                      className="px-3 py-1 rounded-md border border-stone-200 hover:bg-stone-100 text-stone-700 text-xs font-semibold flex items-center gap-1 transition-colors"
                    >
                      <MessageSquare className="w-3 h-3" />
                      <span>Reply</span>
                    </button>

                    {r.status !== 'Rejected' && (
                      <button
                        onClick={() => rejectReview(r.id)}
                        className="px-3 py-1 rounded-md border border-rose-200 hover:bg-rose-50 text-rose-700 text-xs font-semibold flex items-center gap-1 transition-colors"
                      >
                        <XCircle className="w-3 h-3" />
                        <span>Reject</span>
                      </button>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      if (confirm("Delete this review permanently?")) {
                        deleteReview(r.id);
                      }
                    }}
                    className="p-1 text-stone-400 hover:text-rose-600 rounded-md transition-colors"
                    title="Delete Review"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

        </main>
      </div>
    </div>
  );
}
