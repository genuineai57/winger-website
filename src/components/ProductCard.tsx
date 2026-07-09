/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Heart, Plus, Minus, MessageCircle, Eye } from "lucide-react";
import { Product, BusinessSettings } from "../types";

interface ProductCardProps {
  key?: string;
  product: Product;
  brandName: string;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
  isComparing: boolean;
  onToggleCompare: (id: string) => void;
  onViewDetails: (product: Product) => void;
  businessSettings: BusinessSettings;
  addToast: (msg: string, type?: "success" | "error" | "warning" | "info") => void;
}

export function ProductCard({
  product,
  brandName,
  isFavorite,
  onToggleFavorite,
  isComparing,
  onToggleCompare,
  onViewDetails,
  businessSettings,
  addToast
}: ProductCardProps) {
  
  // Format price helper
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "TZS",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price).replace("TZS", "TZS ");
  };

  // Get status badge colors
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Available":
        return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20";
      case "Coming Soon":
        return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20";
      case "Sold Out":
        return "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20";
      default:
        return "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20";
    }
  };

  // Handle WhatsApp Sales message formulation
  const handleWhatsAppOrder = (e: React.MouseEvent) => {
    e.stopPropagation();

    const priceText = formatPrice(product.sellingPrice);
    const text = `Habari! Nimetembelea tovuti yenu na ningependa kuagiza bidhaa hii:\n\n*Bidhaa:* ${product.title}\n*Model:* ${product.model}\n*Bei:* ${priceText}\n\nTafadhali nijuze kama ipo tayari na taratibu za kupokea. Ahsante!`;
    const whatsappUrl = `https://wa.me/${businessSettings.whatsappNumber}?text=${encodeURIComponent(text)}`;

    // Track click analytics on server
    fetch("/api/analytics/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId: product.id, type: "whatsapp" })
    }).catch(err => console.error("Analytics track failed:", err));

    addToast(`Opening WhatsApp for ${product.title}...`, "success");
    window.open(whatsappUrl, "_blank", "referrer");
  };

  // Extract core specs for card display (e.g., RAM and Storage)
  const ramSpec = product.specifications.find(s => s.name.toLowerCase() === "ram")?.value;
  const storageSpec = product.specifications.find(s => s.name.toLowerCase() === "storage")?.value;

  return (
    <div 
      className="group bg-black/[0.01] dark:bg-white/[0.03] border border-black/5 dark:border-white/10 rounded-3xl overflow-hidden hover:bg-black/[0.03] dark:hover:bg-white/[0.05] hover:border-black/10 dark:hover:border-white/20 hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-500/5 dark:hover:shadow-indigo-500/10 transition-all duration-300 flex flex-col h-full select-none relative p-5"
      onClick={() => onViewDetails(product)}
    >
      
      {/* Product Image and Badges Header */}
      <div className="relative aspect-square w-full bg-gradient-to-b from-slate-100 to-slate-200 dark:from-slate-850 dark:to-slate-950 rounded-2xl overflow-hidden shrink-0 border border-black/5 dark:border-white/5 shadow-inner">
        
        {/* Hot Deal / Featured Overlay badges */}
        <div className="absolute top-2.5 left-2.5 z-10 flex flex-col gap-1.5 pointer-events-none">
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

        {/* Favorite Icon Trigger */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(product.id);
          }}
          className={`absolute top-2.5 right-2.5 z-10 p-2.5 rounded-full border shadow-sm transition-all hover:scale-115 cursor-pointer ${
            isFavorite
              ? "bg-rose-50 border-rose-200 text-rose-500 dark:bg-rose-950 dark:border-rose-900"
              : "bg-white/80 dark:bg-slate-900/80 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 backdrop-blur-sm"
          }`}
          title={isFavorite ? "Remove from Favorites" : "Add to Favorites"}
        >
          <Heart className={`w-4 h-4 ${isFavorite ? "fill-rose-500" : ""}`} />
        </button>

        {/* Product Image */}
        <img
          src={product.coverImage}
          alt={product.title}
          referrerPolicy="no-referrer"
          loading="lazy"
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
        />

        {/* Quick View Hover overlay */}
        <div className="absolute inset-0 bg-black/20 dark:bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
          <span className="px-4 py-2 bg-white/95 dark:bg-slate-900/95 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-xl shadow-lg flex items-center gap-1.5 backdrop-blur-sm transition-transform scale-90 group-hover:scale-100 duration-300">
            <Eye className="w-4 h-4" />
            Quick View
          </span>
        </div>
      </div>

      {/* Content details */}
      <div className="pt-4 flex-1 flex flex-col px-1">
        
        {/* Brand & Stock Status Badge */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest font-sans">
            {brandName}
          </span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${getStatusBadge(product.status)}`}>
            {product.status === "Available" ? "🟢 Available" : product.status === "Coming Soon" ? "🟡 Coming Soon" : "🔴 Sold Out"}
          </span>
        </div>

        {/* Product Title */}
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 line-clamp-2 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors font-sans leading-snug mb-1.5">
          {product.title}
        </h3>

        {/* Micro-specs labels (e.g. 8GB / 256GB) */}
        {(ramSpec || storageSpec) && (
          <div className="flex flex-wrap gap-1 mb-3">
            {ramSpec && (
              <span className="px-2 py-0.5 bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 text-slate-600 dark:text-slate-400 text-[10px] font-semibold rounded font-mono">
                {ramSpec} RAM
              </span>
            )}
            {storageSpec && (
              <span className="px-2 py-0.5 bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 text-slate-600 dark:text-slate-400 text-[10px] font-semibold rounded font-mono">
                {storageSpec}
              </span>
            )}
          </div>
        )}

        {/* Price and Compare - Bottom of details */}
        <div className="mt-auto pt-3 border-t border-black/5 dark:border-white/5 flex items-center justify-between gap-3">
          <div>
            {product.previousPrice && (
              <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 line-through block -mb-0.5">
                {formatPrice(product.previousPrice)}
              </span>
            )}
            <span className="text-sm font-extrabold text-slate-900 dark:text-slate-50 font-sans tracking-tight">
              {formatPrice(product.sellingPrice)}
            </span>
          </div>

          {/* Compare Selector Checkbox */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleCompare(product.id);
            }}
            className={`p-2 rounded-xl border flex items-center justify-center gap-1 transition-all ${
              isComparing
                ? "bg-indigo-600/10 border-indigo-500/30 text-indigo-600 dark:text-indigo-400"
                : "bg-black/5 dark:bg-white/5 border-black/5 dark:border-white/10 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
            title="Toggle Compare List"
          >
            {isComparing ? (
              <>
                <Minus className="w-4 h-4" />
                <span className="text-[10px] font-bold px-0.5">Compare</span>
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                <span className="text-[10px] font-bold px-0.5">Compare</span>
              </>
            )}
          </button>
        </div>

        {/* WhatsApp Immediate Redirection Order Button */}
        <button
          onClick={handleWhatsAppOrder}
          className="w-full mt-4 py-2.5 bg-emerald-600/10 dark:bg-emerald-500/10 border border-emerald-500/30 hover:border-emerald-500/50 text-emerald-600 dark:text-emerald-400 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer hover:bg-emerald-600/20"
        >
          <MessageCircle className="w-4 h-4 shrink-0" />
          <span>Order via WhatsApp</span>
        </button>
      </div>

    </div>
  );
}
