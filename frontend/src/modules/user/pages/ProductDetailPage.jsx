import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  Star, Heart, Plus, Minus, Check, ShoppingBag, Zap, Truck, ShieldCheck, 
  Leaf, ChevronRight, Play, HelpCircle, ArrowRight 
} from 'lucide-react';


import AnnouncementBar from '../components/AnnouncementBar';
import Header from '../components/Header';
import ProductCard from '../components/ProductCard';
import Footer from '../components/Footer';

import { useAdmin } from '../../../context/AdminContext';
import { useCart } from '../../../context/CartContext';
import { useWishlist } from '../../../context/WishlistContext';
import { useAuth } from '../../../context/AuthContext';
import { resolveProductImage } from '../../../utils/productImage';
import { reviewApi } from '../../../utils/api';

export default function ProductDetailPage() {
  const { id, slug } = useParams();
  const targetKey = (id || slug || '').toString().trim().toLowerCase();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { products: PRODUCTS, reviews: REVIEWS, addReview } = useAdmin();

  // Find product by unique product ID first, with fallback to slug
  const product = useMemo(() => {
    if (!PRODUCTS || PRODUCTS.length === 0) return {};
    const matchById = PRODUCTS.find(p => {
      const pid = String(p.id || p._id || '').trim().toLowerCase();
      return pid === targetKey;
    });
    if (matchById) return matchById;

    const matchBySlug = PRODUCTS.find(p => {
      const pslug = String(p.slug || '').trim().toLowerCase();
      return pslug === targetKey;
    });
    return matchBySlug || PRODUCTS[0] || {};
  }, [PRODUCTS, targetKey]);

  // If accessed by old slug name, seamlessly update URL to unique product ID
  useEffect(() => {
    if (product && (product.id || product._id)) {
      const uniqueId = String(product.id || product._id);
      if (targetKey && targetKey !== uniqueId.toLowerCase() && targetKey === String(product.slug || '').toLowerCase()) {
        navigate(`/product/${uniqueId}`, { replace: true });
      }
    }
  }, [product, targetKey, navigate]);

  const [selectedImage, setSelectedImage] = useState(product?.image);
  const [selectedWeight, setSelectedWeight] = useState(product?.weight || '250g');
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('description');
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [isAdded, setIsAdded] = useState(false);

  // Write Review State
  const { user: authUser, isAuthenticated } = useAuth ? useAuth() : {};
  const [productReviews, setProductReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsTotal, setReviewsTotal] = useState(0);
  const [reviewEligibility, setReviewEligibility] = useState(null);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState('');

  const [isWriteReviewOpen, setIsWriteReviewOpen] = useState(false);
  const [newReviewAuthor, setNewReviewAuthor] = useState('');
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [newReviewTitle, setNewReviewTitle] = useState('');
  const [newReviewContent, setNewReviewContent] = useState('');
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  const fetchReviews = async () => {
    const pid = product?._id || product?.id;
    if (!pid) return;
    setReviewsLoading(true);
    try {
      const res = await reviewApi.getProductReviews(pid);
      if (res?.data?.reviews) {
        setProductReviews(res.data.reviews);
        setReviewsTotal(res.data.pagination?.total ?? res.data.reviews.length);
      }
    } catch (e) {
      console.warn('Could not fetch reviews:', e.message);
    } finally {
      setReviewsLoading(false);
    }
  };

  const checkEligibility = async () => {
    const pid = product?._id || product?.id;
    if (!pid || !isAuthenticated) {
      setReviewEligibility(null);
      return;
    }
    try {
      const res = await reviewApi.checkReviewEligibility(pid);
      setReviewEligibility(res?.data || null);
    } catch {
      setReviewEligibility(null);
    }
  };

  useEffect(() => {
    if (product?._id || product?.id) {
      fetchReviews();
      checkEligibility();
    }
  }, [product?._id, product?.id, isAuthenticated]);

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    setReviewError('');
    const pid = product?._id || product?.id;
    if (!pid) return;
    if (!newReviewContent.trim()) {
      setReviewError('Please provide your review feedback.');
      return;
    }
    setReviewSubmitting(true);
    try {
      await reviewApi.submitReview(pid, {
        rating: newReviewRating,
        title: newReviewTitle || 'Wonderful taste & quality',
        comment: newReviewContent
      });
      setReviewSubmitted(true);
      setNewReviewAuthor('');
      setNewReviewTitle('');
      setNewReviewContent('');
      checkEligibility();
    } catch (err) {
      setReviewError(err.message || 'Review submission failed. Verified purchase required.');
    } finally {
      setReviewSubmitting(false);
    }
  };

  const resolvedMainImage = resolveProductImage(product);

  const galleryList = useMemo(() => {
    const cleanImg = (img) => {
      if (!img || (typeof img === 'string' && img.includes('1599488615731'))) {
        return resolvedMainImage;
      }
      return resolveProductImage(img);
    };
    const raw = Array.isArray(product.gallery) && product.gallery.length > 0
      ? product.gallery.map(cleanImg)
      : [resolvedMainImage];
    const list = Array.from(new Set([resolvedMainImage, ...raw]));
    return list;
  }, [product, resolvedMainImage]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setSelectedImage(resolvedMainImage);
    setSelectedWeight(product.weight || '250g');
    setQuantity(1);
  }, [id, slug, product, resolvedMainImage]);

  const isWishlisted = isInWishlist(product);

  // Price calculations based on selected weight
  let currentPrice = product.price;
  let currentOldPrice = product.oldPrice;
  if (product.weightOptions) {
    const match = product.weightOptions.find(w => w.weight === selectedWeight);
    if (match) {
      currentPrice = match.price;
      currentOldPrice = match.oldPrice;
    }
  }

  const handleAddToCart = (openDrawer = true) => {
    addToCart(product, selectedWeight, quantity, openDrawer);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  const handleBuyNow = () => {
    addToCart(product, selectedWeight, quantity, false);
    navigate('/checkout');
  };

  const similarProducts = PRODUCTS
    .filter(p => p.id !== product.id && (p.category === product.category || p.isBestseller))
    .slice(0, 4);

  return (
    <div className="min-h-screen bg-[#FAF7F2] font-sans">
      <AnnouncementBar />
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-1.5 text-xs text-stone-500 mb-8">
          <Link to="/" className="hover:text-[#0E2A1B] transition-colors">Home</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link to={`/shop?category=${product.category}`} className="hover:text-[#0E2A1B] capitalize transition-colors">
            {product.category?.replace('-', ' ')}
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-[#0E2A1B] font-semibold">{product.name}</span>
        </nav>

        {/* TOP PRODUCT SECTION (Gallery + Product Info) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 bg-white rounded-3xl p-6 sm:p-10 border border-[#E8E2D5] shadow-xs">
          
          {/* LEFT: Product Gallery */}
          <div className="lg:col-span-6 flex flex-col-reverse sm:flex-row gap-3 sm:gap-4 items-start">
            {/* Left Vertical Gallery Thumbnails */}
            {galleryList.length > 1 && (
              <div className="flex sm:flex-col gap-2.5 sm:gap-3 overflow-x-auto sm:overflow-y-auto max-w-full sm:max-h-[520px] shrink-0 no-scrollbar py-1 sm:py-0 w-full sm:w-auto">
                {galleryList.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedImage(img)}
                    className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-[#FAF7F2] border-2 transition-all shrink-0 cursor-pointer ${
                      selectedImage === img
                        ? 'border-[#0E2A1B] ring-2 ring-[#D4AF37]/60 shadow-md scale-102'
                        : 'border-stone-200 hover:border-stone-400 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Main Active Image with Zoom effect - Cover Entire Card */}
            <div className="relative flex-1 w-full aspect-square rounded-2xl bg-[#FAF7F2] border border-[#E8E2D5] overflow-hidden group shadow-xs">
              {product.badge && (
                <span className="absolute top-4 left-4 bg-[#D4AF37] text-[#0E2A1B] text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-md z-10">
                  {product.badge}
                </span>
              )}

              <button
                onClick={() => toggleWishlist(product)}
                className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/90 backdrop-blur-xs shadow-md flex items-center justify-center text-stone-600 hover:text-rose-600 transition-all hover:scale-105 cursor-pointer"
                aria-label="Wishlist"
              >
                <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-rose-600 text-rose-600' : ''}`} />
              </button>

              <img
                src={selectedImage || product.image}
                alt={product.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />

              {/* Watch Video Button trigger */}
              <button
                onClick={() => setIsVideoModalOpen(true)}
                className="absolute bottom-4 left-4 z-10 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0E2A1B]/90 hover:bg-[#0E2A1B] text-white text-xs font-semibold backdrop-blur-xs border border-[#D4AF37]/30 transition-all shadow-md cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-[#D4AF37] text-[#D4AF37]" />
                <span>Watch Video</span>
              </button>
            </div>
          </div>

          {/* RIGHT: Product Details & Purchase Actions */}
          <div className="lg:col-span-6 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              
              {/* Flavor Tag & Stock status */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold tracking-widest text-[#28543B] uppercase">
                  {product.flavor} • 100% Fox Nuts
                </span>
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                  <Check className="w-3.5 h-3.5" /> In Stock ({product.stockCount || 200}+ packs)
                </span>
              </div>

              {/* Title */}
              <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#0E2A1B]">
                {product.name}
              </h1>

              {/* Rating & Reviews summary */}
              <div className="flex items-center gap-3">
                <div className="flex items-center text-amber-500">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                  <span className="font-bold text-sm ml-1.5 text-stone-900">{product.rating}</span>
                </div>
                <span className="text-xs text-stone-400">•</span>
                <a href="#reviews" onClick={() => setActiveTab('reviews')} className="text-xs text-[#0E2A1B] underline hover:text-[#D4AF37] font-medium">
                  ({product.reviewsCount} Customer Reviews)
                </a>
              </div>

              {/* Pricing row */}
              <div className="flex items-baseline gap-3 pt-2">
                <span className="text-3xl font-extrabold text-[#0E2A1B]">
                  ₹{currentPrice}
                </span>
                {currentOldPrice && (
                  <span className="text-base text-stone-400 line-through">
                    ₹{currentOldPrice}
                  </span>
                )}
                {product.discountPercent && (
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800">
                    {product.discountPercent}% OFF
                  </span>
                )}
              </div>

              {/* Short description */}
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                {product.description}
              </p>

              {/* Weight Selector */}
              <div className="space-y-2 pt-2">
                <label className="text-xs font-bold uppercase tracking-wider text-stone-700">
                  Select Pack Weight:
                </label>
                <div className="flex flex-wrap gap-2.5">
                  {(product.weightOptions || [{ weight: product.weight || '250g' }]).map((opt) => {
                    const isSelected = selectedWeight === opt.weight;
                    return (
                      <button
                        key={opt.weight}
                        onClick={() => setSelectedWeight(opt.weight)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                          isSelected
                            ? 'border-[#0E2A1B] bg-[#0E2A1B] text-[#D4AF37] shadow-md'
                            : 'border-stone-300 text-stone-700 bg-white hover:border-stone-500'
                        }`}
                      >
                        {opt.weight}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Quantity Selector */}
              <div className="flex items-center gap-4 pt-2">
                <label className="text-xs font-bold uppercase tracking-wider text-stone-700">
                  Quantity:
                </label>
                <div className="flex items-center border border-stone-300 rounded-xl bg-stone-50 overflow-hidden shadow-xs">
                  <button
                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    className="p-2 text-stone-600 hover:bg-stone-200 transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="px-4 text-sm font-bold">{quantity}</span>
                  <button
                    onClick={() => setQuantity(q => q + 1)}
                    className="p-2 text-stone-600 hover:bg-stone-200 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Action Buttons (Add to Cart & Buy Now) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4">
                <button
                  onClick={() => handleAddToCart(false)}
                  className={`py-3.5 px-6 rounded-xl text-xs sm:text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md ${
                    isAdded
                      ? 'bg-emerald-700 text-white'
                      : 'bg-[#0E2A1B] text-white hover:bg-[#1B3B29] border border-[#D4AF37]/40'
                  }`}
                >
                  {isAdded ? (
                    <>
                      <Check className="w-4 h-4 text-[#D4AF37]" />
                      <span>Added to Cart!</span>
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="w-4 h-4 text-[#D4AF37]" />
                      <span>ADD TO CART</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleBuyNow}
                  className="py-3.5 px-6 rounded-xl gold-gradient-btn font-bold text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg"
                >
                  <Zap className="w-4 h-4 fill-[#0E2A1B]" />
                  <span>BUY NOW</span>
                </button>
              </div>

            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-6 border-t border-stone-100 text-xs text-stone-600">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-[#0E2A1B]" />
                <span>Same Day Delivery</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#0E2A1B]" />
                <span>Secure Payments</span>
              </div>
              <div className="flex items-center gap-2 col-span-2 sm:col-span-1">
                <Leaf className="w-4 h-4 text-[#0E2A1B]" />
                <span>100% Natural</span>
              </div>
            </div>

          </div>

        </div>

        {/* BOTTOM TABS SECTION (Description, Ingredients, Nutrition, Benefits, Reviews, FAQs) */}
        <div className="mt-12 bg-white rounded-3xl p-6 sm:p-10 border border-[#E8E2D5] shadow-xs">
          
          {/* Tabs Navigation Header */}
          {/* Tabs Navigation Header - Only Description, Product Details, and Reviews */}
          <div className="flex items-center gap-2 sm:gap-6 border-b border-stone-200 overflow-x-auto no-scrollbar pb-1">
            {[
              { id: 'description', label: 'Description' },
              { id: 'details', label: 'Product Details' },
              { id: 'reviews', label: `Reviews (${reviewsTotal || productReviews.length || (REVIEWS || []).filter(r => r.status === 'Approved').length || product.reviewsCount || 0})` }
            ].map(tab => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-3 px-3 sm:px-5 text-xs sm:text-sm font-bold uppercase tracking-wider whitespace-nowrap transition-all border-b-2 cursor-pointer ${
                    isActive
                      ? 'border-[#0E2A1B] text-[#0E2A1B]'
                      : 'border-transparent text-stone-500 hover:text-stone-900'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Tab Content Display */}
          <div className="py-6 text-sm text-stone-700 leading-relaxed">
            
            {/* 1. Description Tab */}
            {activeTab === 'description' && (
              <div className="space-y-4">
                <p className="text-base text-stone-800 font-serif leading-relaxed whitespace-pre-line">
                  {product.description || "Crafted with love and artisanal care. Sourced ethically from organic wetlands, our lotus seeds undergo rigorous air cleaning, manual sizing, and slow thermal roasting."}
                </p>
                {product.storage && (
                  <div className="p-4 bg-[#FAF7F2] rounded-2xl border border-[#E8E2D5] mt-4">
                    <h4 className="font-serif font-bold text-xs uppercase text-[#0E2A1B] mb-1">Storage Instructions</h4>
                    <p className="text-xs text-stone-600">{product.storage}</p>
                  </div>
                )}
              </div>
            )}

            {/* 2. Product Details Tab */}
            {activeTab === 'details' && (
              <div className="space-y-4">
                {(product.productDetails || product.details) ? (
                  <div className="p-5 sm:p-6 bg-[#FAF7F2] rounded-2xl border border-[#E8E2D5] space-y-3">
                    <h4 className="font-serif text-base sm:text-lg font-bold text-[#0E2A1B]">
                      Product Specifications & Details
                    </h4>
                    <div className="space-y-2.5 pt-1">
                      {(product.productDetails || product.details).split('\n').map((line, idx) => {
                        const trimmed = line.trim();
                        if (!trimmed) return null;
                        return (
                          <div key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-stone-700">
                            <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                            <span>{trimmed.replace(/^[•\-\*]\s*/, '')}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="p-5 sm:p-6 bg-[#FAF7F2] rounded-2xl border border-[#E8E2D5] space-y-4">
                    <h4 className="font-serif text-base sm:text-lg font-bold text-[#0E2A1B]">
                      Product Specifications
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm">
                      <div className="p-3.5 bg-white rounded-xl border border-stone-200 shadow-2xs">
                        <span className="text-stone-400 block text-[11px] font-bold uppercase tracking-wider">Weight / Pack Size</span>
                        <span className="font-bold text-stone-900 mt-0.5 block">{product.weight || selectedWeight || '150g'}</span>
                      </div>
                      <div className="p-3.5 bg-white rounded-xl border border-stone-200 shadow-2xs">
                        <span className="text-stone-400 block text-[11px] font-bold uppercase tracking-wider">Category</span>
                        <span className="font-bold text-stone-900 capitalize mt-0.5 block">{product.category?.replace(/-/g, ' ')}</span>
                      </div>
                      <div className="p-3.5 bg-white rounded-xl border border-stone-200 shadow-2xs">
                        <span className="text-stone-400 block text-[11px] font-bold uppercase tracking-wider">Dietary & Processing</span>
                        <span className="font-bold text-stone-900 mt-0.5 block">100% Vegan, Gluten-Free, Slow-Roasted (Zero Palm Oil)</span>
                      </div>
                      <div className="p-3.5 bg-white rounded-xl border border-stone-200 shadow-2xs">
                        <span className="text-stone-400 block text-[11px] font-bold uppercase tracking-wider">Shelf Life & Storage</span>
                        <span className="font-bold text-stone-900 mt-0.5 block">9 Months • Store in a cool, dry airtight container</span>
                      </div>
                    </div>
                    {product.ingredients && (
                      <div className="p-3.5 bg-white rounded-xl border border-stone-200 shadow-2xs">
                        <span className="text-stone-400 block text-[11px] font-bold uppercase tracking-wider">Key Ingredients</span>
                        <span className="font-semibold text-stone-800 mt-0.5 block">{product.ingredients}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* 3. Reviews Tab */}
            {activeTab === 'reviews' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 bg-[#FAF7F2] rounded-2xl border border-[#E8E2D5]">
                  <div>
                    <h4 className="font-serif text-2xl font-bold text-[#0E2A1B]">
                      {product.rating ? Number(product.rating).toFixed(1) : '5.0'} Out of 5 Stars
                    </h4>
                    <p className="text-xs text-stone-500">
                      Based on {reviewsTotal || productReviews.length || product.reviewsCount || 0} verified customer reviews
                    </p>
                  </div>
                  <button 
                    onClick={() => {
                      setReviewError('');
                      if (authUser?.name && !newReviewAuthor) {
                        setNewReviewAuthor(authUser.name);
                      }
                      setIsWriteReviewOpen(true);
                    }}
                    className="px-5 py-2.5 bg-[#0E2A1B] text-white hover:bg-[#1B3B29] rounded-xl text-xs font-bold uppercase tracking-wider shadow-md cursor-pointer"
                  >
                    Write a Review
                  </button>
                </div>

                <div className="space-y-4">
                  {productReviews.length === 0 && !reviewsLoading && (
                    <div className="text-center py-8 text-stone-500 text-xs bg-white rounded-xl border border-stone-200">
                      No reviews yet for this flavor. Be the first verified buyer to share your thoughts!
                    </div>
                  )}

                  {(productReviews.length > 0 ? productReviews : (REVIEWS || []).filter(r => r.status === 'Approved')).map(r => (
                    <div key={r.id || r._id} className="p-4 rounded-xl border border-stone-100 bg-white space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <img src={r.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'} alt="" className="w-7 h-7 rounded-full object-cover" />
                          <span className="font-serif text-xs font-bold text-[#0E2A1B]">{r.author}</span>
                          {r.verified && (
                            <span className="text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Verified Buyer</span>
                          )}
                          {r.featured && (
                            <span className="text-[10px] text-[#D4AF37] bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 font-semibold">
                              ★ Featured
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-stone-400">{r.date}</span>
                      </div>
                      <div className="flex text-amber-400">
                        {[...Array(r.rating || 5)].map((_, idx) => <Star key={idx} className="w-3.5 h-3.5 fill-amber-400" />)}
                      </div>
                      {r.title && <h5 className="font-bold text-xs text-stone-800">"{r.title}"</h5>}
                      <p className="text-xs text-stone-700 italic">"{r.content || r.comment}"</p>
                      {r.adminReply && (
                        <div className="mt-2 text-[11px] bg-stone-50 p-2.5 rounded-lg border-l-2 border-[#0E2A1B] text-stone-600">
                          <strong className="text-[#0E2A1B]">AURIVÁ Team Response:</strong> {r.adminReply}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

        </div>

        {/* SIMILAR PRODUCTS / RELATED SNACKS */}
        <section className="mt-14 sm:mt-20">
          <div className="flex items-center justify-between mb-8">
            <div>
              <span className="text-xs uppercase tracking-widest text-[#28543B] font-bold">PAIR & ENJOY</span>
              <h3 className="font-serif text-2xl sm:text-3xl font-bold text-[#0E2A1B]">Similar Products</h3>
            </div>
            <Link to="/shop" className="text-xs font-bold uppercase tracking-wider text-[#0E2A1B] hover:text-[#D4AF37] flex items-center gap-1">
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {similarProducts.map(p => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>

      </main>

      {/* MOBILE STICKY BOTTOM ACTION BAR (Positioned above fixed mobile bottom nav) */}
      <div className="fixed bottom-[56px] inset-x-0 bg-white/95 backdrop-blur-md border-t border-[#E8E2D5] px-4 py-2.5 z-40 md:hidden shadow-2xl flex items-center gap-3">
        <div className="flex flex-col pl-1 shrink-0">
          <span className="text-[10px] text-stone-500 font-medium">Total Price</span>
          <span className="font-sans text-base font-extrabold text-[#0E2A1B] tracking-tight">₹{currentPrice * quantity}</span>
        </div>
        <div className="flex-1 grid grid-cols-2 gap-2">
          <button
            onClick={() => handleAddToCart(true)}
            className="py-2.5 px-3 rounded-xl bg-[#0E2A1B] text-white text-xs font-bold uppercase tracking-wider min-h-[40px]"
          >
            {isAdded ? 'Added!' : 'Add to Cart'}
          </button>
          <button
            onClick={handleBuyNow}
            className="py-2.5 px-3 rounded-xl gold-gradient-btn text-xs font-bold uppercase tracking-wider min-h-[40px]"
          >
            Buy Now
          </button>
        </div>
      </div>

      {/* Video Modal Simulation */}
      {isVideoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0E2A1B] text-white p-6 rounded-3xl max-w-lg w-full border border-[#D4AF37]/30 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-lg font-bold">The Art of Slow-Roasted Makhana</h3>
              <button onClick={() => setIsVideoModalOpen(false)} className="text-stone-400 hover:text-white">✕</button>
            </div>
            <div className="aspect-video bg-black/60 rounded-2xl flex flex-col items-center justify-center p-4 text-center border border-white/10">
              <Play className="w-12 h-12 text-[#D4AF37] mb-2 animate-bounce" />
              <p className="text-xs text-stone-300">Watch our organic harvesting & artisan roasting process in Bihar wetlands.</p>
            </div>
            <button
              onClick={() => setIsVideoModalOpen(false)}
              className="w-full py-2.5 rounded-xl bg-[#1B3B29] text-[#D4AF37] font-semibold text-xs uppercase tracking-wider"
            >
              Close Video
            </button>
          </div>
        </div>
      )}

      {/* Write Review Modal */}
      {isWriteReviewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-[#E8E2D5] shadow-2xl overflow-hidden animate-in fade-in">
            <div className="p-6 bg-[#0E2A1B] text-white flex items-center justify-between border-b border-[#D4AF37]/30">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#D4AF37]">CUSTOMER FEEDBACK</span>
                <h3 className="font-serif text-lg font-bold">Write a Review for {product.name}</h3>
              </div>
              <button onClick={() => setIsWriteReviewOpen(false)} className="text-stone-400 hover:text-white">✕</button>
            </div>

            {reviewSubmitted ? (
              <div className="p-8 text-center space-y-3">
                <Check className="w-12 h-12 text-emerald-600 mx-auto bg-emerald-50 rounded-full p-2" />
                <h4 className="font-serif text-lg font-bold text-[#0E2A1B]">Thank You for Your Review!</h4>
                <p className="text-xs text-stone-600">Your review has been submitted to the admin moderation queue and will appear live once approved.</p>
                <button
                  onClick={() => {
                    setIsWriteReviewOpen(false);
                    setReviewSubmitted(false);
                  }}
                  className="px-5 py-2 bg-[#0E2A1B] text-white text-xs font-bold rounded-xl"
                >
                  Close
                </button>
              </div>
            ) : (
              <form
                onSubmit={handleReviewSubmit}
                className="p-6 space-y-4 text-xs"
              >
                {!isAuthenticated && (
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
                    Please log in to your customer account to submit a review for your delivered purchase.
                  </div>
                )}

                {reviewEligibility && !reviewEligibility.canReview && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                    {reviewEligibility.message}
                  </div>
                )}

                {reviewError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium">
                    {reviewError}
                  </div>
                )}
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Your Full Name *</label>
                  <input
                    type="text"
                    required
                    value={newReviewAuthor}
                    onChange={e => setNewReviewAuthor(e.target.value)}
                    placeholder="e.g. Shruti Sen"
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:border-[#0E2A1B]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">Rating *</label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setNewReviewRating(star)}
                        className="p-1 hover:scale-110 transition-transform"
                      >
                        <Star className={`w-6 h-6 ${star <= newReviewRating ? 'fill-amber-400 text-amber-400' : 'text-stone-300'}`} />
                      </button>
                    ))}
                    <span className="font-bold text-stone-800 ml-2">{newReviewRating} Stars</span>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">Review Headline</label>
                  <input
                    type="text"
                    value={newReviewTitle}
                    onChange={e => setNewReviewTitle(e.target.value)}
                    placeholder="e.g. Best makhana for evening snack!"
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">Your Experience & Feedback *</label>
                  <textarea
                    rows={3}
                    required
                    value={newReviewContent}
                    onChange={e => setNewReviewContent(e.target.value)}
                    placeholder="Tell us what you loved about the crunch, flavor, and freshness..."
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:outline-none"
                  />
                </div>

                <div className="pt-3 border-t border-stone-200 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsWriteReviewOpen(false)}
                    className="px-4 py-2 border border-stone-300 text-stone-700 rounded-xl font-bold uppercase"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#0E2A1B] text-white hover:bg-[#1B3B29] rounded-xl font-bold uppercase tracking-wider"
                  >
                    Submit Review
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
