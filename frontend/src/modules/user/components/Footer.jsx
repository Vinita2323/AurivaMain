import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Lock, Truck, RefreshCcw, ShieldCheck, MapPin, Phone, Leaf } from 'lucide-react';
import bowlImg from '../../../assets/user/Flavored Makhana.jpg';

export default function Footer() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setEmail('');
      setTimeout(() => setSubscribed(false), 4000);
    }
  };

  return (
    <footer className="w-full relative bg-[#0E2A1B] text-[#A2B5A8] border-t border-[#E8E2D5] overflow-hidden">
      
      {/* Top Banner (Beige) */}
      <div className="bg-[#F7F3E9] w-full relative z-10 border-b border-[#E8E2D5]">
        <div className="max-w-[1550px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-8 lg:py-0 flex flex-col lg:flex-row items-center justify-between min-h-[120px] relative">
          
          {/* Left: Newsletter */}
          <div className="flex flex-col sm:flex-row items-center gap-6 lg:w-1/2 w-full mb-8 lg:mb-0">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 flex items-center justify-center border-2 border-[#4A5D52] rounded-lg">
                <Leaf className="w-6 h-6 text-[#4A5D52]" />
              </div>
              <div>
                <h4 className="font-bold text-[#0E2A1B] text-sm uppercase tracking-wider mb-1">STAY IN THE LOOP</h4>
                <p className="text-[#3A4B41] text-xs">Get exclusive offers, new launches<br className="hidden sm:block" />& healthy tips straight to your inbox.</p>
              </div>
            </div>
            
            <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto mt-4 sm:mt-0">
              <input
                type="email"
                placeholder="Enter your email"
                className="bg-transparent border border-[#C2BAA6] rounded-md px-4 py-2.5 text-sm outline-none focus:border-[#0E2A1B] w-full sm:w-60 text-[#0E2A1B] placeholder:text-[#8C8673]"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <button
                type="submit"
                className="bg-[#0E2A1B] hover:bg-[#143B24] text-[#D4AF37] font-bold uppercase text-[10px] sm:text-xs px-6 py-2.5 rounded-md transition-colors"
              >
                {subscribed ? 'SUBSCRIBED' : 'SUBSCRIBE'}
              </button>
            </form>
          </div>

          {/* Right: Features */}
          <div className="flex flex-wrap lg:flex-nowrap justify-center sm:justify-end gap-6 sm:gap-12 lg:w-1/3 w-full lg:pr-32">
            <div className="flex flex-col items-center text-center">
              <Lock className="w-6 h-6 text-[#4A5D52] mb-2" />
              <span className="text-[#0E2A1B] text-[10px] sm:text-xs font-semibold leading-tight">Secure<br/>Payments</span>
            </div>
            <div className="flex flex-col items-center text-center">
              <Truck className="w-6 h-6 text-[#4A5D52] mb-2" />
              <span className="text-[#0E2A1B] text-[10px] sm:text-xs font-semibold leading-tight">Fast<br/>Delivery</span>
            </div>
            <div className="flex flex-col items-center text-center">
              <RefreshCcw className="w-6 h-6 text-[#4A5D52] mb-2" />
              <span className="text-[#0E2A1B] text-[10px] sm:text-xs font-semibold leading-tight">Easy<br/>Returns</span>
            </div>
            <div className="flex flex-col items-center text-center">
              <ShieldCheck className="w-6 h-6 text-[#4A5D52] mb-2" />
              <span className="text-[#0E2A1B] text-[10px] sm:text-xs font-semibold leading-tight">100% Safe<br/>& Secure</span>
            </div>
          </div>

        </div>
      </div>

      {/* Floating Image (Removed) */}

      {/* Main Footer Content */}
      <div className="max-w-[1550px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 pt-12 lg:pt-16 pb-6 sm:pb-8 relative z-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8">
          
          {/* Brand Info */}
          <div className="lg:col-span-1 flex flex-col items-start">
            <div className="flex items-center gap-2 mb-4">
              <Leaf className="w-8 h-8 text-[#C89038]" />
              <h2 className="font-serif text-3xl text-[#F7F3E9] font-bold">Aurivá</h2>
            </div>
            <p className="text-xs text-[#8A9C90] leading-relaxed mb-6">
              Premium makhana, handpicked from the best farms & crafted for a healthier you.
            </p>
            <div className="flex gap-4">
              <a href="#" className="w-8 h-8 rounded-full border border-[#4A5D52] flex items-center justify-center hover:bg-[#C89038] hover:border-[#C89038] hover:text-[#0E2A1B] transition-all text-[#C89038]">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
              </a>
              <a href="#" className="w-8 h-8 rounded-full border border-[#4A5D52] flex items-center justify-center hover:bg-[#C89038] hover:border-[#C89038] hover:text-[#0E2A1B] transition-all text-[#C89038]">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
              </a>
              <a href="#" className="w-8 h-8 rounded-full border border-[#4A5D52] flex items-center justify-center hover:bg-[#C89038] hover:border-[#C89038] hover:text-[#0E2A1B] transition-all text-[#C89038]">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33 2.78 2.78 0 0 0 1.94 2c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.33 29 29 0 0 0-.46-5.33z"></path><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"></polygon></svg>
              </a>
            </div>
          </div>

          {/* Shop */}
          <div className="flex flex-col">
            <h4 className="font-bold text-[#C89038] text-xs tracking-wider uppercase mb-5">SHOP</h4>
            <ul className="space-y-3">
              <li><Link to="/shop" className="text-xs hover:text-[#F7F3E9] transition-colors">All Products</Link></li>
              <li><Link to="/shop" className="text-xs hover:text-[#F7F3E9] transition-colors">Makhana Flavours</Link></li>
              <li><Link to="/shop" className="text-xs hover:text-[#F7F3E9] transition-colors">Gift Packs</Link></li>
              <li><Link to="/shop" className="text-xs hover:text-[#F7F3E9] transition-colors">Combo Offers</Link></li>
              <li><Link to="/shop" className="text-xs hover:text-[#F7F3E9] transition-colors">New Arrivals</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div className="flex flex-col">
            <h4 className="font-bold text-[#C89038] text-xs tracking-wider uppercase mb-5">COMPANY</h4>
            <ul className="space-y-3">
              <li><Link to="/about" className="text-xs hover:text-[#F7F3E9] transition-colors">Our Story</Link></li>
              <li><Link to="/about" className="text-xs hover:text-[#F7F3E9] transition-colors">Benefits</Link></li>
              <li><Link to="/recipes" className="text-xs hover:text-[#F7F3E9] transition-colors">Recipes</Link></li>
              <li><Link to="/about" className="text-xs hover:text-[#F7F3E9] transition-colors">Blog</Link></li>
              <li><Link to="/contact" className="text-xs hover:text-[#F7F3E9] transition-colors">Contact Us</Link></li>
            </ul>
          </div>

          {/* Help */}
          <div className="flex flex-col">
            <h4 className="font-bold text-[#C89038] text-xs tracking-wider uppercase mb-5">HELP</h4>
            <ul className="space-y-3">
              <li><Link to="/contact" className="text-xs hover:text-[#F7F3E9] transition-colors">FAQ's</Link></li>
              <li><Link to="/contact" className="text-xs hover:text-[#F7F3E9] transition-colors">Shipping & Delivery</Link></li>
              <li><Link to="/contact" className="text-xs hover:text-[#F7F3E9] transition-colors">Returns & Refunds</Link></li>
              <li><Link to="/contact" className="text-xs hover:text-[#F7F3E9] transition-colors">Terms & Conditions</Link></li>
              <li><Link to="/contact" className="text-xs hover:text-[#F7F3E9] transition-colors">Privacy Policy</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div className="flex flex-col">
            <h4 className="font-bold text-[#C89038] text-xs tracking-wider uppercase mb-5">CONTACT US</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <Phone className="w-4 h-4 text-[#C89038] shrink-0 mt-0.5" />
                <span className="text-xs">+91 12345 67890</span>
              </li>
              <li className="flex items-start gap-3">
                <Mail className="w-4 h-4 text-[#C89038] shrink-0 mt-0.5" />
                <span className="text-xs">hello@auriva.com</span>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-[#C89038] shrink-0 mt-0.5" />
                <span className="text-xs">Indore, Madhya Pradesh, India</span>
              </li>
            </ul>
          </div>
          
        </div>
      </div>

      {/* Bottom Copyright Strip */}
      <div className="border-t border-[#143B24] bg-[#0A2014] py-4 relative z-10">
        <div className="max-w-[1550px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-[#8A9C90]">
          <p>© {new Date().getFullYear()} Aurivá Wellness Foods Pvt. Ltd. All rights reserved.</p>
          <div className="flex items-center gap-4 flex-wrap">
            <Link to="/contact" className="hover:text-[#D4AF37] transition-colors">Privacy Policy</Link>
            <span>•</span>
            <Link to="/contact" className="hover:text-[#D4AF37] transition-colors">Terms of Service</Link>
            <span>•</span>
            <Link to="/contact" className="hover:text-[#D4AF37] transition-colors">Shipping & Returns</Link>
          </div>
        </div>
      </div>

      {/* Decorative Leaf Graphic */}
      <Leaf className="w-64 h-64 text-[#143B24] absolute bottom-0 right-0 opacity-40 translate-x-1/4 translate-y-1/4 pointer-events-none" />

    </footer>
  );
}
