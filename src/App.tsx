/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Heart, Columns, MessageCircle, Info, MapPin, Mail, Phone, 
  Facebook, Instagram, Loader2, Sparkles, LayoutGrid, X, 
  HelpCircle, AlertTriangle, ShieldCheck, Wrench
} from "lucide-react";

import { Header } from "./components/Header";
import { Hero } from "./components/Hero";
import { Filters, FilterState } from "./components/Filters";
import { ProductCard } from "./components/ProductCard";
import { ProductDetailModal } from "./components/ProductDetailModal";
import { CompareModal } from "./components/CompareModal";
import { AccessKeyModal } from "./components/AccessKeyModal";
import { AdminPanel } from "./components/AdminPanel";
import { ToastContainer, ToastMessage } from "./components/Toast";
import { Product, Category, Brand, BusinessSettings, HomepageSettings } from "./types";
import { 
  DEFAULT_BUSINESS_SETTINGS, 
  DEFAULT_HOMEPAGE_SETTINGS, 
  DEFAULT_CATEGORIES, 
  DEFAULT_BRANDS, 
  DEFAULT_PRODUCTS 
} from "./fallbackData";

export default function App() {
  // Global Data
  const [businessSettings, setBusinessSettings] = useState<BusinessSettings>(DEFAULT_BUSINESS_SETTINGS);
  const [homepageSettings, setHomepageSettings] = useState<HomepageSettings>(DEFAULT_HOMEPAGE_SETTINGS);
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [brands, setBrands] = useState<Brand[]>(DEFAULT_BRANDS);
  const [products, setProducts] = useState<Product[]>(DEFAULT_PRODUCTS);
  
  // Loading & Modes
  const [isLoading, setIsLoading] = useState(true);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  // Filter state
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<FilterState>({
    categoryId: "all",
    brandId: "all",
    condition: "",
    status: "",
    minPrice: "",
    maxPrice: "",
    ram: "",
    storage: ""
  });

  // Client Session lists
  const [favorites, setFavorites] = useState<string[]>([]);
  const [compareList, setCompareList] = useState<string[]>([]);
  
  // Modals state
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [isFavoritesOpen, setIsFavoritesOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Admin state
  const [adminToken, setAdminToken] = useState<string | null>(null);
  const [adminUser, setAdminUser] = useState<{ username: string; displayName: string; role: string } | null>(null);

  // Toast dispatch
  const addToast = (message: string, type: ToastMessage["type"] = "info") => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Sync Global Settings
  const fetchData = async () => {
    try {
      // Settings
      const settingsRes = await fetch("/api/settings");
      if (settingsRes.ok) {
        const settingsData = await settingsRes.json();
        if (settingsData.business) setBusinessSettings(settingsData.business);
        if (settingsData.homepage) setHomepageSettings(settingsData.homepage);
        setMaintenanceMode(!!settingsData.security?.maintenanceMode);
      }

      // Categories
      const catRes = await fetch("/api/categories");
      if (catRes.ok) {
        const catData = await catRes.json();
        if (Array.isArray(catData)) setCategories(catData);
      }

      // Brands
      const brandRes = await fetch("/api/brands");
      if (brandRes.ok) {
        const brandData = await brandRes.json();
        if (Array.isArray(brandData)) setBrands(brandData);
      }

      // Products
      const prodRes = await fetch("/api/products");
      if (prodRes.ok) {
        const prodData = await prodRes.json();
        if (Array.isArray(prodData)) setProducts(prodData);
      }
    } catch (e) {
      console.error("Data fetch failed", e);
      addToast("Failed to establish server connection. Loading cached mock files...", "warning");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Check saved favorites
    const savedFavs = localStorage.getItem("tz_tech_favs");
    if (savedFavs) {
      try {
        setFavorites(JSON.parse(savedFavs));
      } catch (e) {}
    }

    // Check active session token
    const savedToken = sessionStorage.getItem("tz_admin_token");
    const savedUser = sessionStorage.getItem("tz_admin_user");
    if (savedToken && savedUser) {
      try {
        setAdminToken(savedToken);
        setAdminUser(JSON.parse(savedUser));
      } catch (e) {}
    }

    setDarkMode(false);
    localStorage.setItem("tz_tech_dark", "false");
  }, []);

  // Enforce dark mode on admin dashboard, light/white theme everywhere else
  useEffect(() => {
    if (adminToken) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [adminToken]);

  // Handle Dark mode change (Locked to Light Theme)
  const handleToggleDarkMode = () => {
    // Dark mode is disabled and locked to white theme
  };

  // Toggle favorites
  const handleToggleFavorite = (id: string) => {
    let next: string[];
    if (favorites.includes(id)) {
      next = favorites.filter((x) => x !== id);
      addToast("Removed from saved favorites.", "info");
    } else {
      next = [...favorites, id];
      addToast("Added to saved favorites!", "success");
    }
    setFavorites(next);
    localStorage.setItem("tz_tech_favs", JSON.stringify(next));
  };

  // Toggle comparing items
  const handleToggleCompare = (id: string) => {
    if (compareList.includes(id)) {
      setCompareList(compareList.filter((x) => x !== id));
      addToast("Removed from comparison list.", "info");
    } else {
      if (compareList.length >= 3) {
        addToast("You can only compare up to 3 products side-by-side.", "warning");
        return;
      }
      setCompareList([...compareList, id]);
      addToast("Added to comparison matrix.", "success");
    }
  };

  // Handle successful login
  const handleLoginSuccess = (token: string, user: { username: string; displayName: string; role: string }) => {
    setAdminToken(token);
    setAdminUser(user);
    sessionStorage.setItem("tz_admin_token", token);
    sessionStorage.setItem("tz_admin_user", JSON.stringify(user));
  };

  // Logout admin
  const handleLogout = () => {
    setAdminToken(null);
    setAdminUser(null);
    sessionStorage.removeItem("tz_admin_token");
    sessionStorage.removeItem("tz_admin_user");
    addToast("Logged out of administrative portal.", "success");
  };

  const handleWhatsAppOrder = (product: Product) => {
    const formattedPrice = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "TZS",
      minimumFractionDigits: 0
    }).format(product.sellingPrice).replace("TZS", "TZS ");

    const text = `Habari! Nimetembelea tovuti yenu na ningependa kuagiza bidhaa hii:\n\n*Bidhaa:* ${product.title}\n*Model:* ${product.model}\n*Bei:* ${formattedPrice}\n\nTafadhali nijuze upatikanaji wake na namna ya kuipata. Ahsante!`;
    const whatsappUrl = `https://wa.me/${businessSettings?.whatsappNumber || "255" }?text=${encodeURIComponent(text)}`;

    fetch("/api/analytics/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId: product.id, type: "whatsapp" })
    }).catch(() => {});

    window.open(whatsappUrl, "_blank", "referrer");
  };

  // Reset filters
  const handleResetFilters = () => {
    setFilters({
      categoryId: "all",
      brandId: "all",
      condition: "",
      status: "",
      minPrice: "",
      maxPrice: "",
      ram: "",
      storage: ""
    });
    setActiveCategory("all");
    setSearchQuery("");
  };

  // Multi-Filter Core computation engine
  const filteredProducts = products.filter((p) => {
    // 1. Quick Category Nav OR drop filter
    const catFilter = filters.categoryId !== "all" ? filters.categoryId : activeCategory;
    if (catFilter !== "all" && p.categoryId !== catFilter) return false;

    // 2. Brand filter
    if (filters.brandId !== "all" && p.brandId !== filters.brandId) return false;

    // 3. Condition filter
    if (filters.condition && p.condition !== filters.condition) return false;

    // 4. Status filter
    if (filters.status && p.status !== filters.status) return false;

    // 5. Min price limits
    if (filters.minPrice && p.sellingPrice < Number(filters.minPrice)) return false;

    // 6. Max price limits
    if (filters.maxPrice && p.sellingPrice > Number(filters.maxPrice)) return false;

    // 7. RAM specifications parsing
    if (filters.ram) {
      const ramSpec = p.specifications.find((s) => s.name.toLowerCase() === "ram")?.value || "";
      if (!ramSpec.toLowerCase().includes(filters.ram.toLowerCase())) return false;
    }

    // 8. Storage specifications parsing
    if (filters.storage) {
      const storageSpec = p.specifications.find((s) => s.name.toLowerCase() === "storage")?.value || "";
      if (!storageSpec.toLowerCase().includes(filters.storage.toLowerCase())) return false;
    }

    // 9. Full Text / Keyword Search matching Title, Model, Brand Name, or spec details
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const titleMatch = p.title.toLowerCase().includes(query);
      const modelMatch = (p.model || "").toLowerCase().includes(query);
      const brandName = brands.find((b) => b.id === p.brandId)?.name || "";
      const brandMatch = brandName.toLowerCase().includes(query);
      const descMatch = (p.description || "").toLowerCase().includes(query);
      const specMatch = p.specifications.some((s) => s.value.toLowerCase().includes(query));

      if (!titleMatch && !modelMatch && !brandMatch && !descMatch && !specMatch) return false;
    }

    return true;
  });

  // Hot Deals lists and Featured lists
  const hotDealsProducts = products.filter((p) => p.isHotDeal && p.status !== "Sold Out");
  const featuredProducts = products.filter((p) => p.isFeatured && p.status !== "Sold Out");

  const handleCategorySelect = (id: string) => {
    setActiveCategory(id);
    setFilters((prev) => ({ ...prev, categoryId: id }));
  };

  const getBrandName = (brandId: string) => {
    return brands.find((b) => b.id === brandId)?.name || "N/A";
  };

  // Scroll to products grid helper
  const handleScrollToProducts = () => {
    const el = document.getElementById("products-showcase-section");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto" />
          <p className="text-slate-500 font-mono text-xs font-semibold">Establishing secure database tunnel...</p>
        </div>
      </div>
    );
  }

  // Admin view takes complete rendering control
  if (adminToken && adminUser) {
    return (
      <AdminPanel
        token={adminToken}
        onLogout={handleLogout}
        businessSettings={businessSettings!}
        categories={categories}
        brands={brands}
        onRefreshData={fetchData}
        addToast={addToast}
      />
    );
  }

  // System maintenance page (Allows logo tapping for secret login)
  if (maintenanceMode) {
    return (
      <div className="min-h-screen bg-[#fafafa] text-slate-800 flex items-center justify-center p-6 select-none relative">
        <div className="max-w-md text-center space-y-8">
          
          {/* Tapping logo container */}
          <div 
            onClick={() => {
              const now = Date.now();
              const freshClicks = [...favorites, now.toString()].filter(t => now - Number(t) < 4000);
              setFavorites(freshClicks);
              if (freshClicks.length >= 5) {
                setFavorites([]);
                setIsAuthModalOpen(true);
              }
            }}
            className="cursor-pointer inline-block scale-105 active:scale-95 transition-transform"
          >
            {businessSettings?.logoUrl ? (
              <img src={businessSettings.logoUrl} alt="Logo" referrerPolicy="no-referrer" className="w-16 h-16 rounded-2xl object-cover mx-auto border border-slate-200 shadow-sm" />
            ) : (
              <div className="w-16 h-16 bg-indigo-600 rounded-2xl mx-auto flex items-center justify-center text-xl font-bold text-white">
                T
              </div>
            )}
          </div>

          <div className="space-y-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 text-xs font-semibold uppercase">
              <Wrench className="w-3.5 h-3.5 animate-bounce" />
              Under Maintenance
            </span>
            <h2 className="text-3xl font-extrabold font-display text-slate-900">
              System Upgrading
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed font-sans">
              We are currently optimizing the {businessSettings?.businessName || "Tech Catalog"} database. We will be back online shortly. For immediate smartphone, laptop or hardware inquiries, reach out on WhatsApp directly.
            </p>
          </div>

          {/* Quick Contacts inside maintenance screen */}
          <div className="p-5 bg-white border border-slate-200 rounded-2xl space-y-4 shadow-sm">
            <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-600">Immediate Direct Support</h4>
            <div className="space-y-3 text-xs text-slate-600">
              {businessSettings?.whatsappNumber && (
                <a 
                  href={`https://wa.me/${businessSettings.whatsappNumber}`} 
                  target="_blank" 
                  referrerPolicy="no-referrer"
                  className="flex items-center justify-center gap-2 text-emerald-600 hover:underline font-semibold"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>WhatsApp: +{businessSettings.whatsappNumber}</span>
                </a>
              )}
              {businessSettings?.email && (
                <div className="flex items-center justify-center gap-2 font-medium">
                  <Mail className="w-4 h-4 text-slate-400" />
                  <span>{businessSettings.email}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <AccessKeyModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          onLoginSuccess={handleLoginSuccess}
          addToast={addToast}
        />
        <ToastContainer toasts={toasts} onRemove={removeToast} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#050505] text-slate-800 dark:text-slate-200 transition-colors duration-200 flex flex-col font-sans relative overflow-hidden">
      
      {/* Immersive UI Ambient Glows */}
      <div className="fixed top-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-500/10 dark:bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="fixed bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 dark:bg-blue-600/5 rounded-full blur-[120px] pointer-events-none z-0" />

      {/* Dynamic Favicon Hydration */}
      {businessSettings?.faviconUrl && (
        <link rel="icon" href={businessSettings.faviconUrl} />
      )}

      {/* Header public navigation bar */}
      <Header
        businessSettings={businessSettings}
        categories={categories}
        activeCategory={activeCategory}
        onSelectCategory={handleCategorySelect}
        favoritesCount={favorites.length}
        onOpenFavorites={() => setIsFavoritesOpen(true)}
        compareCount={compareList.length}
        onOpenCompare={() => setIsCompareOpen(true)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        darkMode={darkMode}
        onToggleDarkMode={handleToggleDarkMode}
        onTriggerAdmin={() => setIsAuthModalOpen(true)}
      />

      {/* Hero Visual Spotlight Banner */}
      <Hero
        homepageSettings={homepageSettings}
        businessSettings={businessSettings}
        onBrowseClick={handleScrollToProducts}
        products={products}
        onProductClick={setSelectedProduct}
      />

      {/* Showcase Stage */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full select-none">
        
        {/* TOP LEVEL SPOTLIGHTS SECTION (HOT DEALS & FEATURED) - visible only if search is empty */}
        {!searchQuery && activeCategory === "all" && (
          <div className="space-y-12 mb-16">
            
            {/* 1. Hot Deals Module - Sine wave pulsing header tag */}
            {hotDealsProducts.length > 0 && (
              <section className="space-y-6">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="pulse-animation relative flex h-3 w-3 bg-rose-600 rounded-full shrink-0" />
                    <h3 className="text-lg font-bold font-display uppercase tracking-wider text-rose-600">
                      🔥 Limited Hot Deals
                    </h3>
                  </div>
                  <span className="text-xs font-semibold text-slate-400 font-mono">
                    Flash pricing
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {hotDealsProducts.slice(0, homepageSettings?.hotDealsLimit || 4).map((p) => (
                    <ProductCard
                      key={p.id}
                      product={p}
                      brandName={getBrandName(p.brandId)}
                      isFavorite={favorites.includes(p.id)}
                      onToggleFavorite={handleToggleFavorite}
                      isComparing={compareList.includes(p.id)}
                      onToggleCompare={handleToggleCompare}
                      onViewDetails={setSelectedProduct}
                      businessSettings={businessSettings}
                      addToast={addToast}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* 2. Featured Showcase banner */}
            {featuredProducts.length > 0 && (
              <section className="space-y-6">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold font-display uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                      ⭐ Recommended Products
                    </h3>
                  </div>
                  <span className="text-xs font-semibold text-slate-400 font-mono">
                    Curated specifications
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {featuredProducts.slice(0, homepageSettings?.featuredLimit || 4).map((p) => (
                    <ProductCard
                      key={p.id}
                      product={p}
                      brandName={getBrandName(p.brandId)}
                      isFavorite={favorites.includes(p.id)}
                      onToggleFavorite={handleToggleFavorite}
                      isComparing={compareList.includes(p.id)}
                      onToggleCompare={handleToggleCompare}
                      onViewDetails={setSelectedProduct}
                      businessSettings={businessSettings!}
                      addToast={addToast}
                    />
                  ))}
                </div>
              </section>
            )}

          </div>
        )}

        {/* PRIMARY CATALOG SEARCH & FILTER MODULE */}
        <div id="products-showcase-section" className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
          
          {/* Left Column: Filters Sidebar */}
          <div className="lg:col-span-1 sticky top-20 z-10 hidden lg:block">
            <Filters
              categories={categories}
              brands={brands}
              filters={filters}
              onChangeFilters={setFilters}
              onResetFilters={handleResetFilters}
            />
          </div>

          {/* Right Column: Dynamic Products Grid list */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* Header / Active tags and items count */}
            <div className="flex items-center justify-between flex-wrap gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
              <div>
                <h3 className="text-md font-bold font-display uppercase tracking-wider text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <LayoutGrid className="w-5 h-5 text-indigo-600" />
                  Product Catalog Showcase
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Showing {filteredProducts.length} premium hardware options
                </p>
              </div>

              {/* Action Reset Button if queries are active */}
              {(searchQuery || activeCategory !== "all" || Object.values(filters).some(v => v && v !== "all")) && (
                <button
                  onClick={handleResetFilters}
                  className="px-3.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-600 dark:text-slate-300 text-xs font-bold rounded-xl cursor-pointer"
                >
                  Clear Active Filters
                </button>
              )}
            </div>

            {/* Products grid cards or empty fallback page */}
            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {filteredProducts.map((p) => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    brandName={getBrandName(p.brandId)}
                    isFavorite={favorites.includes(p.id)}
                    onToggleFavorite={handleToggleFavorite}
                    isComparing={compareList.includes(p.id)}
                    onToggleCompare={handleToggleCompare}
                    onViewDetails={setSelectedProduct}
                    businessSettings={businessSettings}
                    addToast={addToast}
                  />
                ))}
              </div>
            ) : (
              /* Empty matches fallback */
              <div className="py-20 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md mx-auto">
                <div className="w-16 h-16 bg-slate-50 dark:bg-slate-950 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4">
                  <HelpCircle className="w-8 h-8" />
                </div>
                <h4 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                  No matching catalog records
                </h4>
                <p className="text-xs text-slate-500 mt-2 max-w-xs mx-auto px-4">
                  Adjust your categories, specs, price parameters, or keywords and search again.
                </p>
                <button
                  onClick={handleResetFilters}
                  className="mt-6 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer"
                >
                  Reset Active Showcase Filters
                </button>
              </div>
            )}

          </div>

        </div>

      </main>

      {/* FOOTER */}
      <footer className="bg-white text-slate-600 border-t border-slate-200 mt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            
            {/* Branding widget */}
            <div className="space-y-4">
              <span className="text-md sm:text-lg font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent tracking-tight font-display">
                {businessSettings?.businessName || "Tech Catalog"}
              </span>
              <p className="text-xs text-slate-500 leading-relaxed max-w-xs font-normal">
                {businessSettings?.tagline || "Authorized showcase & broker system of premium smartphones, notebooks, hardware, and digital assets."}
              </p>
              {/* Social links */}
              <div className="flex gap-3 pt-2">
                {businessSettings?.facebookUrl && (
                  <a href={businessSettings.facebookUrl} target="_blank" referrerPolicy="no-referrer" className="text-slate-400 hover:text-indigo-600 transition-colors">
                    <Facebook className="w-5 h-5" />
                  </a>
                )}
                {businessSettings?.instagramUrl && (
                  <a href={businessSettings.instagramUrl} target="_blank" referrerPolicy="no-referrer" className="text-slate-400 hover:text-indigo-600 transition-colors">
                    <Instagram className="w-5 h-5" />
                  </a>
                )}
              </div>
            </div>

            {/* Support Widget */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase text-slate-800 tracking-widest font-display">Direct Support Contacts</h4>
              <div className="space-y-3 text-xs text-slate-600">
                {businessSettings?.whatsappNumber && (
                  <a 
                    href={`https://wa.me/${businessSettings.whatsappNumber}`} 
                    target="_blank" 
                    referrerPolicy="no-referrer"
                    className="flex items-center gap-2.5 hover:text-emerald-700 transition-colors text-emerald-600 font-semibold"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>WhatsApp Inquiry: +{businessSettings.whatsappNumber}</span>
                  </a>
                )}
                {businessSettings?.email && (
                  <div className="flex items-center gap-2.5">
                    <Mail className="w-4 h-4 text-slate-400" />
                    <span>{businessSettings.email}</span>
                  </div>
                )}
                {businessSettings?.physicalAddress && (
                  <div className="flex items-center gap-2.5">
                    <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>{businessSettings.physicalAddress}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Platforms / Disclaimers */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase text-slate-800 tracking-widest font-display">Broker & Client Disclaimers</h4>
              <p className="text-[11px] text-slate-500 leading-relaxed font-normal">
                We act as a direct importer, premium showcase, and authorized sales catalog. Wingers/Brokers are welcome to markup and copy clean specifications. Prices and stock indicators are verified regularly in Tanzanian Shillings (TZS). Delivery is coordinated securely on WhatsApp.
              </p>
            </div>

          </div>

          {/* Copy block */}
          <div className="border-t border-slate-200 pt-8 flex items-center justify-between text-xs text-slate-500 font-mono">
            <span>{businessSettings?.footerText || `© ${new Date().getFullYear()} ${businessSettings?.businessName || "Tech Catalog"}. All Rights Reserved.`}</span>
            <span>Tanzania Digital Showcase</span>
          </div>
        </div>
      </footer>

      {/* ========================================== */}
      {/* POPUP: FAVORITES INLINE OVERLAY            */}
      {/* ========================================== */}
      <AnimatePresence>
        {isFavoritesOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm"
              onClick={() => setIsFavoritesOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-md w-full max-h-[80vh] flex flex-col overflow-hidden z-10"
            >
              <div className="flex justify-between items-center px-5 py-3 border-b border-slate-200 dark:border-slate-800 shrink-0">
                <div className="flex items-center gap-2 text-rose-500">
                  <Heart className="w-5 h-5 fill-rose-500" />
                  <span className="font-bold text-sm uppercase tracking-wider font-display text-slate-800 dark:text-slate-100">Favorites list</span>
                </div>
                <button
                  onClick={() => setIsFavoritesOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {favorites.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 font-light text-xs space-y-2">
                    <Heart className="w-10 h-10 mx-auto text-slate-300" />
                    <p>Your saved favorites list is currently empty.</p>
                  </div>
                ) : (
                  products
                    .filter((p) => favorites.includes(p.id))
                    .map((favProd) => {
                      const brandName = getBrandName(favProd.brandId);
                      return (
                        <div key={favProd.id} className="flex gap-3 p-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl items-center">
                          <img src={favProd.coverImage} className="w-12 h-12 rounded-lg object-cover border" />
                          <div className="flex-1 min-w-0">
                            <span className="text-[9px] font-bold text-indigo-600 block uppercase tracking-wider">{brandName}</span>
                            <span className="font-bold text-slate-900 dark:text-slate-100 block text-xs truncate leading-tight">{favProd.title}</span>
                            <span className="font-bold font-mono text-[11px] text-slate-800 dark:text-slate-200">
                              {new Intl.NumberFormat("en-US", { style: "currency", currency: "TZS", minimumFractionDigits: 0 }).format(favProd.sellingPrice).replace("TZS", "TZS ")}
                            </span>
                          </div>
                          <div className="flex flex-col gap-1 shrink-0">
                            <button
                              onClick={() => {
                                setIsFavoritesOpen(false);
                                setSelectedProduct(favProd);
                              }}
                              className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[9px] rounded-lg"
                            >
                              Details
                            </button>
                            <button
                              onClick={() => handleToggleFavorite(favProd.id)}
                              className="px-2.5 py-1 text-slate-400 hover:text-rose-500 text-[9px] font-bold"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      );
                    })
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================== */}
      {/* POPUPS: DETAIL OVERLAYS AND COMPARE MATRIX  */}
      {/* ========================================== */}
      <ProductDetailModal
        product={selectedProduct}
        brandName={selectedProduct ? getBrandName(selectedProduct.brandId) : ""}
        isFavorite={selectedProduct ? favorites.includes(selectedProduct.id) : false}
        onToggleFavorite={handleToggleFavorite}
        onClose={() => setSelectedProduct(null)}
        businessSettings={businessSettings}
        addToast={addToast}
      />

      <CompareModal
        isOpen={isCompareOpen}
        onClose={() => setIsCompareOpen(false)}
        comparingProducts={products.filter((p) => compareList.includes(p.id))}
        brands={brands}
        onRemoveFromCompare={(id) => setCompareList((prev) => prev.filter((x) => x !== id))}
        onOrderWhatsApp={handleWhatsAppOrder}
      />

      <AccessKeyModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
        addToast={addToast}
      />

      {/* Global notifications container */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />

    </div>
  );
}
