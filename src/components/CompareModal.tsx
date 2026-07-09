/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion, AnimatePresence } from "motion/react";
import { X, Columns, Trash2, Smartphone, ShoppingCart } from "lucide-react";
import { Product, Brand } from "../types";

interface CompareModalProps {
  isOpen: boolean;
  onClose: () => void;
  comparingProducts: Product[];
  brands: Brand[];
  onRemoveFromCompare: (id: string) => void;
  onOrderWhatsApp: (product: Product) => void;
}

export function CompareModal({
  isOpen,
  onClose,
  comparingProducts,
  brands,
  onRemoveFromCompare,
  onOrderWhatsApp
}: CompareModalProps) {
  
  if (!isOpen) return null;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "TZS",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price).replace("TZS", "TZS ");
  };

  const getBrandName = (brandId: string) => {
    return brands.find(b => b.id === brandId)?.name || "N/A";
  };

  // Helper to extract a spec value by name from a product
  const getSpecValue = (product: Product, specName: string) => {
    const spec = product.specifications.find(
      s => s.name.toLowerCase() === specName.toLowerCase()
    );
    return spec ? spec.value : "N/A";
  };

  const COMPARISON_ROWS = [
    { label: "Price", getValue: (p: Product) => <span className="font-extrabold text-indigo-600 dark:text-indigo-400">{formatPrice(p.sellingPrice)}</span> },
    { label: "Brand", getValue: (p: Product) => getBrandName(p.brandId) },
    { label: "Model", getValue: (p: Product) => p.model || "N/A" },
    { label: "Condition", getValue: (p: Product) => p.condition },
    { label: "Availability", getValue: (p: Product) => p.status },
    { label: "RAM", getValue: (p: Product) => getSpecValue(p, "ram") },
    { label: "Storage", getValue: (p: Product) => getSpecValue(p, "storage") },
    { label: "Processor", getValue: (p: Product) => getSpecValue(p, "processor") },
    { label: "Display", getValue: (p: Product) => getSpecValue(p, "display") },
    { label: "Battery", getValue: (p: Product) => getSpecValue(p, "battery") },
    { label: "Camera", getValue: (p: Product) => getSpecValue(p, "camera") },
    { label: "OS", getValue: (p: Product) => getSpecValue(p, "operating system") }
  ];

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
          className="relative bg-white/95 dark:bg-[#0a0a0a]/95 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-3xl shadow-2xl max-w-5xl w-full max-h-[90vh] flex flex-col overflow-hidden z-10 select-none"
        >
          {/* Header */}
          <div className="flex justify-between items-center px-6 py-4 border-b border-slate-200 dark:border-white/10 shrink-0">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-indigo-500/10 dark:bg-indigo-500/5 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 rounded-xl">
                <Columns className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-md sm:text-lg font-bold text-slate-900 dark:text-slate-100 font-display">
                  Product Comparison Matrix
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Compare specifications and prices side-by-side (Up to 3 items)
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="flex-1 overflow-auto p-6">
            {comparingProducts.length === 0 ? (
              /* Empty state */
              <div className="py-16 text-center max-w-sm mx-auto">
                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Columns className="w-8 h-8" />
                </div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide">
                  No products selected
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                  Tap "Compare" on product cards in the main showcase to add them to this table.
                </p>
                <button
                  onClick={onClose}
                  className="mt-6 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer"
                >
                  Return to Showcase
                </button>
              </div>
            ) : (
              /* Comparison table */
              <div className="min-w-[600px] border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full border-collapse text-left text-xs sm:text-sm">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-white/[0.02] border-b border-slate-200 dark:border-white/10">
                      <th className="p-4 w-1/4 font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider font-display border-r border-slate-200 dark:border-white/10">
                        Feature Specifications
                      </th>
                      {comparingProducts.map((p) => (
                        <th key={p.id} className="p-4 w-1/4 border-r last:border-r-0 border-slate-200 dark:border-white/10 relative align-top">
                          {/* Remove button */}
                          <button
                            onClick={() => onRemoveFromCompare(p.id)}
                            className="absolute top-2 right-2 p-1.5 text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 transition-colors bg-white/80 dark:bg-black/80 rounded-lg border border-slate-100 dark:border-white/10 cursor-pointer shadow-sm"
                            title="Remove from comparison"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>

                          <div className="space-y-3 mt-4 text-center">
                            <img
                              src={p.coverImage}
                              alt={p.title}
                              referrerPolicy="no-referrer"
                              className="w-24 h-24 object-cover rounded-xl border border-slate-100 dark:border-white/10 mx-auto"
                            />
                            <div>
                              <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest block font-sans">
                                {getBrandName(p.brandId)}
                              </span>
                              <h4 className="font-bold text-slate-900 dark:text-slate-50 line-clamp-2 leading-tight mt-1 h-10 h-auto px-1 font-sans">
                                {p.title}
                              </h4>
                            </div>
                            <button
                              onClick={() => onOrderWhatsApp(p)}
                              className="w-full py-2 bg-emerald-600/10 dark:bg-emerald-500/10 border border-emerald-500/30 hover:border-emerald-500/50 text-emerald-600 dark:text-emerald-400 font-bold text-[10px] rounded-lg flex items-center justify-center gap-1.5 cursor-pointer hover:bg-emerald-600/20 transition-all"
                            >
                              <ShoppingCart className="w-3.5 h-3.5" />
                              <span>Order via WA</span>
                            </button>
                          </div>
                        </th>
                      ))}
                      {/* Fill empty comparison columns to retain 3-column format look */}
                      {Array.from({ length: Math.max(0, 3 - comparingProducts.length) }).map((_, idx) => (
                        <th key={`empty-${idx}`} className="p-4 w-1/4 border-r last:border-r-0 border-slate-200 dark:border-white/10 bg-slate-50/20 dark:bg-white/[0.01] text-center align-middle">
                          <div className="py-12 text-slate-300 dark:text-slate-700 font-medium italic text-xs">
                            Add another item
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {COMPARISON_ROWS.map((row, rIdx) => (
                      <tr 
                        key={rIdx} 
                        className="border-b last:border-b-0 border-slate-200 dark:border-white/10 hover:bg-slate-50/30 dark:hover:bg-white/[0.01] transition-colors"
                      >
                        <td className="p-4 font-bold text-slate-600 dark:text-slate-400 bg-slate-50/30 dark:bg-white/[0.02] uppercase tracking-wider text-[11px] font-display border-r border-slate-200 dark:border-white/10">
                          {row.label}
                        </td>
                        {comparingProducts.map((p) => (
                          <td key={p.id} className="p-4 font-medium text-slate-800 dark:text-slate-200 border-r last:border-r-0 border-slate-200 dark:border-white/10 font-mono text-xs">
                            {row.getValue(p)}
                          </td>
                        ))}
                        {Array.from({ length: Math.max(0, 3 - comparingProducts.length) }).map((_, idx) => (
                          <td key={`empty-cell-${idx}`} className="p-4 border-r last:border-r-0 border-slate-200 dark:border-white/10 bg-slate-50/10 dark:bg-white/[0.005]">
                            {/* Empty spacing */}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
