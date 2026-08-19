import React, { useState, useEffect } from 'react';
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

export default function ProductDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { products: PRODUCTS, reviews: REVIEWS, addReview } = useAdmin();

  // Find product by slug or default to first product
  const product = (PRODUCTS || []).find(p => p.slug === slug) || PRODUCTS[0] || {};

  const [selectedImage, setSelectedImage] = useState(product?.image);
  const [selectedWeight, setSelectedWeight] = useState(product?.weight || '250g');
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('description');
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [isAdded, setIsAdded] = useState(false);

  // Write Review State
  const [isWriteReviewOpen, setIsWriteReviewOpen] = useState(false);
  const [newReviewAuthor, setNewReviewAuthor] = useState('');
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [newReviewTitle, setNewReviewTitle] = useState('');
  const [newReviewContent, setNewReviewContent] = useState('');
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setSelectedImage(product.image);
    setSelectedWeight(product.weight || '250g');
    setQuantity(1);
  }, [slug, product]);

  const isWishlisted = isInWishlist(product.id);

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
    <div className="min-h-screen bg-[#F7F3E9] text-[#182019] selection:bg-[#D4AF37] selection:text-[#0E2A1B] pb-36 md:pb-0">
      <AnnouncementBar />
      <Header />

      <main className="py-6 sm:py-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-1.5 text-xs text-stone-500 mb-8">
          <Link to="/" className="hover:text-[#0E2A1B] transition-colors">Home</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link to={`/shop?category=${product.category}`} className="hover:text-[#0E2A1B] capitalize transition-colors">
            {product.category.replace('-', ' ')}
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-[#0E2A1B] font-semibold">{product.name}</span>
        </nav>

        {/* TOP PRODUCT SECTION (Gallery + Product Info) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 bg-white rounded-3xl p-6 sm:p-10 border border-[#E8E2D5] shadow-xs">
          
          {/* LEFT: Product Gallery */}
          <div className="lg:col-span-6 space-y-4">
            {/* Main Active Image with Zoom effect */}
            <div className="relative aspect-square rounded-2xl bg-[#FAF7F2] p-6 border border-[#E8E2D5] flex items-center justify-center overflow-hidden group">
              {product.badge && (
                <span className="absolute top-4 left-4 bg-[#D4AF37] text-[#0E2A1B] text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm z-10">
                  {product.badge}
                </span>
              )}

              <button
                onClick={() => toggleWishlist(product.id)}
                className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/90 shadow-md flex items-center justify-center text-stone-600 hover:text-rose-600 transition-colors"
                aria-label="Wishlist"
              >
                <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-rose-600 text-rose-600' : ''}`} />
              </button>

              <img
                src={selectedImage}
                alt={product.name}
                className="w-full h-full object-contain mix-blend-multiply group-hover:scale-110 transition-transform duration-500"
              />

              {/* Watch Video Button trigger */}
              <button
                onClick={() => setIsVideoModalOpen(true)}
                className="absolute bottom-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#0E2A1B]/90 hover:bg-[#0E2A1B] text-white text-xs font-semibold backdrop-blur-xs border border-[#D4AF37]/30 transition-all shadow-md"
              >
                <Play className="w-3.5 h-3.5 fill-[#D4AF37] text-[#D4AF37]" />
                <span>Watch Video</span>
              </button>
            </div>

            {/* Thumbnails Row */}
            {product.gallery && product.gallery.length > 1 && (
              <div className="flex items-center gap-3 overflow-x-auto no-scrollbar py-1">
                {product.gallery.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(img)}
                    className={`relative w-20 h-20 rounded-xl overflow-hidden bg-[#FAF7F2] p-1 border-2 transition-all shrink-0 ${
                      selectedImage === img
                        ? 'border-[#0E2A1B] ring-2 ring-[#D4AF37]/50'
                        : 'border-stone-200 hover:border-stone-400 opacity-80 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-contain mix-blend-multiply" />
                  </button>
                ))}
              </div>
            )}
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
          <div className="flex items-center gap-2 sm:gap-6 border-b border-stone-200 overflow-x-auto no-scrollbar pb-1">
            {[
              { id: 'description', label: 'Description' },
              { id: 'ingredients', label: 'Ingredients' },
              { id: 'nutrition', label: 'Nutrition Facts' },
              { id: 'benefits', label: 'Health Benefits' },
              { id: 'reviews', label: `Reviews (${product.reviewsCount})` },
              { id: 'faqs', label: 'FAQs' }
            ].map(tab => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-3 px-3 sm:px-4 text-xs sm:text-sm font-bold uppercase tracking-wider whitespace-nowrap transition-all border-b-2 ${
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
            
            {activeTab === 'description' && (
              <div className="space-y-4">
                <p className="text-base text-stone-800 font-serif">
                  {product.description}
                </p>
                <p>
                  Sourced ethically from organic wetlands, our lotus seeds undergo rigorous air cleaning, manual sizing, and slow thermal roasting. Never deep-fried in palm oils or infused with artificial flavor enhancers.
                </p>
                <div className="p-4 bg-[#FAF7F2] rounded-2xl border border-[#E8E2D5] mt-4">
                  <h4 className="font-serif font-bold text-xs uppercase text-[#0E2A1B] mb-1">Storage Instructions</h4>
                  <p className="text-xs text-stone-600">{product.storage}</p>
                </div>
              </div>
            )}

            {activeTab === 'ingredients' && (
              <div className="space-y-3">
                <h4 className="font-serif text-base font-bold text-[#0E2A1B]">100% Honest Ingredient List</h4>
                <p className="p-4 bg-[#FAF7F2] rounded-2xl border border-[#E8E2D5] font-medium text-stone-800">
                  {product.ingredients}
                </p>
                <p className="text-xs text-stone-500">
                  Allergen information: Packed in a facility that also processes almonds, cashews and natural sesame seeds.
                </p>
              </div>
            )}

            {activeTab === 'nutrition' && product.nutrition && (
              <div className="space-y-4">
                <h4 className="font-serif text-base font-bold text-[#0E2A1B]">Nutritional Breakdown (Per Serving: {product.nutrition.servingSize})</h4>
                <div className="overflow-x-auto">
                  <table className="w-full max-w-xl text-xs text-left border border-stone-200 rounded-xl overflow-hidden">
                    <thead className="bg-[#0E2A1B] text-white">
                      <tr>
                        <th className="p-3">Nutrient</th>
                        <th className="p-3">Amount per Serving</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100 bg-[#FAF7F2]">
                      <tr><td className="p-3 font-semibold">Energy (Calories)</td><td className="p-3 font-bold text-[#0E2A1B]">{product.nutrition.calories}</td></tr>
                      <tr><td className="p-3 font-semibold">Protein</td><td className="p-3 font-bold text-emerald-700">{product.nutrition.protein}</td></tr>
                      <tr><td className="p-3 font-semibold">Carbohydrates</td><td className="p-3">{product.nutrition.carbohydrates}</td></tr>
                      <tr><td className="p-3 font-semibold">Dietary Fiber</td><td className="p-3 font-bold text-emerald-700">{product.nutrition.fiber}</td></tr>
                      <tr><td className="p-3 font-semibold">Total Fat</td><td className="p-3">{product.nutrition.totalFat}</td></tr>
                      <tr><td className="p-3 font-semibold">Cholesterol</td><td className="p-3">0 mg</td></tr>
                      <tr><td className="p-3 font-semibold">Sodium</td><td className="p-3">{product.nutrition.sodium || '140mg'}</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'benefits' && (
              <div className="space-y-3">
                <h4 className="font-serif text-base font-bold text-[#0E2A1B]">Health & Wellness Advantages</h4>
                <ul className="space-y-2.5">
                  {(product.benefits || [
                    "High in plant protein and vital amino acids",
                    "Low glycemic index supporting balanced glucose",
                    "Zero trans fat and zero cholesterol"
                  ]).map((benefit, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 bg-[#FAF7F2] rounded-2xl border border-[#E8E2D5]">
                  <div>
                    <h4 className="font-serif text-2xl font-bold text-[#0E2A1B]">4.8 Out of 5 Stars</h4>
                    <p className="text-xs text-stone-500">Based on verified purchases & ratings</p>
                  </div>
                  <button 
                    onClick={() => setIsWriteReviewOpen(true)}
                    className="px-5 py-2.5 bg-[#0E2A1B] text-white hover:bg-[#1B3B29] rounded-xl text-xs font-bold uppercase tracking-wider shadow-md"
                  >
                    Write a Review
                  </button>
                </div>

                <div className="space-y-4">
                  {(REVIEWS || []).filter(r => r.status === 'Approved').map(r => (
                    <div key={r.id} className="p-4 rounded-xl border border-stone-100 bg-white space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <img src={r.avatar} alt="" className="w-7 h-7 rounded-full object-cover" />
                          <span className="font-serif text-xs font-bold text-[#0E2A1B]">{r.author}</span>
                          <span className="text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Verified Buyer</span>
                        </div>
                        <span className="text-[11px] text-stone-400">{r.date}</span>
                      </div>
                      <div className="flex text-amber-400">
                        {[...Array(r.rating || 5)].map((_, idx) => <Star key={idx} className="w-3.5 h-3.5 fill-amber-400" />)}
                      </div>
                      <p className="text-xs text-stone-700 italic">"{r.content}"</p>
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

            {activeTab === 'faqs' && (
              <div className="space-y-3 max-w-2xl">
                {[
                  { q: "How is AURIVÁ makhana roasted?", a: "We slow-roast our lotus seeds in small batches using olive oil mist at controlled temperatures to ensure maximum crunch without degrading natural nutrients." },
                  { q: "Is this suitable for diabetic and keto diets?", a: "Yes! Fox nuts have a low Glycemic Index (GI) and are low in calories and saturated fats." },
                  { q: "What is the shelf life?", a: "Our nitrogen-flushed packaging maintains crispness for 9 months from manufacture. Once opened, consume within 15 days for optimal freshness." },
                  { q: "Are there any artificial preservatives?", a: "Zero preservatives, zero artificial food colors, and no MSG." }
                ].map((faq, i) => (
                  <div key={i} className="p-4 rounded-xl bg-[#FAF7F2] border border-[#E8E2D5] space-y-1">
                    <h5 className="font-serif text-xs sm:text-sm font-bold text-[#0E2A1B] flex items-center gap-2">
                      <HelpCircle className="w-4 h-4 text-[#D4AF37]" />
                      {faq.q}
                    </h5>
                    <p className="text-xs text-stone-600 pl-6">{faq.a}</p>
                  </div>
                ))}
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
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!newReviewAuthor || !newReviewContent) return;
                  addReview({
                    author: newReviewAuthor,
                    product: product.name,
                    rating: newReviewRating,
                    title: newReviewTitle || 'Wonderful taste & quality',
                    content: newReviewContent,
                    role: 'Verified Buyer',
                    city: 'India'
                  });
                  setReviewSubmitted(true);
                  setNewReviewAuthor('');
                  setNewReviewTitle('');
                  setNewReviewContent('');
                }}
                className="p-6 space-y-4 text-xs"
              >
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
