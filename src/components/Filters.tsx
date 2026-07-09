/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { RotateCcw, SlidersHorizontal, Check } from "lucide-react";
import { Category, Brand, ProductCondition, ProductStatus } from "../types";

export interface FilterState {
  categoryId: string;
  brandId: string;
  condition: ProductCondition | "";
  status: ProductStatus | "";
  minPrice: string;
  maxPrice: string;
  ram: string;
  storage: string;
}

interface FiltersProps {
  categories: Category[];
  brands: Brand[];
  filters: FilterState;
  onChangeFilters: (newFilters: FilterState) => void;
  onResetFilters: () => void;
}

const CONDITIONS: ProductCondition[] = ["Brand New", "Used", "Refurbished", "Open Box"];
const STATUSES: ProductStatus[] = ["Available", "Coming Soon", "Sold Out"];
const RAM_OPTIONS = ["4GB", "8GB", "12GB", "16GB", "24GB", "32GB", "36GB", "64GB"];
const STORAGE_OPTIONS = ["128GB", "256GB", "512GB", "1TB", "2TB"];

export function Filters({
  categories,
  brands,
  filters,
  onChangeFilters,
  onResetFilters
}: FiltersProps) {
  
  const handleSelectField = (key: keyof FilterState, value: string) => {
    onChangeFilters({
      ...filters,
      [key]: value
    });
  };

  return (
    <div className="bg-black/[0.01] dark:bg-white/[0.03] border border-black/5 dark:border-white/10 rounded-3xl p-5 select-none shrink-0 transition-all shadow-md dark:shadow-indigo-500/5">
      
      {/* Filters Title Header */}
      <div className="flex items-center justify-between mb-5 border-b border-black/5 dark:border-white/5 pb-3">
        <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200">
          <SlidersHorizontal className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <span className="font-bold text-sm uppercase tracking-wider font-display">Filters</span>
        </div>
        <button
          onClick={onResetFilters}
          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer font-medium"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset</span>
        </button>
      </div>

      <div className="space-y-6">
        
        {/* Category filter */}
        <div>
          <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2.5">Category</h4>
          <select
            value={filters.categoryId}
            onChange={(e) => handleSelectField("categoryId", e.target.value)}
            className="w-full px-3.5 py-2.5 bg-black/5 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-slate-800 dark:text-slate-200 text-sm focus:outline-none focus:border-indigo-500/50 transition-colors cursor-pointer"
          >
            <option value="all">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id} className="bg-white dark:bg-slate-950">{cat.name}</option>
            ))}
          </select>
        </div>

        {/* Brand filter */}
        <div>
          <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2.5">Brand</h4>
          <select
            value={filters.brandId}
            onChange={(e) => handleSelectField("brandId", e.target.value)}
            className="w-full px-3.5 py-2.5 bg-black/5 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-slate-800 dark:text-slate-200 text-sm focus:outline-none focus:border-indigo-500/50 transition-colors cursor-pointer"
          >
            <option value="all">All Brands</option>
            {brands.map((brand) => (
              <option key={brand.id} value={brand.id} className="bg-white dark:bg-slate-950">{brand.name}</option>
            ))}
          </select>
        </div>

        {/* Price limits */}
        <div>
          <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2.5">Price Range (TZS)</h4>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <input
                type="number"
                value={filters.minPrice}
                onChange={(e) => handleSelectField("minPrice", e.target.value)}
                placeholder="Min TZS"
                className="w-full px-3 py-2 bg-black/5 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-slate-800 dark:text-slate-200 text-xs focus:outline-none focus:border-indigo-500/50 transition-colors"
              />
            </div>
            <div>
              <input
                type="number"
                value={filters.maxPrice}
                onChange={(e) => handleSelectField("maxPrice", e.target.value)}
                placeholder="Max TZS"
                className="w-full px-3 py-2 bg-black/5 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-slate-800 dark:text-slate-200 text-xs focus:outline-none focus:border-indigo-500/50 transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Condition Filter */}
        <div>
          <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2.5">Condition</h4>
          <div className="flex flex-wrap gap-1.5">
            {CONDITIONS.map((cond) => {
              const selected = filters.condition === cond;
              return (
                <button
                  key={cond}
                  onClick={() => handleSelectField("condition", selected ? "" : cond)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1 ${
                    selected
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20"
                      : "bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:bg-black/10 dark:hover:bg-white/10 hover:text-slate-850 dark:hover:text-slate-150"
                  }`}
                >
                  {selected && <Check className="w-3.5 h-3.5" />}
                  <span>{cond}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Stock status filter */}
        <div>
          <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2.5">Status</h4>
          <div className="flex flex-wrap gap-1.5">
            {STATUSES.map((st) => {
              const selected = filters.status === st;
              return (
                <button
                  key={st}
                  onClick={() => handleSelectField("status", selected ? "" : st)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1 ${
                    selected
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20"
                      : "bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:bg-black/10 dark:hover:bg-white/10 hover:text-slate-850 dark:hover:text-slate-150"
                  }`}
                >
                  {selected && <Check className="w-3.5 h-3.5" />}
                  <span>{st}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* RAM Size Filter */}
        <div>
          <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2.5">RAM Memory</h4>
          <div className="grid grid-cols-4 gap-1.5">
            {RAM_OPTIONS.map((ramOpt) => {
              const selected = filters.ram === ramOpt;
              return (
                <button
                  key={ramOpt}
                  onClick={() => handleSelectField("ram", selected ? "" : ramOpt)}
                  className={`py-1.5 rounded-lg text-[10px] font-bold text-center transition-all cursor-pointer ${
                    selected
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20"
                      : "bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:bg-black/10 dark:hover:bg-white/10 hover:text-slate-850 dark:hover:text-slate-150"
                  }`}
                >
                  {ramOpt}
                </button>
              );
            })}
          </div>
        </div>

        {/* Storage Filter */}
        <div>
          <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2.5">Storage</h4>
          <div className="grid grid-cols-3 gap-1.5">
            {STORAGE_OPTIONS.map((stOpt) => {
              const selected = filters.storage === stOpt;
              return (
                <button
                  key={stOpt}
                  onClick={() => handleSelectField("storage", selected ? "" : stOpt)}
                  className={`py-1.5 rounded-lg text-[10px] font-bold text-center transition-all cursor-pointer ${
                    selected
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20"
                      : "bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:bg-black/10 dark:hover:bg-white/10 hover:text-slate-850 dark:hover:text-slate-150"
                  }`}
                >
                  {stOpt}
                </button>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
