import React from 'react';
import { Leaf, Ban, Dumbbell, Wheat, PackageCheck } from 'lucide-react';

export default function TrustBenefits() {
  const benefits = [
    {
      icon: Leaf,
      title: "100% Natural",
      desc: "Zero chemical synthetics"
    },
    {
      icon: Ban,
      title: "No Preservatives",
      desc: "Pure wholesome ingredients"
    },
    {
      icon: Dumbbell,
      title: "High in Protein",
      desc: "Clean plant-based fuel"
    },
    {
      icon: Wheat,
      title: "Rich in Fiber",
      desc: "Promotes digestive wellness"
    },
    {
      icon: PackageCheck,
      title: "Carefully Packed",
      desc: "Airtight nitrogen flush"
    }
  ];

  return (
    <section className="bg-[#0E2A1B] text-white py-6 sm:py-8 border-y border-[#D4AF37]/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 sm:gap-6">
          {benefits.map((item, index) => {
            const Icon = item.icon;
            return (
              <div 
                key={item.title} 
                className={`flex flex-col sm:flex-row items-center text-center sm:text-left gap-3 p-3 rounded-xl bg-white/5 border border-[#D4AF37]/10 hover:border-[#D4AF37]/40 transition-all ${
                  index === 4 ? 'col-span-2 md:col-span-1 justify-center sm:justify-start' : ''
                }`}
              >
                <div className="w-10 h-10 rounded-full bg-[#1B3B29] border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37] shrink-0 shadow-xs">
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-serif text-xs sm:text-sm font-bold text-[#F7F3E9] tracking-wide">
                    {item.title}
                  </h4>
                  <p className="text-[10px] sm:text-[11px] text-[#A2B5A8]">
                    {item.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
