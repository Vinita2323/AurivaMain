import React, { useEffect, useState } from 'react';
import { Mail, Phone, MapPin, Send, Clock, Leaf } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function ContactPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Simulate sending
    setTimeout(() => {
      setSubmitted(true);
      setFormData({ name: '', email: '', subject: '', message: '' });
      setTimeout(() => setSubmitted(false), 5000);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] font-sans text-[#182019]">
      <Header />

      <main className="pb-16 sm:pb-24">
        {/* Page Hero */}
        <div className="bg-[#0E2A1B] text-[#F7F3E9] py-16 sm:py-20 text-center relative overflow-hidden">
          {/* Decorative Background */}
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <div className="absolute top-10 left-10 w-64 h-64 bg-[#D4AF37] rounded-full blur-[100px]"></div>
            <div className="absolute bottom-10 right-10 w-64 h-64 bg-[#143B24] rounded-full blur-[100px]"></div>
          </div>
          
          <div className="relative z-10 max-w-4xl mx-auto px-4">
            <div className="inline-flex items-center justify-center gap-2 mb-4">
              <Leaf className="w-5 h-5 text-[#D4AF37]" />
              <span className="text-[#D4AF37] font-bold tracking-[0.2em] uppercase text-xs sm:text-sm">Get in Touch</span>
            </div>
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">Contact Us</h1>
            <p className="text-sm sm:text-base text-[#A2B5A8] max-w-2xl mx-auto leading-relaxed">
              Have a question about our premium makhana, your recent order, or wholesale inquiries? We'd love to hear from you.
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 mt-[-30px] sm:mt-[-50px] relative z-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
            
            {/* Left: Contact Info */}
            <div className="lg:col-span-5 space-y-6">
              
              <div className="bg-white rounded-3xl p-8 sm:p-10 shadow-lg border border-[#E8E2D5] flex flex-col h-full">
                <h3 className="font-serif text-2xl font-bold text-[#0E2A1B] mb-8">Contact Information</h3>
                
                <div className="space-y-8 flex-grow">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-[#F7F3E9] flex items-center justify-center shrink-0 border border-[#D4AF37]/30">
                      <Phone className="w-5 h-5 text-[#C89038]" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-[#5A6B60] uppercase tracking-wider mb-1">Phone</h4>
                      <p className="text-[#182019] font-medium">+91 12345 67890</p>
                      <p className="text-[#5A6B60] text-sm mt-1">Mon-Sat, 9AM to 6PM</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-[#F7F3E9] flex items-center justify-center shrink-0 border border-[#D4AF37]/30">
                      <Mail className="w-5 h-5 text-[#C89038]" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-[#5A6B60] uppercase tracking-wider mb-1">Email</h4>
                      <p className="text-[#182019] font-medium">hello@auriva.com</p>
                      <p className="text-[#182019] font-medium mt-1">support@auriva.com</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-[#F7F3E9] flex items-center justify-center shrink-0 border border-[#D4AF37]/30">
                      <MapPin className="w-5 h-5 text-[#C89038]" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-[#5A6B60] uppercase tracking-wider mb-1">Office</h4>
                      <p className="text-[#182019] font-medium leading-relaxed">
                        Aurivá Headquarters<br/>
                        123 Premium Park, Industrial Area<br/>
                        Indore, Madhya Pradesh 452001<br/>
                        India
                      </p>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Right: Contact Form */}
            <div className="lg:col-span-7">
              <div className="bg-white rounded-3xl p-8 sm:p-10 shadow-lg border border-[#E8E2D5]">
                <h3 className="font-serif text-2xl font-bold text-[#0E2A1B] mb-2">Send us a Message</h3>
                <p className="text-[#5A6B60] text-sm mb-8">Fill out the form below and our team will get back to you within 24 hours.</p>

                {submitted ? (
                  <div className="bg-[#EAF5ED] border border-[#A2CBAF] text-[#133E28] p-6 rounded-2xl flex flex-col items-center text-center py-12">
                    <div className="w-16 h-16 bg-[#133E28] rounded-full flex items-center justify-center mb-4">
                      <Send className="w-8 h-8 text-[#EAF5ED]" />
                    </div>
                    <h4 className="text-xl font-bold mb-2">Message Sent Successfully!</h4>
                    <p className="text-sm">Thank you for reaching out. We will get back to you soon.</p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-[#3A4B41] uppercase tracking-wider" htmlFor="name">
                          Full Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          id="name"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          required
                          className="w-full px-4 py-3 rounded-xl border border-[#E8E2D5] bg-[#FAF7F2] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C89038]/50 focus:border-[#C89038] transition-colors text-sm"
                          placeholder="John Doe"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-[#3A4B41] uppercase tracking-wider" htmlFor="email">
                          Email Address <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="email"
                          id="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          required
                          className="w-full px-4 py-3 rounded-xl border border-[#E8E2D5] bg-[#FAF7F2] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C89038]/50 focus:border-[#C89038] transition-colors text-sm"
                          placeholder="john@example.com"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-[#3A4B41] uppercase tracking-wider" htmlFor="subject">
                        Subject <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="subject"
                        name="subject"
                        value={formData.subject}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 rounded-xl border border-[#E8E2D5] bg-[#FAF7F2] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C89038]/50 focus:border-[#C89038] transition-colors text-sm"
                        placeholder="How can we help you?"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-[#3A4B41] uppercase tracking-wider" htmlFor="message">
                        Message <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        id="message"
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        required
                        rows="5"
                        className="w-full px-4 py-3 rounded-xl border border-[#E8E2D5] bg-[#FAF7F2] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C89038]/50 focus:border-[#C89038] transition-colors text-sm resize-none"
                        placeholder="Write your message here..."
                      ></textarea>
                    </div>

                    <button
                      type="submit"
                      className="w-full sm:w-auto bg-[#0E2A1B] hover:bg-[#143B24] text-[#D4AF37] font-bold text-xs uppercase tracking-widest px-8 py-4 rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 group"
                    >
                      <span>Send Message</span>
                      <Send className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </form>
                )}
              </div>
            </div>
            
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
