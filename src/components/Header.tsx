/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import { Search, Moon, Sun, Heart, Columns, Smartphone, Laptop, Headphones, PackageOpen, LayoutGrid } from "lucide-react";
import { BusinessSettings, Category } from "../types";

interface HeaderProps {
  businessSettings: BusinessSettings;
  categories: Category[];
  activeCategory: string;
  onSelectCategory: (id: string) => void;
  favoritesCount: number;
  onOpenFavorites: () => void;
  compareCount: number;
  onOpenCompare: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onTriggerAdmin: () => void;
}

export function Header({
  businessSettings,
  categories,
  activeCategory,
  onSelectCategory,
  favoritesCount,
  onOpenFavorites,
  compareCount,
  onOpenCompare,
  searchQuery,
  onSearchChange,
  darkMode,
  onToggleDarkMode,
  onTriggerAdmin
}: HeaderProps) {
  const [logoClicks, setLogoClicks] = useState<number[]>([]);

  // Logo tapping secret trigger (Layer 1)
  const handleLogoClick = () => {
    const now = Date.now();
    // Keep only clicks within the last 4 seconds
    const freshClicks = [...logoClicks, now].filter((clickTime) => now - clickTime < 4000);
    setLogoClicks(freshClicks);

    if (freshClicks.length >= 5) {
      setLogoClicks([]);
      // Micro subtle blink/shake trigger or directly open modal
      onTriggerAdmin();
    }
  };

  const getCategoryIcon = (iconName: string) => {
    switch (iconName.toLowerCase()) {
      case "smartphone":
        return <Smartphone className="w-4 h-4" />;
      case "laptop":
        return <Laptop className="w-4 h-4" />;
      case "headphones":
        return <Headphones className="w-4 h-4" />;
      default:
        return <PackageOpen className="w-4 h-4" />;
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white/60 dark:bg-black/40 backdrop-blur-md border-b border-slate-200 dark:border-white/10 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Logo & Dynamic Brand Name */}
          <div 
            onClick={handleLogoClick}
            className="flex items-center gap-3 cursor-pointer shrink-0 group select-none"
            title={businessSettings.businessName}
          >
            {businessSettings.logoUrl ? (
              <img 
                src={businessSettings.logoUrl} 
                alt="Business Logo" 
                referrerPolicy="no-referrer"
                className="w-10 h-10 rounded-xl object-cover border border-slate-200 dark:border-white/10 group-hover:scale-105 transition-all shadow-md dark:shadow-indigo-500/10"
              />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-blue-500 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-indigo-600/20 group-hover:scale-105 transition-all">
                T
              </div>
            )}
            <div>
              <span className="text-md sm:text-lg font-bold bg-gradient-to-r from-indigo-600 to-violet-500 dark:from-indigo-400 dark:to-violet-400 bg-clip-text text-transparent tracking-tight font-display">
                {businessSettings.businessName || "Tech Catalog"}
              </span>
              <p className="hidden sm:block text-[10px] text-slate-500 dark:text-slate-400 tracking-wide -mt-1 font-sans font-medium uppercase">
                Product Catalog
              </p>
            </div>
          </div>

          {/* Search Bar - Center */}
          <div className="flex-1 max-w-md hidden md:block">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search phones, laptops, RAM, specs..."
                className="w-full pl-10 pr-4 py-2 bg-black/5 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-full text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:border-indigo-500/50 transition-colors placeholder:text-slate-400 dark:placeholder:text-slate-600"
              />
            </div>
          </div>

          {/* Icons & Actions - Right */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Compare Trigger */}
            <button
              onClick={onOpenCompare}
              className="relative p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              title="Compare Specifications"
            >
              <Columns className="w-5 h-5" />
              {compareCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-indigo-600 text-white text-[10px] font-bold h-5 w-5 rounded-full flex items-center justify-center animate-bounce">
                  {compareCount}
                </span>
              )}
            </button>

            {/* Favorites Trigger */}
            <button
              onClick={onOpenFavorites}
              className="relative p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              title="Favorite Products"
            >
              <Heart className="w-5 h-5" />
              {favoritesCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white text-[10px] font-bold h-5 w-5 rounded-full flex items-center justify-center">
                  {favoritesCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Categories Quick Nav and Search on Mobile */}
        <div className="border-t border-slate-100 dark:border-slate-800/50 py-2.5 flex flex-col md:flex-row md:items-center justify-between gap-3 select-none">
          {/* Categories Horizontal scroll */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 md:pb-0 scrollbar-none shrink-0 -mx-4 px-4 sm:mx-0 sm:px-0">
            <button
              onClick={() => onSelectCategory("all")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                activeCategory === "all"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-slate-50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/80"
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>All Products</span>
            </button>

            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => onSelectCategory(cat.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  activeCategory === cat.id
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "bg-slate-50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/80"
                }`}
              >
                {getCategoryIcon(cat.icon)}
                <span>{cat.name}</span>
              </button>
            ))}
          </div>

          {/* Search bar visible only on mobile */}
          <div className="relative md:hidden w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search smartphones, models, specs..."
              className="w-full pl-9 pr-4 py-2 bg-black/5 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-full text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:border-indigo-500/50 transition-colors placeholder:text-slate-400 dark:placeholder:text-slate-600"
            />
          </div>
        </div>
      </div>
    </header>
  );
}
