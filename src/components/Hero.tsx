/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowRight, MessageCircle, ChevronLeft, ChevronRight, Sparkles, ShoppingBag, Eye, Tag } from "lucide-react";
import { HomepageSettings, BusinessSettings, Product } from "../types";

interface HeroProps {
  homepageSettings: HomepageSettings;
  businessSettings: BusinessSettings;
  onBrowseClick: () => void;
  products?: Product[];
  onProductClick?: (product: Product) => void;
}

export function Hero({ homepageSettings, businessSettings, onBrowseClick, products = [], onProductClick }: HeroProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0); // -1 for left, 1 for right
  const [isHovered, setIsHovered] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Filter available products for sliding showcase (top 5 hot deals or featured)
  const slidingProducts = products && products.length > 0
    ? products.filter(p => p.status !== "Sold Out").slice(0, 5)
    : [];

  // Setup the customized WhatsApp dynamic landing link
  const handleWhatsAppContact = () => {
    const text = `Habari! Nimetembelea tovuti yenu ya ${businessSettings.businessName || "Tech Catalog"} na ningependa kupata maelezo zaidi kuhusu bidhaa zenu za hivi karibuni.`;
    const whatsappUrl = `https://wa.me/${businessSettings.whatsappNumber}?text=${encodeURIComponent(text)}`;
    
    // Register analytics tracking for the contact click
    fetch("/api/analytics/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "whatsapp" })
    }).catch(err => console.error("Analytics track failed:", err));

    window.open(whatsappUrl, "_blank", "referrer");
  };

  const handleNext = () => {
    if (slidingProducts.length <= 1) return;
    setDirection(1);
    setCurrentIndex((prevIndex) => (prevIndex + 1) % slidingProducts.length);
  };

  const handlePrev = () => {
    if (slidingProducts.length <= 1) return;
    setDirection(-1);
    setCurrentIndex((prevIndex) => (prevIndex - 1 + slidingProducts.length) % slidingProducts.length);
  };

  const handleDotClick = (index: number) => {
    if (index === currentIndex) return;
    setDirection(index > currentIndex ? 1 : -1);
    setCurrentIndex(index);
  };

  // Autoplay functionality with hover-pause
  useEffect(() => {
    if (slidingProducts.length <= 1 || isHovered) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      handleNext();
    }, 5000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentIndex, slidingProducts.length, isHovered]);

  const activeProduct = slidingProducts[currentIndex];

  // Helper to format currency
  const formatPrice = (price: number) => {
    return `TSh ${price.toLocaleString()}`;
  };

  // Calculate discount percentage
  const calculateDiscount = (product: Product) => {
    if (!product.previousPrice || product.previousPrice <= product.sellingPrice) return null;
    const diff = product.previousPrice - product.sellingPrice;
    const percentage = Math.round((diff / product.previousPrice) * 100);
    return `${percentage}% OFF`;
  };

  return (
    <div className="relative w-full overflow-hidden bg-white select-none border-b border-slate-100">
      
      {/* Swiss Modern Grid Background */}
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-slate-50/50 via-white to-indigo-50/10">
        <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1.2px,transparent_1.2px)] [background-size:24px_24px] opacity-60" />
        <div className="absolute top-1/4 right-1/4 w-[35rem] h-[35rem] bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 left-1/4 w-[25rem] h-[25rem] bg-violet-500/5 rounded-full blur-3xl pointer-events-none" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20 lg:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* Column 1: Core Landing Copy & Actions */}
          <div className="lg:col-span-7 flex flex-col items-start text-left">
            
            {/* Elegant Brand Tagline Pill */}
            <motion.span
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 text-xs font-semibold tracking-wide uppercase mb-6"
            >
              <span className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
              {businessSettings.tagline || "Authorized Retail & Showcase"}
            </motion.span>

            {/* Title / Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight font-display text-slate-900 leading-[1.1]"
            >
              {homepageSettings.heroTitle || "Find the Best Smartphones & Laptops"}
            </motion.h1>

            {/* Subtitle / Paragraph */}
            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mt-6 text-base sm:text-lg text-slate-600 leading-relaxed font-sans font-light max-w-2xl"
            >
              {homepageSettings.heroSubtitle || "Browse premium technology products at highly competitive prices. Contact our sales representative on WhatsApp for orders and fast delivery across Tanzania."}
            </motion.p>

            {/* CTA Controls */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="mt-10 flex flex-wrap items-center gap-4 w-full sm:w-auto"
            >
              <button
                onClick={onBrowseClick}
                className="w-full sm:w-auto px-6 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm rounded-2xl shadow-lg shadow-indigo-600/15 flex items-center justify-center gap-2 transition-all cursor-pointer group"
              >
                <span>{homepageSettings.primaryButtonText || "Browse Catalog"}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={handleWhatsAppContact}
                className="w-full sm:w-auto px-6 py-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 font-semibold text-sm rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <MessageCircle className="w-5 h-5 text-emerald-500 shrink-0" />
                <span>{homepageSettings.secondaryButtonText || "Contact WhatsApp"}</span>
              </button>
            </motion.div>
          </div>

          {/* Column 2: Premium Products Sliding Showcase */}
          <div className="lg:col-span-5 w-full flex flex-col items-center justify-center">
            {activeProduct ? (
              <div 
                className="relative w-full max-w-sm flex flex-col"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
              >
                
                {/* Highlight Label overlaying top */}
                <div className="absolute -top-3 left-6 z-20 flex gap-2">
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-rose-600 text-white text-[10px] font-bold uppercase tracking-wider rounded-lg shadow-md shadow-rose-600/25">
                    <Sparkles className="w-3 h-3" />
                    Spotlight Product
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-slate-200 text-slate-700 text-[10px] font-bold uppercase tracking-wider rounded-lg shadow-sm">
                    {activeProduct.condition}
                  </span>
                </div>

                {/* Main Sliding Slide container */}
                <div className="w-full bg-white/80 backdrop-blur-md border border-slate-200/80 rounded-[2.5rem] p-6 shadow-xl shadow-slate-100 relative min-h-[390px] flex flex-col justify-between overflow-hidden">
                  
                  {/* Slider Core Body with transitions */}
                  <AnimatePresence mode="wait" custom={direction}>
                    <motion.div
                      key={currentIndex}
                      custom={direction}
                      variants={{
                        enter: (dir) => ({
                          x: dir > 0 ? 100 : -100,
                          opacity: 0,
                          scale: 0.98
                        }),
                        center: {
                          x: 0,
                          opacity: 1,
                          scale: 1,
                          transition: { x: { type: "spring", stiffness: 350, damping: 30 }, opacity: { duration: 0.25 } }
                        },
                        exit: (dir) => ({
                          x: dir < 0 ? 100 : -100,
                          opacity: 0,
                          scale: 0.98,
                          transition: { opacity: { duration: 0.2 } }
                        })
                      }}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      className="flex-1 flex flex-col justify-between h-full w-full"
                    >
                      {/* Product Image Section */}
                      <div className="w-full h-44 bg-slate-50 rounded-3xl overflow-hidden relative border border-slate-100 flex items-center justify-center p-4">
                        <img 
                          src={activeProduct.coverImage} 
                          alt={activeProduct.title}
                          className="max-h-full max-w-full object-contain hover:scale-105 transition-transform duration-500 ease-out"
                          referrerPolicy="referrer"
                        />
                        
                        {calculateDiscount(activeProduct) && (
                          <div className="absolute bottom-3 left-3 bg-emerald-500 text-white text-[10px] font-bold px-2 py-1 rounded-lg">
                            {calculateDiscount(activeProduct)}
                          </div>
                        )}
                      </div>

                      {/* Info Section */}
                      <div className="mt-5 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                            {activeProduct.model}
                          </span>
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-indigo-50 border border-indigo-100 text-indigo-600">
                            {activeProduct.status}
                          </span>
                        </div>

                        <h3 className="text-lg font-bold text-slate-900 tracking-tight line-clamp-1">
                          {activeProduct.title}
                        </h3>

                        {/* Description snippet */}
                        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                          {activeProduct.description}
                        </p>

                        {/* Top specs if present */}
                        {activeProduct.specifications && activeProduct.specifications.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {activeProduct.specifications.slice(0, 2).map((spec, sIdx) => (
                              <span key={sIdx} className="text-[10px] px-2 py-0.5 bg-slate-100 rounded-md text-slate-600 font-medium max-w-[150px] truncate">
                                {spec.name}: <span className="font-semibold">{spec.value}</span>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Pricing and Action button row */}
                      <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                        <div>
                          <span className="block text-[9px] uppercase font-bold text-slate-400">Price</span>
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-base font-bold text-slate-900">
                              {formatPrice(activeProduct.sellingPrice)}
                            </span>
                            {activeProduct.previousPrice && activeProduct.previousPrice > activeProduct.sellingPrice && (
                              <span className="text-xs text-slate-400 line-through">
                                {formatPrice(activeProduct.previousPrice)}
                              </span>
                            )}
                          </div>
                        </div>

                        <button
                          onClick={() => onProductClick && onProductClick(activeProduct)}
                          className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Details</span>
                        </button>
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* Slider Controls (Chevron Side Buttons & Navigation Dots) */}
                <div className="flex items-center justify-between mt-4 px-2">
                  
                  {/* Left & Right Chevron buttons */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handlePrev}
                      className="p-1.5 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg shadow-sm transition-colors cursor-pointer"
                      title="Previous Slide"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleNext}
                      className="p-1.5 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg shadow-sm transition-colors cursor-pointer"
                      title="Next Slide"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Navigation dots */}
                  <div className="flex items-center gap-1.5">
                    {slidingProducts.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleDotClick(idx)}
                        className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                          idx === currentIndex ? "w-6 bg-indigo-600" : "w-2 bg-slate-300 hover:bg-slate-400"
                        }`}
                        title={`Go to slide ${idx + 1}`}
                      />
                    ))}
                  </div>

                </div>

              </div>
            ) : (
              /* Shimmer Loading Skeleton while loading products data */
              <div className="w-full max-w-sm bg-white border border-slate-200 rounded-[2.5rem] p-6 shadow-xl relative min-h-[380px] flex flex-col justify-between overflow-hidden">
                <div className="w-full h-44 bg-slate-100 rounded-3xl skeleton-shimmer" />
                <div className="mt-5 space-y-3">
                  <div className="h-3 w-16 bg-slate-200 rounded skeleton-shimmer" />
                  <div className="h-5 w-3/4 bg-slate-200 rounded skeleton-shimmer" />
                  <div className="h-3 w-full bg-slate-100 rounded skeleton-shimmer" />
                  <div className="h-3 w-5/6 bg-slate-100 rounded skeleton-shimmer" />
                </div>
                <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="h-2 w-8 bg-slate-200 rounded skeleton-shimmer" />
                    <div className="h-4 w-24 bg-slate-200 rounded skeleton-shimmer" />
                  </div>
                  <div className="h-9 w-28 bg-slate-200 rounded skeleton-shimmer" />
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
