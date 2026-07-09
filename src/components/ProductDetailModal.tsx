/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Heart, MessageCircle, Copy, Share2, ShieldCheck, HelpCircle } from "lucide-react";
import { Product, BusinessSettings } from "../types";

interface ProductDetailModalProps {
  product: Product | null;
  brandName: string;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
  onClose: () => void;
  businessSettings: BusinessSettings;
  addToast: (msg: string, type: "success" | "error" | "warning" | "info") => void;
}

export function ProductDetailModal({
  product,
  brandName,
  isFavorite,
  onToggleFavorite,
  onClose,
  businessSettings,
  addToast
}: ProductDetailModalProps) {
  
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  if (!product) return null;

  // Compile image list, making sure we have at least the cover image
  const galleryImages = product.images && product.images.length > 0 
    ? product.images 
    : [product.coverImage];

  // Helper to format currency
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "TZS",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price).replace("TZS", "TZS ");
  };

  // WhatsApp Sales message redirector
  const handleWhatsAppOrder = () => {
    const priceText = formatPrice(product.sellingPrice);
    const text = `Habari! Nimetembelea tovuti yenu na ninatamani kuagiza bidhaa hii:\n\n*Bidhaa:* ${product.title}\n*Model:* ${product.model}\n*Bei:* ${priceText}\n\nTafadhali nijuze uwezo wa kuipata na uwasilishaji. Shukrani!`;
    const whatsappUrl = `https://wa.me/${businessSettings.whatsappNumber}?text=${encodeURIComponent(text)}`;

    // Increment WhatsApp analytic click
    fetch("/api/analytics/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId: product.id, type: "whatsapp" })
    }).catch(err => console.error("Analytics track failed:", err));

    addToast(`Redirection to sales chat for ${product.title}...`, "success");
    window.open(whatsappUrl, "_blank", "referrer");
  };

  // Copy Specs Only
  const handleCopySpecsOnly = () => {
    const specsString = product.specifications
      .map(s => `${s.name}: ${s.value}`)
      .join("\n");
    const copyContent = `--- ${product.title} SPECIFICATIONS ---\nBrand: ${brandName}\nModel: ${product.model || "N/A"}\n${specsString}`;

    navigator.clipboard.writeText(copyContent)
      .then(() => {
        addToast("Technical specifications copied to clipboard!", "success");
        // Track analytics
        fetch("/api/analytics/track", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId: product.id, type: "copy_specs" })
        }).catch(() => {});
      })
      .catch(() => {
        addToast("Failed to copy specs.", "error");
      });
  };

  // Share as Winger/Broker (CRITICAL BUSINESS LOGIC: EXCLUDES PRICES AND INTERNAL NOTES)
  const handleShareAsWinger = () => {
    const specsString = product.specifications
      .map(s => `• ${s.name}: ${s.value}`)
      .join("\n");
      
    const copyContent = `🔥 *${product.title}* 🔥\n\n*Condition:* ${product.condition}\n*Availability:* ${product.status === "Available" ? "Available Now" : product.status}\n\n*PRODUCT DESCRIPTION:*\n${product.description}\n\n*SPECIFICATIONS:*\n${specsString}\n\n_Contact me for pricing and delivery details!_`;

    navigator.clipboard.writeText(copyContent)
      .then(() => {
        addToast("Winger Template Copied! (Price excluded successfully)", "success");
        // Track analytics
        fetch("/api/analytics/track", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId: product.id, type: "share_winger" })
        }).catch(() => {});
      })
      .catch(() => {
        addToast("Copying winger specs failed.", "error");
      });
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-md"
          onClick={onClose}
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative bg-white/95 dark:bg-[#0a0a0a]/95 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden z-10 select-none"
        >
          {/* Header */}
          <div className="flex justify-between items-center px-6 py-4 border-b border-slate-200 dark:border-white/10 shrink-0">
            <div>
              <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest font-mono">
                {brandName} • Product Specification Card
              </span>
              <h3 className="text-md sm:text-lg font-bold text-slate-900 dark:text-slate-100 font-display">
                {product.title}
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Body (Scrollable content) */}
          <div className="flex-1 overflow-y-auto p-6 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
              
              {/* Left Column: Image Gallery and Thumbs */}
              <div className="space-y-4">
                {/* Main Viewport */}
                <div className="aspect-square bg-gradient-to-b from-slate-100 to-slate-200 dark:from-slate-850 dark:to-slate-950 border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden relative">
                  <img
                    src={galleryImages[activeImageIndex]}
                    alt={product.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover object-center"
                  />
                  
                  {/* Status Overlay Tags */}
                  <div className="absolute top-3 left-3 flex flex-col gap-1.5 pointer-events-none">
                    {product.isHotDeal && (
                      <span className="px-2.5 py-1 bg-rose-600 text-white font-bold text-[10px] uppercase tracking-wider rounded-lg shadow-sm">
                        🔥 Hot Deal
                      </span>
                    )}
                    {product.isFeatured && (
                      <span className="px-2.5 py-1 bg-indigo-600 text-white font-bold text-[10px] uppercase tracking-wider rounded-lg shadow-sm">
                        ⭐ Featured
                      </span>
                    )}
                    <span className="px-2.5 py-1 bg-slate-900/80 text-white font-bold text-[10px] uppercase tracking-wider rounded-lg backdrop-blur-sm self-start">
                      {product.condition}
                    </span>
                  </div>
                </div>

                {/* Gallery Thumbnails List */}
                {galleryImages.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                    {galleryImages.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActiveImageIndex(idx)}
                        className={`w-16 h-16 rounded-xl border-2 overflow-hidden shrink-0 transition-all cursor-pointer ${
                          activeImageIndex === idx 
                            ? "border-indigo-600 ring-2 ring-indigo-500/10" 
                            : "border-slate-200 dark:border-white/10 hover:border-slate-400"
                        }`}
                      >
                        <img 
                          src={img} 
                          alt={`Thumbnail ${idx + 1}`} 
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover" 
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Right Column: Key Details, pricing, desc, wingers, orders */}
              <div className="space-y-6">
                
                {/* Brand & Stock Badging */}
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 bg-indigo-500/10 dark:bg-indigo-500/5 text-indigo-700 dark:text-indigo-400 text-xs font-bold rounded-xl tracking-wider uppercase font-sans border border-indigo-500/10">
                    {brandName}
                  </span>
                  <span className={`px-3 py-1 text-xs font-bold rounded-xl border ${
                    product.status === "Available"
                      ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                      : product.status === "Coming Soon"
                      ? "bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400"
                      : "bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400"
                  }`}>
                    {product.status === "Available" ? "🟢 Available" : product.status === "Coming Soon" ? "🟡 Coming Soon" : "🔴 Sold Out"}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium font-sans">
                    Stock: {product.stockQuantity} items
                  </span>
                </div>

                {/* Price Display */}
                <div className="p-4 bg-black/5 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-2xl flex items-center justify-between gap-4">
                  <div>
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block">
                      Selling Price
                    </span>
                    <span className="text-2xl font-black text-slate-900 dark:text-slate-50 font-sans tracking-tight">
                      {formatPrice(product.sellingPrice)}
                    </span>
                  </div>
                  {product.previousPrice && (
                    <div className="text-right">
                      <span className="text-xs text-slate-400 dark:text-slate-500 font-medium block">
                        Original Price
                      </span>
                      <span className="text-sm font-semibold text-slate-400 dark:text-slate-500 line-through">
                        {formatPrice(product.previousPrice)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Description */}
                <div>
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                    Product Description
                  </h4>
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    {product.description || "No full description added for this product."}
                  </p>
                </div>

                {/* Broker Share Action - Core feature */}
                <div className="p-4 bg-indigo-500/5 dark:bg-indigo-500/5 border border-indigo-500/20 dark:border-indigo-500/20 rounded-2xl space-y-3">
                  <div className="flex items-start gap-2.5">
                    <Share2 className="w-4.5 h-4.5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-indigo-950 dark:text-indigo-300 uppercase tracking-wide">
                        Winger / Broker Toolkit
                      </h4>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 leading-normal">
                        Copies clean specifications and descriptions directly to your clipboard *without* the selling price so you can insert your own markup.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleShareAsWinger}
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-md shadow-indigo-500/10 cursor-pointer select-none"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>Copy Winger Share Template</span>
                  </button>
                </div>

                {/* Customer Actions */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    onClick={handleWhatsAppOrder}
                    className="py-3 bg-emerald-600/10 dark:bg-emerald-500/10 border border-emerald-500/30 hover:border-emerald-500/50 text-emerald-600 dark:text-emerald-400 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer hover:bg-emerald-600/20"
                  >
                    <MessageCircle className="w-4.5 h-4.5" />
                    <span>Order via WhatsApp</span>
                  </button>

                  <button
                    onClick={() => onToggleFavorite(product.id)}
                    className={`py-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all ${
                      isFavorite 
                        ? "bg-rose-50 border-rose-200 text-rose-500 dark:bg-rose-950/40 dark:border-rose-900" 
                        : "bg-black/5 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:text-slate-850 dark:hover:text-slate-150 hover:bg-black/10 dark:hover:bg-white/10"
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${isFavorite ? "fill-rose-500" : ""}`} />
                    <span>{isFavorite ? "Favorited" : "Save Favorite"}</span>
                  </button>
                </div>

              </div>
            </div>

            {/* Technical Specifications Section */}
            <div className="pt-6 border-t border-slate-200 dark:border-white/10">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-4.5 h-4.5 text-indigo-600 dark:text-indigo-400" />
                  Technical Specifications
                </h4>
                <button
                  onClick={handleCopySpecsOnly}
                  className="flex items-center gap-1 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Specs Only</span>
                </button>
              </div>

              {product.specifications && product.specifications.length > 0 ? (
                <div className="border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-sm">
                  <table className="w-full text-sm text-left">
                    <tbody>
                      {product.specifications.map((spec, sIdx) => (
                        <tr 
                          key={sIdx} 
                          className="border-b last:border-b-0 border-slate-200 dark:border-white/10 hover:bg-slate-50/50 dark:hover:bg-white/[0.01] transition-colors"
                        >
                          <td className="px-5 py-3 w-1/3 bg-slate-50 dark:bg-white/[0.02] border-r border-slate-200 dark:border-white/10 font-semibold text-slate-600 dark:text-slate-400 text-xs uppercase tracking-wider font-display">
                            {spec.name}
                          </td>
                          <td className="px-5 py-3 text-slate-800 dark:text-slate-200 font-medium font-mono text-xs">
                            {spec.value}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-6 border border-dashed border-slate-200 dark:border-white/10 rounded-2xl text-center">
                  <HelpCircle className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    No structured technical specifications have been registered for this item.
                  </p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
