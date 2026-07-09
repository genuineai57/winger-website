/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  LayoutDashboard, Package, FolderTree, Award, Settings, Shield, 
  Terminal, LogOut, ArrowLeft, Plus, Edit2, Copy, Trash2, Check, X, 
  Eye, FileText, Smartphone, Laptop, Headphones, PackageOpen, 
  Upload, Sparkles, TrendingUp, AlertTriangle, MessageCircle, Share2, 
  Heart, Loader2, Save
} from "lucide-react";
import { 
  Product, Category, Brand, BusinessSettings, HomepageSettings, 
  SystemLog, DashboardStats, ProductCondition, ProductStatus, 
  ProductSpecification 
} from "../types";

interface AdminPanelProps {
  token: string;
  onLogout: () => void;
  businessSettings: BusinessSettings;
  categories: Category[];
  brands: Brand[];
  onRefreshData: () => void;
  addToast: (msg: string, type: "success" | "error" | "warning" | "info") => void;
}

type AdminSection = "dashboard" | "products" | "categories" | "brands" | "business" | "homepage" | "security" | "logs";

const QUICK_SPEC_NAMES = [
  "RAM", "Storage", "Processor", "Graphics", "Display", "Battery", 
  "Camera", "Operating System", "Network", "SIM Support", "Ports", 
  "Warranty", "Color"
];

export function AdminPanel({
  token,
  onLogout,
  businessSettings,
  categories,
  brands,
  onRefreshData,
  addToast
}: AdminPanelProps) {
  const [activeSection, setActiveSection] = useState<AdminSection>("dashboard");
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  
  // loading states
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Forms states
  const [activeProductForm, setActiveProductForm] = useState<{ isOpen: boolean; mode: "create" | "edit"; data: Partial<Product> | null }>({ isOpen: false, mode: "create", data: null });
  const [specInput, setSpecInput] = useState<{ name: string; value: string }>({ name: "RAM", value: "" });

  // Settings Forms
  const [businessForm, setBusinessForm] = useState<BusinessSettings>({ ...businessSettings });
  
  // Homepage Forms
  const [homepageForm, setHomepageForm] = useState<HomepageSettings>({
    heroTitle: "",
    heroSubtitle: "",
    heroBackground: "",
    primaryButtonText: "",
    secondaryButtonText: "",
    featuredLimit: 6,
    newArrivalsLimit: 6,
    hotDealsLimit: 6
  });

  // Security Form
  const [securityForm, setSecurityForm] = useState({
    currentPassword: "",
    newUsername: "",
    newPassword: "",
    newAccessKey: "",
    sessionTimeout: 60,
    failedAttemptLimit: 5,
    lockoutDuration: 15,
    maintenanceMode: false,
    imgbbApiKey: ""
  });

  // State for deletion confirmations
  const [productToDelete, setProductToDelete] = useState<{ id: string; title: string } | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<{ id: string; name: string } | null>(null);
  const [brandToDelete, setBrandToDelete] = useState<{ id: string; name: string } | null>(null);

  // Category and Brand management states
  const [categoryNameInput, setCategoryNameInput] = useState("");
  const [categoryIconInput, setCategoryIconInput] = useState("Smartphone");
  const [editingCategory, setEditingCategory] = useState<string | null>(null);

  const [brandNameInput, setBrandNameInput] = useState("");
  const [brandLogoInput, setBrandLogoInput] = useState("");
  const [brandDescInput, setBrandDescInput] = useState("");
  const [editingBrand, setEditingBrand] = useState<string | null>(null);

  // Fetch Stats
  const fetchStats = async () => {
    setIsLoadingStats(true);
    try {
      const res = await fetch("/api/admin/analytics", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingStats(false);
    }
  };

  // Fetch Logs
  const fetchLogs = async () => {
    setIsLoadingLogs(true);
    try {
      const res = await fetch("/api/admin/logs", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  // Fetch Products
  const fetchProducts = async () => {
    setIsLoadingProducts(true);
    try {
      const res = await fetch("/api/admin/products", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingProducts(false);
    }
  };

  const fetchSecuritySettings = async () => {
    try {
      const res = await fetch("/api/admin/settings/security", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.security) {
          setSecurityForm(prev => ({
            ...prev,
            maintenanceMode: !!data.security.maintenanceMode,
            sessionTimeout: data.security.sessionTimeout || 60,
            failedAttemptLimit: data.security.failedAttemptLimit || 5,
            lockoutDuration: data.security.lockoutDuration || 15,
            imgbbApiKey: data.security.imgbbApiKey || ""
          }));
        }
      }
    } catch (err) {
      console.error("Failed to fetch security settings:", err);
    }
  };

  // On Section Switch
  useEffect(() => {
    if (activeSection === "dashboard") {
      fetchStats();
    } else if (activeSection === "logs") {
      fetchLogs();
    } else if (activeSection === "products") {
      fetchProducts();
    } else if (activeSection === "security") {
      fetchSecuritySettings();
    }
  }, [activeSection]);

  // Initial Sync Settings inside forms
  useEffect(() => {
    setBusinessForm({ ...businessSettings });
    // Fetch settings to hydrate details
    fetch("/api/settings")
      .then(r => r.json())
      .then(data => {
        if (data.homepage) {
          setHomepageForm(data.homepage);
        }
        if (data.security) {
          setSecurityForm(prev => ({ ...prev, maintenanceMode: !!data.security.maintenanceMode }));
        }
      });
  }, [businessSettings]);

  // Handle file uploads, converts to Base64, proxies through server to ImgBB
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, onUrlGenerated: (url: string) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;

    addToast(`Uploading ${file.name}...`, "info");
    
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      const base64Str = reader.result as string;
      try {
        const res = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            filename: file.name,
            mimeType: file.type,
            base64: base64Str
          })
        });
        const data = await res.json();
        if (res.ok && data.url) {
          onUrlGenerated(data.url);
          addToast("Image uploaded successfully!", "success");
        } else {
          addToast(data.error || "Image upload failed.", "error");
        }
      } catch (err) {
        addToast("Network upload error.", "error");
      }
    };
  };

  // Business settings save
  const handleSaveBusiness = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch("/api/admin/settings/business", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(businessForm)
      });
      if (res.ok) {
        addToast("Business identity saved successfully!", "success");
        onRefreshData();
      } else {
        const data = await res.json();
        addToast(data.error || "Saving failed.", "error");
      }
    } catch (err) {
      addToast("Network error.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  // Homepage Settings save
  const handleSaveHomepage = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch("/api/admin/settings/homepage", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(homepageForm)
      });
      if (res.ok) {
        addToast("Homepage layout settings updated successfully!", "success");
        onRefreshData();
      } else {
        const data = await res.json();
        addToast(data.error || "Homepage settings update failed.", "error");
      }
    } catch (err) {
      addToast("Network error.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  // Security config save
  const handleSaveSecurity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!securityForm.currentPassword) {
      addToast("Current password is required to save security changes.", "warning");
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch("/api/admin/settings/security", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(securityForm)
      });
      const data = await res.json();
      if (res.ok) {
        addToast("Security configurations saved!", "success");
        setSecurityForm(prev => ({
          ...prev,
          currentPassword: "",
          newUsername: "",
          newPassword: "",
          newAccessKey: ""
        }));
        onRefreshData();
      } else {
        addToast(data.error || "Security update failed.", "error");
      }
    } catch (err) {
      addToast("Network error.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  // Category management CRUD
  const handleCategoryAction = async (action: "create" | "update" | "delete", id?: string) => {
    if (action === "create" && !categoryNameInput.trim()) return;
    if (action === "update" && !categoryNameInput.trim()) return;

    try {
      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          action,
          id,
          name: categoryNameInput.trim(),
          icon: categoryIconInput
        })
      });

      const data = await res.json();
      if (res.ok) {
        addToast(`Category ${action}d successfully.`, "success");
        setCategoryNameInput("");
        setEditingCategory(null);
        onRefreshData();
      } else {
        addToast(data.error || "Category action failed.", "error");
      }
    } catch (err) {
      addToast("Network error.", "error");
    }
  };

  // Brand management CRUD
  const handleBrandAction = async (action: "create" | "update" | "delete", id?: string) => {
    if (action === "create" && !brandNameInput.trim()) return;
    if (action === "update" && !brandNameInput.trim()) return;

    try {
      const res = await fetch("/api/admin/brands", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          action,
          id,
          name: brandNameInput.trim(),
          logoUrl: brandLogoInput,
          description: brandDescInput.trim()
        })
      });

      const data = await res.json();
      if (res.ok) {
        addToast(`Brand ${action}d successfully.`, "success");
        setBrandNameInput("");
        setBrandLogoInput("");
        setBrandDescInput("");
        setEditingBrand(null);
        onRefreshData();
      } else {
        addToast(data.error || "Brand action failed.", "error");
      }
    } catch (err) {
      addToast("Network error.", "error");
    }
  };

  // Product CRUD
  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { mode, data } = activeProductForm;
    if (!data?.title || !data.categoryId || !data.brandId) {
      addToast("Product Title, Category, and Brand are required.", "warning");
      return;
    }

    setIsSaving(true);
    try {
      const url = mode === "create" ? "/api/admin/products" : `/api/admin/products/${data.id}`;
      const method = mode === "create" ? "POST" : "PUT";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });

      if (res.ok) {
        addToast(`Product ${mode === "create" ? "created" : "updated"} successfully!`, "success");
        setActiveProductForm({ isOpen: false, mode: "create", data: null });
        fetchProducts();
      } else {
        const resData = await res.json();
        addToast(resData.error || "Failed to save product.", "error");
      }
    } catch (err) {
      addToast("Network error.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        addToast("Product deleted successfully.", "success");
        fetchProducts();
      } else {
        addToast("Deletion failed.", "error");
      }
    } catch (e) {
      addToast("Network error.", "error");
    }
  };

  const handleDuplicateProduct = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/products/${id}/duplicate`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        addToast("Product duplicated successfully!", "success");
        fetchProducts();
      } else {
        addToast("Duplication failed.", "error");
      }
    } catch (e) {
      addToast("Network error.", "error");
    }
  };

  const addSpec = () => {
    if (!specInput.name.trim() || !specInput.value.trim()) return;
    const currentSpecs = activeProductForm.data?.specifications || [];
    
    // Check if spec already exists
    if (currentSpecs.some(s => s.name === specInput.name)) {
      addToast("Specification already exists. Modify it or delete first.", "warning");
      return;
    }

    const updatedSpecs = [...currentSpecs, { name: specInput.name.trim(), value: specInput.value.trim() }];
    setActiveProductForm(prev => ({
      ...prev,
      data: { ...prev.data, specifications: updatedSpecs }
    }));
    setSpecInput({ name: "RAM", value: "" });
  };

  const removeSpec = (name: string) => {
    const currentSpecs = activeProductForm.data?.specifications || [];
    const updatedSpecs = currentSpecs.filter(s => s.name !== name);
    setActiveProductForm(prev => ({
      ...prev,
      data: { ...prev.data, specifications: updatedSpecs }
    }));
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex select-none text-slate-800 dark:text-slate-100 transition-colors">
      
      {/* Sidebar navigation */}
      <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 shrink-0 flex flex-col hidden lg:flex">
        {/* Admin Brand info */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 text-white rounded-xl">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-md tracking-tight block">Console admin</span>
              <span className="text-[10px] uppercase font-bold text-indigo-600 dark:text-indigo-400 font-mono tracking-wider">TanzaTech Premium</span>
            </div>
          </div>
        </div>

        {/* Menu Navigation list */}
        <nav className="flex-1 p-4 space-y-1.5">
          {[
            { id: "dashboard", label: "Overview", icon: LayoutDashboard },
            { id: "products", label: "Products", icon: Package },
            { id: "categories", label: "Categories", icon: FolderTree },
            { id: "brands", label: "Brands", icon: Award },
            { id: "business", label: "Business Settings", icon: Settings },
            { id: "homepage", label: "Homepage Settings", icon: Sparkles },
            { id: "security", label: "Security & Access", icon: Shield },
            { id: "logs", label: "System Logs", icon: Terminal }
          ].map((item) => {
            const Icon = item.icon;
            const active = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id as AdminSection)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                  active 
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/10" 
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                <Icon className="w-4.5 h-4.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Footer controls */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 cursor-pointer"
          >
            <LogOut className="w-4.5 h-4.5" />
            <span>Logout Panel</span>
          </button>
        </div>
      </aside>

      {/* Main dashboard content */}
      <main className="flex-1 flex flex-col overflow-x-hidden min-h-screen">
        
        {/* Header navigation bar */}
        <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Quick exit arrow */}
            <button
              onClick={onLogout}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer flex items-center gap-1 text-slate-500 dark:text-slate-300 hover:text-slate-700 font-bold text-xs"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Showcase Page</span>
            </button>
            
            {/* Divider */}
            <span className="text-slate-300 dark:text-slate-700">|</span>
            
            <h2 className="text-sm font-extrabold capitalize text-slate-900 dark:text-slate-50 font-display">
              {activeSection} Configuration
            </h2>
          </div>

          {/* Quick Stats Summary indicator */}
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Authenticated Admin Session
            </span>
          </div>
        </header>

        {/* Router of active views */}
        <div className="flex-1 p-6 md:p-8 space-y-6 overflow-y-auto">
          
          {/* ========================================== */}
          {/* SECTION: OVERVIEW (DASHBOARD)             */}
          {/* ========================================== */}
          {activeSection === "dashboard" && (
            <div className="space-y-6">
              
              {/* Top Banner Alert if low stock is active */}
              {stats && stats.lowStockProducts > 0 && (
                <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-2xl flex items-center gap-3 text-amber-900 dark:text-amber-200">
                  <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
                  <p className="text-xs font-medium">
                    *Action Required:* You have *{stats.lowStockProducts}* products approaching or below their low stock thresholds. Update stock levels to preserve availability status.
                  </p>
                </div>
              )}

              {/* Stats Grid cards */}
              {isLoadingStats ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="h-28 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 space-y-2">
                      <div className="h-4 w-20 rounded bg-slate-200 dark:bg-slate-800 skeleton-shimmer" />
                      <div className="h-8 w-12 rounded bg-slate-300 dark:bg-slate-800 skeleton-shimmer" />
                    </div>
                  ))}
                </div>
              ) : stats ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  
                  {/* Total products */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl flex items-center justify-between">
                    <div>
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold block uppercase">Total Products</span>
                      <span className="text-2xl font-black font-sans block mt-1">{stats.totalProducts}</span>
                    </div>
                    <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-xl">
                      <Package className="w-5 h-5" />
                    </div>
                  </div>

                  {/* Available */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl flex items-center justify-between">
                    <div>
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold block uppercase">Available Now</span>
                      <span className="text-2xl font-black font-sans block mt-1 text-emerald-600 dark:text-emerald-400">{stats.availableProducts}</span>
                    </div>
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-xl">
                      <Check className="w-5 h-5" />
                    </div>
                  </div>

                  {/* Sold out */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl flex items-center justify-between">
                    <div>
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold block uppercase">Sold Out</span>
                      <span className="text-2xl font-black font-sans block mt-1 text-rose-600 dark:text-rose-400">{stats.soldOutProducts}</span>
                    </div>
                    <div className="p-3 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-xl">
                      <X className="w-5 h-5" />
                    </div>
                  </div>

                  {/* Low Stock Alerts */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl flex items-center justify-between">
                    <div>
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold block uppercase">Low Stock Alerts</span>
                      <span className="text-2xl font-black font-sans block mt-1 text-amber-600 dark:text-amber-400">{stats.lowStockProducts}</span>
                    </div>
                    <div className="p-3 bg-amber-50 dark:bg-amber-950/40 text-amber-500 dark:text-amber-400 rounded-xl">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                  </div>

                  {/* Views */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl flex items-center justify-between">
                    <div>
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold block uppercase">Product Views</span>
                      <span className="text-2xl font-black font-sans block mt-1">{stats.totalViews}</span>
                    </div>
                    <div className="p-3 bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 rounded-xl">
                      <Eye className="w-5 h-5" />
                    </div>
                  </div>

                  {/* WhatsApp Click clicks */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl flex items-center justify-between">
                    <div>
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold block uppercase">WhatsApp Inquiries</span>
                      <span className="text-2xl font-black font-sans block mt-1 text-emerald-600">{stats.totalWhatsAppClicks}</span>
                    </div>
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-xl">
                      <MessageCircle className="w-5 h-5" />
                    </div>
                  </div>

                  {/* Broker Winger share counts */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl flex items-center justify-between">
                    <div>
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold block uppercase">Winger / Specs Shares</span>
                      <span className="text-2xl font-black font-sans block mt-1 text-indigo-600 dark:text-indigo-400">{stats.totalShares}</span>
                    </div>
                    <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-xl">
                      <Share2 className="w-5 h-5" />
                    </div>
                  </div>

                  {/* Total favorites */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl flex items-center justify-between">
                    <div>
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold block uppercase">Saved Favorites</span>
                      <span className="text-2xl font-black font-sans block mt-1 text-rose-500">{stats.totalFavorites}</span>
                    </div>
                    <div className="p-3 bg-rose-50 dark:bg-rose-950/40 text-rose-500 dark:text-rose-400 rounded-xl">
                      <Heart className="w-5 h-5" />
                    </div>
                  </div>

                </div>
              ) : null}

              {/* Performance / Tanzanian local optimization guide card */}
              <div className="p-6 bg-indigo-600 text-white rounded-3xl relative overflow-hidden shadow-xl">
                <div className="absolute right-0 bottom-0 translate-x-12 translate-y-12 opacity-15">
                  <TrendingUp className="w-64 h-64" />
                </div>
                <div className="max-w-xl space-y-3 relative z-10">
                  <span className="px-2.5 py-0.5 bg-white/15 text-white font-bold text-[10px] rounded uppercase tracking-wider">
                    Showcase Optimization
                  </span>
                  <h3 className="text-xl font-bold font-display leading-tight">
                    Optimized for Tanzania's Mobile Internet Speeds
                  </h3>
                  <p className="text-xs text-indigo-100 leading-relaxed font-sans">
                    The showcase compresses high-resolution assets and auto-caches catalog lists to load instantly on poor connections across Dar, Arusha, Mwanza, and rural provinces. Brokers enjoy lightning fast copies of technical descriptions seamlessly.
                  </p>
                </div>
              </div>

            </div>
          )}

          {/* ========================================== */}
          {/* SECTION: PRODUCTS CATALOG MANAGEMENT     */}
          {/* ========================================== */}
          {activeSection === "products" && (
            <div className="space-y-6">
              
              {/* Filter / Actions Bar */}
              <div className="flex justify-between items-center gap-4 flex-wrap">
                <h3 className="text-md font-bold font-display flex items-center gap-2">
                  <Package className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  Product Inventory list ({products.length})
                </h3>
                
                {/* Create Trigger */}
                <button
                  onClick={() => setActiveProductForm({
                    isOpen: true,
                    mode: "create",
                    data: {
                      title: "",
                      categoryId: categories[0]?.id || "",
                      brandId: brands[0]?.id || "",
                      model: "",
                      description: "",
                      sellingPrice: 0,
                      stockQuantity: 1,
                      lowStockThreshold: 1,
                      condition: "Brand New",
                      status: "Available",
                      coverImage: "https://images.unsplash.com/photo-1531297484001-80022131f5a1?auto=format&fit=crop&w=600&q=80",
                      images: [],
                      isFeatured: false,
                      isHotDeal: false,
                      specifications: [],
                      internalNotes: ""
                    }
                  })}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-lg shadow-indigo-500/10 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Tech Product</span>
                </button>
              </div>

              {/* Add/Edit Product form inline sheet */}
              {activeProductForm.isOpen && (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-xl space-y-6">
                  <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
                    <h4 className="text-sm font-bold font-display uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                      {activeProductForm.mode === "create" ? "Add New Technology Product" : "Edit Product Record"}
                    </h4>
                    <button
                      onClick={() => setActiveProductForm({ isOpen: false, mode: "create", data: null })}
                      className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <form onSubmit={productProductSubmit => handleProductSubmit(productProductSubmit)} className="space-y-6">
                    
                    {/* Basic Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                      
                      {/* Title */}
                      <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-2">Product Title</label>
                        <input
                          type="text"
                          required
                          value={activeProductForm.data?.title || ""}
                          onChange={(e) => setActiveProductForm(prev => ({
                            ...prev,
                            data: { ...prev.data, title: e.target.value }
                          }))}
                          placeholder="e.g. iPhone 15 Pro Max, Dell XPS 15 9530"
                          className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        />
                      </div>

                      {/* Model */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-2">Model Code</label>
                        <input
                          type="text"
                          value={activeProductForm.data?.model || ""}
                          onChange={(e) => setActiveProductForm(prev => ({
                            ...prev,
                            data: { ...prev.data, model: e.target.value }
                          }))}
                          placeholder="e.g. A3106, XPS-9530"
                          className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        />
                      </div>

                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
                      
                      {/* Category */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-2">Category</label>
                        <select
                          required
                          value={activeProductForm.data?.categoryId || ""}
                          onChange={(e) => setActiveProductForm(prev => ({
                            ...prev,
                            data: { ...prev.data, categoryId: e.target.value }
                          }))}
                          className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        >
                          {categories.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                      </div>

                      {/* Brand */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-2">Brand</label>
                        <select
                          required
                          value={activeProductForm.data?.brandId || ""}
                          onChange={(e) => setActiveProductForm(prev => ({
                            ...prev,
                            data: { ...prev.data, brandId: e.target.value }
                          }))}
                          className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        >
                          {brands.map(b => (
                            <option key={b.id} value={b.id}>{b.name}</option>
                          ))}
                        </select>
                      </div>

                      {/* Condition */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-2">Condition</label>
                        <select
                          value={activeProductForm.data?.condition || "Brand New"}
                          onChange={(e) => setActiveProductForm(prev => ({
                            ...prev,
                            data: { ...prev.data, condition: e.target.value as ProductCondition }
                          }))}
                          className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        >
                          {["Brand New", "Used", "Refurbished", "Open Box"].map(c => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>

                      {/* Status */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-2">Inventory Status</label>
                        <select
                          value={activeProductForm.data?.status || "Available"}
                          onChange={(e) => setActiveProductForm(prev => ({
                            ...prev,
                            data: { ...prev.data, status: e.target.value as ProductStatus }
                          }))}
                          className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        >
                          {["Available", "Coming Soon", "Sold Out"].map(s => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </div>

                    </div>

                    {/* Pricing and Stock */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
                      
                      {/* Selling Price */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-2">Selling Price (TZS)</label>
                        <input
                          type="number"
                          required
                          value={activeProductForm.data?.sellingPrice || 0}
                          onChange={(e) => setActiveProductForm(prev => ({
                            ...prev,
                            data: { ...prev.data, sellingPrice: Number(e.target.value) }
                          }))}
                          placeholder="e.g. 3450000"
                          className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-mono"
                        />
                      </div>

                      {/* Previous Price */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-2">Previous Price (TZS - Optional)</label>
                        <input
                          type="number"
                          value={activeProductForm.data?.previousPrice || ""}
                          onChange={(e) => setActiveProductForm(prev => ({
                            ...prev,
                            data: { ...prev.data, previousPrice: e.target.value ? Number(e.target.value) : undefined }
                          }))}
                          placeholder="e.g. 3800000"
                          className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-mono"
                        />
                      </div>

                      {/* Stock Quantity */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-2">Stock Quantity</label>
                        <input
                          type="number"
                          required
                          value={activeProductForm.data?.stockQuantity ?? 1}
                          onChange={(e) => {
                            const stock = Number(e.target.value);
                            // Auto Sold Out status triggers if stock hits 0
                            setActiveProductForm(prev => ({
                              ...prev,
                              data: { 
                                ...prev.data, 
                                stockQuantity: stock,
                                status: stock === 0 ? "Sold Out" : prev.data?.status
                              }
                            }));
                          }}
                          className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-mono"
                        />
                      </div>

                      {/* Low Stock threshold */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-2">Low Stock Threshold</label>
                        <input
                          type="number"
                          required
                          value={activeProductForm.data?.lowStockThreshold ?? 1}
                          onChange={(e) => setActiveProductForm(prev => ({
                            ...prev,
                            data: { ...prev.data, lowStockThreshold: Number(e.target.value) }
                          }))}
                          className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-mono"
                        />
                      </div>

                    </div>

                    {/* Image uploads */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      
                      {/* Cover Image Input + Picker */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-2">Cover Image URL</label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={activeProductForm.data?.coverImage || ""}
                            onChange={(e) => setActiveProductForm(prev => ({
                              ...prev,
                              data: { ...prev.data, coverImage: e.target.value }
                            }))}
                            placeholder="https://images.unsplash.com/..."
                            className="flex-1 px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                          />
                          <div className="relative shrink-0">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleImageUpload(e, (url) => {
                                setActiveProductForm(prev => ({
                                  ...prev,
                                  data: { ...prev.data, coverImage: url }
                                }));
                              })}
                              className="hidden"
                              id="cover-file-picker"
                            />
                            <label
                              htmlFor="cover-file-picker"
                              className="px-4 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-sm"
                            >
                              <Upload className="w-4 h-4" />
                              <span>Upload</span>
                            </label>
                          </div>
                        </div>
                      </div>

                      {/* Additional Gallery Image input */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-2">Add Gallery Image</label>
                        <div className="relative">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleImageUpload(e, (url) => {
                              const existingArr = activeProductForm.data?.images || [];
                              setActiveProductForm(prev => ({
                                ...prev,
                                  data: { ...prev.data, images: [...existingArr, url] }
                              }));
                            })}
                            className="hidden"
                            id="gallery-file-picker"
                          />
                          <label
                            htmlFor="gallery-file-picker"
                            className="w-full py-3 border border-dashed border-slate-300 dark:border-slate-800 text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 text-xs font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all"
                          >
                            <Upload className="w-4 h-4" />
                            <span>Select & Upload Additional Gallery Photo</span>
                          </label>
                        </div>
                        {activeProductForm.data?.images && activeProductForm.data.images.length > 0 && (
                          <div className="flex gap-2 flex-wrap mt-3">
                            {activeProductForm.data.images.map((imgUrl, imgIdx) => (
                              <div key={imgIdx} className="relative w-12 h-12 border border-slate-200 rounded-lg overflow-hidden group">
                                <img src={imgUrl} className="w-full h-full object-cover" />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const filtered = activeProductForm.data?.images?.filter((_, i) => i !== imgIdx);
                                    setActiveProductForm(prev => ({
                                      ...prev,
                                      data: { ...prev.data, images: filtered }
                                    }));
                                  }}
                                  className="absolute inset-0 bg-rose-600/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-bold"
                                >
                                  Del
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                    </div>

                    {/* Description and Internal Notes */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      
                      {/* Description */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-2">Public Product Description</label>
                        <textarea
                          rows={4}
                          value={activeProductForm.data?.description || ""}
                          onChange={(e) => setActiveProductForm(prev => ({
                            ...prev,
                            data: { ...prev.data, description: e.target.value }
                          }))}
                          placeholder="Provide detailed information regarding features, condition, specs..."
                          className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none"
                        />
                      </div>

                      {/* Internal Notes - HIDDEN from normal visitors */}
                      <div>
                        <label className="block text-xs font-bold text-rose-700 dark:text-rose-300 uppercase mb-2">Internal Shop Notes (Admin Only)</label>
                        <textarea
                          rows={4}
                          value={activeProductForm.data?.internalNotes || ""}
                          onChange={(e) => setActiveProductForm(prev => ({
                            ...prev,
                            data: { ...prev.data, internalNotes: e.target.value }
                          }))}
                          placeholder="e.g. Imported from Dubai, original packaging. Located in Cabinet B. Margin details..."
                          className="w-full px-3.5 py-2.5 bg-rose-50/20 dark:bg-rose-950/10 border border-rose-200/50 dark:border-rose-900/30 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/10 resize-none font-mono"
                        />
                      </div>

                    </div>

                    {/* Specifications matrix builder (CRITICAL) */}
                    <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-4">
                      <h4 className="text-xs font-extrabold uppercase tracking-wide text-indigo-600 dark:text-indigo-400">
                        Technical Specifications Editor
                      </h4>
                      
                      {/* Builder selectors */}
                      <div className="flex gap-2 flex-wrap items-end">
                        <div className="flex-1 min-w-[150px]">
                          <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Spec Key</label>
                          <select
                            value={QUICK_SPEC_NAMES.includes(specInput.name) ? specInput.name : "custom"}
                            onChange={(e) => {
                              const val = e.target.value;
                              setSpecInput(prev => ({ ...prev, name: val === "custom" ? "" : val }));
                            }}
                            className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-850 rounded-xl text-xs"
                          >
                            {QUICK_SPEC_NAMES.map(n => <option key={n} value={n}>{n}</option>)}
                            <option value="custom">* Custom Key... *</option>
                          </select>
                          {!QUICK_SPEC_NAMES.includes(specInput.name) && (
                            <input
                              type="text"
                              required
                              value={specInput.name}
                              onChange={(e) => setSpecInput(prev => ({ ...prev, name: e.target.value }))}
                              placeholder="Type Custom Key Name"
                              className="w-full mt-1.5 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-850 rounded-xl text-xs"
                            />
                          )}
                        </div>

                        <div className="flex-1 min-w-[200px]">
                          <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Value Description</label>
                          <input
                            type="text"
                            value={specInput.value}
                            onChange={(e) => setSpecInput(prev => ({ ...prev, value: e.target.value }))}
                            placeholder="e.g. 16GB DDR5, Snapdragon 8 Gen 3"
                            className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-850 rounded-xl text-xs"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={addSpec}
                          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white text-xs font-bold rounded-xl cursor-pointer"
                        >
                          Append Spec
                        </button>
                      </div>

                      {/* Display appended specs list */}
                      {activeProductForm.data?.specifications && activeProductForm.data.specifications.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
                          {activeProductForm.data.specifications.map((spec, sIdx) => (
                            <div key={sIdx} className="flex justify-between items-center gap-2 p-2.5 bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl text-xs">
                              <div className="font-mono truncate">
                                <span className="font-bold text-indigo-600 dark:text-indigo-400">{spec.name}:</span> {spec.value}
                              </div>
                              <button
                                type="button"
                                onClick={() => removeSpec(spec.name)}
                                className="text-slate-400 hover:text-rose-500 shrink-0 p-0.5"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[11px] text-slate-400 italic">No technical specs appended yet.</p>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-3 justify-end items-center pt-4 border-t border-slate-100 dark:border-slate-800">
                      <button
                        type="button"
                        onClick={() => setActiveProductForm({ isOpen: false, mode: "create", data: null })}
                        className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 rounded-xl text-xs font-bold cursor-pointer"
                      >
                        Discard
                      </button>
                      <button
                        type="submit"
                        disabled={isSaving}
                        className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-lg shadow-indigo-500/10 cursor-pointer disabled:opacity-50"
                      >
                        {isSaving ? (
                          <>
                            <Loader2 className="w-4.5 h-4.5 animate-spin" />
                            <span>Saving Product...</span>
                          </>
                        ) : (
                          <>
                            <Save className="w-4.5 h-4.5" />
                            <span>Save Product Record</span>
                          </>
                        )}
                      </button>
                    </div>

                  </form>
                </div>
              )}

              {/* Product Inventory Table List */}
              {isLoadingProducts ? (
                <div className="p-12 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-600 mb-2" />
                  <p className="text-xs text-slate-500">Loading full inventory...</p>
                </div>
              ) : (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs sm:text-sm border-collapse">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800">
                          <th className="p-4 font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider font-display">Cover</th>
                          <th className="p-4 font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider font-display">Product Info</th>
                          <th className="p-4 font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider font-display">Specs</th>
                          <th className="p-4 font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider font-display">Price (TZS)</th>
                          <th className="p-4 font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider font-display text-center">Stock</th>
                          <th className="p-4 font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider font-display text-center">Status</th>
                          <th className="p-4 font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider font-display text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {products.map((p) => {
                          const brandName = brands.find(b => b.id === p.brandId)?.name || "N/A";
                          const isLowStock = p.stockQuantity <= p.lowStockThreshold;

                          return (
                            <tr key={p.id} className="border-b last:border-b-0 border-slate-200 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-colors">
                              {/* Cover thumbnail */}
                              <td className="p-4 shrink-0">
                                <img
                                  src={p.coverImage}
                                  alt={p.title}
                                  referrerPolicy="no-referrer"
                                  className="w-12 h-12 object-cover rounded-xl border border-slate-100 dark:border-slate-800"
                                />
                              </td>
                              
                              {/* Title / Brand */}
                              <td className="p-4">
                                <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider block font-sans">
                                  {brandName}
                                </span>
                                <span className="font-bold text-slate-900 dark:text-slate-100 block font-sans leading-tight">
                                  {p.title}
                                </span>
                                <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-mono">
                                  Model: {p.model || "N/A"}
                                </span>
                              </td>

                              {/* Specs quick view */}
                              <td className="p-4 max-w-[150px] truncate">
                                <div className="flex gap-1 flex-wrap">
                                  <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[9px] font-bold font-mono">
                                    {p.condition}
                                  </span>
                                  {p.isFeatured && (
                                    <span className="px-1.5 py-0.5 bg-indigo-500 text-white rounded text-[9px] font-bold">
                                      Featured
                                    </span>
                                  )}
                                  {p.isHotDeal && (
                                    <span className="px-1.5 py-0.5 bg-rose-600 text-white rounded text-[9px] font-bold">
                                      Hot
                                    </span>
                                  )}
                                </div>
                              </td>

                              {/* Price */}
                              <td className="p-4 font-bold font-mono text-slate-900 dark:text-slate-100">
                                {new Intl.NumberFormat("en-US", { style: "currency", currency: "TZS", minimumFractionDigits: 0 }).format(p.sellingPrice).replace("TZS", "TZS ")}
                              </td>

                              {/* Stock Quantity */}
                              <td className="p-4 text-center">
                                <span className={`font-mono font-bold text-sm ${isLowStock ? "text-amber-500 font-extrabold" : ""}`}>
                                  {p.stockQuantity}
                                </span>
                                {isLowStock && (
                                  <span className="text-[9px] font-bold uppercase text-amber-500 block">Low Stock</span>
                                )}
                              </td>

                              {/* Status Badging */}
                              <td className="p-4 text-center">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  p.status === "Available"
                                    ? "bg-emerald-100 text-emerald-800"
                                    : p.status === "Coming Soon"
                                    ? "bg-amber-100 text-amber-800"
                                    : "bg-rose-100 text-rose-800"
                                }`}>
                                  {p.status}
                                </span>
                              </td>

                              {/* Actions */}
                              <td className="p-4 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  {/* Edit */}
                                  <button
                                    onClick={() => setActiveProductForm({ isOpen: true, mode: "edit", data: p })}
                                    className="p-2 text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                                    title="Edit Product"
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </button>
                                  {/* Duplicate */}
                                  <button
                                    onClick={() => handleDuplicateProduct(p.id)}
                                    className="p-2 text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                                    title="Duplicate Product Record"
                                  >
                                    <Copy className="w-4 h-4" />
                                  </button>
                                  {/* Delete */}
                                  <button
                                    onClick={() => setProductToDelete({ id: p.id, title: p.title })}
                                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-xl"
                                    title="Delete Product"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>

                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* ========================================== */}
          {/* SECTION: CATEGORIES MANAGEMENT            */}
          {/* ========================================== */}
          {activeSection === "categories" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Category form card */}
              <div className="md:col-span-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl h-fit">
                <h4 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-4">
                  {editingCategory ? "Update Category" : "Create Category"}
                </h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Category Name</label>
                    <input
                      type="text"
                      value={categoryNameInput}
                      onChange={(e) => setCategoryNameInput(e.target.value)}
                      placeholder="e.g. Tablets, Wearables"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Icon Representation</label>
                    <select
                      value={categoryIconInput}
                      onChange={(e) => setCategoryIconInput(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl text-sm"
                    >
                      <option value="Smartphone">Smartphone Icon</option>
                      <option value="Laptop">Laptop Icon</option>
                      <option value="Headphones">Headphones Icon</option>
                      <option value="PackageOpen">General Package Icon</option>
                    </select>
                  </div>

                  <div className="flex gap-2 pt-2">
                    {editingCategory && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingCategory(null);
                          setCategoryNameInput("");
                        }}
                        className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
                      >
                        Cancel
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        if (editingCategory) {
                          handleCategoryAction("update", editingCategory);
                        } else {
                          handleCategoryAction("create");
                        }
                      }}
                      className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer"
                    >
                      {editingCategory ? "Save Changes" : "Create Category"}
                    </button>
                  </div>
                </div>
              </div>

              {/* Category table list */}
              <div className="md:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800">
                      <th className="p-4 font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Display icon</th>
                      <th className="p-4 font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Category Name</th>
                      <th className="p-4 font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categories.map((c) => (
                      <tr key={c.id} className="border-b last:border-b-0 border-slate-200 dark:border-slate-800">
                        <td className="p-4">
                          <div className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg w-fit">
                            {c.icon === "Smartphone" ? <Smartphone className="w-4.5 h-4.5" /> : c.icon === "Laptop" ? <Laptop className="w-4.5 h-4.5" /> : c.icon === "Headphones" ? <Headphones className="w-4.5 h-4.5" /> : <PackageOpen className="w-4.5 h-4.5" />}
                          </div>
                        </td>
                        <td className="p-4 font-bold text-slate-900 dark:text-slate-100 font-sans">{c.name}</td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => {
                                setEditingCategory(c.id);
                                setCategoryNameInput(c.name);
                                setCategoryIconInput(c.icon);
                              }}
                              className="p-1.5 text-slate-500 hover:text-indigo-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setCategoryToDelete({ id: c.id, name: c.name })}
                              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/20"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

            </div>
          )}

          {/* ========================================== */}
          {/* SECTION: BRANDS MANAGEMENT                */}
          {/* ========================================== */}
          {activeSection === "brands" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Brand creation Form */}
              <div className="md:col-span-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl h-fit">
                <h4 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-4">
                  {editingBrand ? "Update Brand" : "Create Brand"}
                </h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Brand Name</label>
                    <input
                      type="text"
                      value={brandNameInput}
                      onChange={(e) => setBrandNameInput(e.target.value)}
                      placeholder="e.g. Xiaomi, Asus"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Brand Logo URL</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={brandLogoInput}
                        onChange={(e) => setBrandLogoInput(e.target.value)}
                        placeholder="https://..."
                        className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl text-sm"
                      />
                      <div className="relative shrink-0">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleImageUpload(e, (url) => setBrandLogoInput(url))}
                          className="hidden"
                          id="brand-logo-uploader"
                        />
                        <label
                          htmlFor="brand-logo-uploader"
                          className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold rounded-xl flex items-center cursor-pointer shadow-sm"
                        >
                          <Upload className="w-3.5 h-3.5" />
                        </label>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Brief Description</label>
                    <textarea
                      rows={2}
                      value={brandDescInput}
                      onChange={(e) => setBrandDescInput(e.target.value)}
                      placeholder="Brief overview of brand focus..."
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl text-sm resize-none"
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    {editingBrand && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingBrand(null);
                          setBrandNameInput("");
                          setBrandLogoInput("");
                          setBrandDescInput("");
                        }}
                        className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
                      >
                        Cancel
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        if (editingBrand) {
                          handleBrandAction("update", editingBrand);
                        } else {
                          handleBrandAction("create");
                        }
                      }}
                      className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer"
                    >
                      {editingBrand ? "Save Brand" : "Create Brand"}
                    </button>
                  </div>
                </div>
              </div>

              {/* Brands list */}
              <div className="md:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800">
                      <th className="p-4 font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Logo</th>
                      <th className="p-4 font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Brand Name</th>
                      <th className="p-4 font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Description</th>
                      <th className="p-4 font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {brands.map((b) => (
                      <tr key={b.id} className="border-b last:border-b-0 border-slate-200 dark:border-slate-800">
                        <td className="p-4">
                          {b.logoUrl ? (
                            <img src={b.logoUrl} className="w-8 h-8 rounded-lg object-cover border" />
                          ) : (
                            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-400 flex items-center justify-center font-bold text-xs">
                              {b.name[0]}
                            </div>
                          )}
                        </td>
                        <td className="p-4 font-bold text-slate-900 dark:text-slate-100 font-sans">{b.name}</td>
                        <td className="p-4 text-slate-500 dark:text-slate-400">{b.description || "N/A"}</td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => {
                                setEditingBrand(b.id);
                                setBrandNameInput(b.name);
                                setBrandLogoInput(b.logoUrl);
                                setBrandDescInput(b.description);
                              }}
                              className="p-1.5 text-slate-500 hover:text-indigo-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setBrandToDelete({ id: b.id, name: b.name })}
                              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/20"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

            </div>
          )}

          {/* ========================================== */}
          {/* SECTION: BUSINESS SETTINGS                */}
          {/* ========================================== */}
          {activeSection === "business" && (
            <form onSubmit={handleSaveBusiness} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm space-y-6">
              
              {/* Identity dynamic rebranding notification */}
              <div className="p-4 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 rounded-2xl">
                <h4 className="text-xs font-bold text-indigo-950 dark:text-indigo-200 uppercase tracking-wide">
                  Dynamic Rebranding Identity Module
                </h4>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 leading-normal">
                  The values compiled below control the visual presence of this platform. Modifying these properties instantly updates all headers, footers, templates, and contacts without editing source code. Ideal for resale or transferring.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                
                {/* Business Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-2">Business Name</label>
                  <input
                    type="text"
                    required
                    value={businessForm.businessName}
                    onChange={(e) => setBusinessForm({ ...businessForm, businessName: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl text-sm"
                  />
                </div>

                {/* Tagline */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-2">Tagline Slogan</label>
                  <input
                    type="text"
                    value={businessForm.tagline}
                    onChange={(e) => setBusinessForm({ ...businessForm, tagline: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl text-sm"
                  />
                </div>

                {/* Business Logo URL */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-2">Business Logo URL</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={businessForm.logoUrl}
                      onChange={(e) => setBusinessForm({ ...businessForm, logoUrl: e.target.value })}
                      className="flex-1 px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl text-sm"
                    />
                    <div className="relative shrink-0">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e, (url) => setBusinessForm({ ...businessForm, logoUrl: url }))}
                        className="hidden"
                        id="biz-logo-uploader"
                      />
                      <label
                        htmlFor="biz-logo-uploader"
                        className="px-4 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 text-xs font-bold rounded-xl flex items-center gap-1 cursor-pointer shadow-sm"
                      >
                        <Upload className="w-4 h-4" />
                      </label>
                    </div>
                  </div>
                </div>

                {/* Favicon URL */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-2">Favicon Shortcut Icon URL</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={businessForm.faviconUrl}
                      onChange={(e) => setBusinessForm({ ...businessForm, faviconUrl: e.target.value })}
                      className="flex-1 px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl text-sm"
                    />
                    <div className="relative shrink-0">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e, (url) => setBusinessForm({ ...businessForm, faviconUrl: url }))}
                        className="hidden"
                        id="biz-favicon-uploader"
                      />
                      <label
                        htmlFor="biz-favicon-uploader"
                        className="px-4 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 text-xs font-bold rounded-xl flex items-center gap-1 cursor-pointer shadow-sm"
                      >
                        <Upload className="w-4 h-4" />
                      </label>
                    </div>
                  </div>
                </div>

                {/* WhatsApp Sales Number */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-2">WhatsApp Sales Number (No '+' or space, e.g. 255712345678)</label>
                  <input
                    type="text"
                    required
                    value={businessForm.whatsappNumber}
                    onChange={(e) => setBusinessForm({ ...businessForm, whatsappNumber: e.target.value.replace(/[^0-9]/g, "") })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-mono"
                  />
                </div>

                {/* Email Address */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-2">Email Address</label>
                  <input
                    type="email"
                    value={businessForm.email}
                    onChange={(e) => setBusinessForm({ ...businessForm, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-mono"
                  />
                </div>

                {/* Physical Location Address */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-2">Physical Shop Address</label>
                  <input
                    type="text"
                    value={businessForm.physicalAddress}
                    onChange={(e) => setBusinessForm({ ...businessForm, physicalAddress: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl text-sm"
                  />
                </div>

                {/* Google Maps Embed Link */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-2">Google Maps URL Link</label>
                  <input
                    type="text"
                    value={businessForm.googleMapsUrl}
                    onChange={(e) => setBusinessForm({ ...businessForm, googleMapsUrl: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl text-sm"
                  />
                </div>

                {/* Facebook URL */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-2">Facebook Page Link</label>
                  <input
                    type="text"
                    value={businessForm.facebookUrl}
                    onChange={(e) => setBusinessForm({ ...businessForm, facebookUrl: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl text-sm"
                  />
                </div>

                {/* Instagram URL */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-2">Instagram Page Link</label>
                  <input
                    type="text"
                    value={businessForm.instagramUrl}
                    onChange={(e) => setBusinessForm({ ...businessForm, instagramUrl: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl text-sm"
                  />
                </div>

                {/* Footer text */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-2">Copyright & Footer Information block</label>
                  <textarea
                    rows={2}
                    value={businessForm.footerText}
                    onChange={(e) => setBusinessForm({ ...businessForm, footerText: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl text-sm resize-none"
                  />
                </div>

              </div>

              {/* Submit */}
              <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-500/15 cursor-pointer disabled:opacity-50 flex items-center gap-2"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>Save Business Configuration</span>
                </button>
              </div>

            </form>
          )}

          {/* ========================================== */}
          {/* SECTION: HOMEPAGE SETTINGS                 */}
          {/* ========================================== */}
          {activeSection === "homepage" && (
            <form onSubmit={handleSaveHomepage} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                
                {/* Hero Title */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-2">Hero Main Headline Title</label>
                  <input
                    type="text"
                    required
                    value={homepageForm.heroTitle}
                    onChange={(e) => setHomepageForm({ ...homepageForm, heroTitle: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold"
                  />
                </div>

                {/* Hero Subtitle */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-2">Hero Subtitle</label>
                  <textarea
                    rows={2}
                    required
                    value={homepageForm.heroSubtitle}
                    onChange={(e) => setHomepageForm({ ...homepageForm, heroSubtitle: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl text-sm resize-none"
                  />
                </div>

                {/* Hero background image */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-2">Hero Background Banner Image URL</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={homepageForm.heroBackground}
                      onChange={(e) => setHomepageForm({ ...homepageForm, heroBackground: e.target.value })}
                      className="flex-1 px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-mono"
                    />
                    <div className="relative shrink-0">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e, (url) => setHomepageForm({ ...homepageForm, heroBackground: url }))}
                        className="hidden"
                        id="hero-bg-uploader"
                      />
                      <label
                        htmlFor="hero-bg-uploader"
                        className="px-4 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 text-xs font-bold rounded-xl flex items-center gap-1 cursor-pointer shadow-sm"
                      >
                        <Upload className="w-4 h-4" />
                      </label>
                    </div>
                  </div>
                </div>

                {/* Button texts */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-2">Primary CTA Button</label>
                    <input
                      type="text"
                      value={homepageForm.primaryButtonText}
                      onChange={(e) => setHomepageForm({ ...homepageForm, primaryButtonText: e.target.value })}
                      className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-2">Secondary CTA Button</label>
                    <input
                      type="text"
                      value={homepageForm.secondaryButtonText}
                      onChange={(e) => setHomepageForm({ ...homepageForm, secondaryButtonText: e.target.value })}
                      className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl text-sm"
                    />
                  </div>
                </div>

              </div>

              {/* Submit */}
              <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-500/15 cursor-pointer disabled:opacity-50 flex items-center gap-2"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>Save Homepage Settings</span>
                </button>
              </div>

            </form>
          )}

          {/* ========================================== */}
          {/* SECTION: SECURITY & ROLES PROFILE         */}
          {/* ========================================== */}
          {activeSection === "security" && (
            <form onSubmit={handleSaveSecurity} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm space-y-6">
              
              {/* Warnings regarding security credentials */}
              <div className="p-4 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 rounded-2xl">
                <h4 className="text-xs font-bold text-rose-950 dark:text-rose-200 uppercase tracking-wide">
                  Sensitive Operations Credentials Verification
                </h4>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 leading-normal">
                  Modifying your username, password, or the hidden 3-layer Access Key requires input of your current active administrator password. Keep these settings backed up. Plain text storage is strictly forbidden; hashes are compiled automatically.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                
                {/* New Username */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-2">New Admin Username</label>
                  <input
                    type="text"
                    value={securityForm.newUsername}
                    onChange={(e) => setSecurityForm({ ...securityForm, newUsername: e.target.value })}
                    placeholder="Leave blank to keep current"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl text-sm"
                  />
                </div>

                {/* New Password */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-2">New Admin Password</label>
                  <input
                    type="password"
                    value={securityForm.newPassword}
                    onChange={(e) => setSecurityForm({ ...securityForm, newPassword: e.target.value })}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl text-sm"
                  />
                </div>

                {/* New Access Key */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-2">New Access Key (Trigger Layer 2 Key)</label>
                  <input
                    type="password"
                    value={securityForm.newAccessKey}
                    onChange={(e) => setSecurityForm({ ...securityForm, newAccessKey: e.target.value })}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-mono"
                  />
                </div>

                {/* Maintenance Toggle */}
                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-2xl">
                  <div>
                    <span className="block text-xs font-bold uppercase">Maintenance Mode</span>
                    <span className="text-[10px] text-slate-500 mt-1 block">
                      Visitors will see a professional placeholder; you can still log in.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={securityForm.maintenanceMode}
                    onChange={(e) => setSecurityForm({ ...securityForm, maintenanceMode: e.target.checked })}
                    className="h-5 w-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                </div>

                {/* ImgBB API Key */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-2">ImgBB API Key (For Image Uploads)</label>
                  <input
                    type="text"
                    value={securityForm.imgbbApiKey || ""}
                    onChange={(e) => setSecurityForm({ ...securityForm, imgbbApiKey: e.target.value })}
                    placeholder="Enter ImgBB API Key (e.g. 1a2b3c4d5e...)"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-mono"
                  />
                  <p className="text-[10px] text-slate-500 mt-1 block">
                    If configured, all product images, brand/business logos, and favicons uploaded will be automatically hosted on ImgBB. If blank, falls back to local server-side media storage.
                  </p>
                </div>

                {/* Verification password (MANDATORY) */}
                <div className="md:col-span-2 p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-2xl">
                  <label className="block text-xs font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wide mb-2">
                    Verify Identity (Enter Current Password) *
                  </label>
                  <input
                    type="password"
                    required
                    value={securityForm.currentPassword}
                    onChange={(e) => setSecurityForm({ ...securityForm, currentPassword: e.target.value })}
                    placeholder="••••••••"
                    className="w-full md:w-1/2 px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-850 rounded-xl text-sm"
                  />
                </div>

              </div>

              {/* Submit */}
              <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-3 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-rose-500/15 cursor-pointer disabled:opacity-50 flex items-center gap-2"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>Commit Security Changes</span>
                </button>
              </div>

            </form>
          )}

          {/* ========================================== */}
          {/* SECTION: SYSTEM LOGS AUDITING              */}
          {/* ========================================== */}
          {activeSection === "logs" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center flex-wrap gap-4">
                <h3 className="text-md font-bold font-display flex items-center gap-2">
                  <Terminal className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  Security Audit logs
                </h3>
                <button
                  onClick={fetchLogs}
                  className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 hover:text-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold cursor-pointer transition-colors"
                >
                  Refresh Logs
                </button>
              </div>

              {isLoadingLogs ? (
                <div className="p-12 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-600" />
                </div>
              ) : (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-mono">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                          <th className="p-4">Timestamp</th>
                          <th className="p-4">Module</th>
                          <th className="p-4">Action</th>
                          <th className="p-4">Details Description</th>
                          <th className="p-4 text-right">Auditor IP Hash</th>
                        </tr>
                      </thead>
                      <tbody>
                        {logs.map((log) => (
                          <tr key={log.id} className="border-b last:border-b-0 border-slate-200 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                            <td className="p-4 text-slate-500 whitespace-nowrap">{new Date(log.timestamp).toLocaleString()}</td>
                            <td className="p-4">
                              <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[10px] font-bold">
                                {log.module}
                              </span>
                            </td>
                            <td className="p-4 font-bold text-slate-800 dark:text-slate-200">{log.action}</td>
                            <td className="p-4 text-slate-600 dark:text-slate-400 font-sans">{log.description}</td>
                            <td className="p-4 text-right text-slate-400 font-mono text-[10px]">{log.ipHash}</td>
                          </tr>
                        ))}
                        {logs.length === 0 && (
                          <tr>
                            <td colSpan={5} className="p-8 text-center text-slate-400 italic">No logs recorded yet.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

      </main>

      {/* Custom Delete Confirmation Modals */}
      <AnimatePresence>
        {productToDelete && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setProductToDelete(null)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative bg-white/95 dark:bg-[#0a0a0a]/95 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-3xl p-6 shadow-2xl max-w-md w-full overflow-hidden z-10"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 bg-rose-500/10 dark:bg-rose-500/5 text-rose-600 dark:text-rose-400 border border-rose-500/20 rounded-2xl">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white font-display">Delete Product Record?</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">This action is permanent and cannot be undone.</p>
                </div>
              </div>

              <div className="p-4 bg-rose-500/5 border border-rose-500/10 rounded-2xl mb-6">
                <span className="block text-[10px] font-bold text-rose-500 dark:text-rose-400 uppercase tracking-wider mb-1">Product Name</span>
                <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 font-sans">{productToDelete.title}</span>
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setProductToDelete(null)}
                  className="px-4 py-2.5 bg-black/5 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-semibold text-xs rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleDeleteProduct(productToDelete.id);
                    setProductToDelete(null);
                  }}
                  className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-rose-500/10 transition-all cursor-pointer"
                >
                  Delete Permanently
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {categoryToDelete && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setCategoryToDelete(null)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative bg-white/95 dark:bg-[#0a0a0a]/95 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-3xl p-6 shadow-2xl max-w-md w-full overflow-hidden z-10"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 bg-rose-500/10 dark:bg-rose-500/5 text-rose-600 dark:text-rose-400 border border-rose-500/20 rounded-2xl">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white font-display">Delete Category?</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Are you sure you want to delete this category?</p>
                </div>
              </div>

              <div className="p-4 bg-rose-500/5 border border-rose-500/10 rounded-2xl mb-6">
                <span className="block text-[10px] font-bold text-rose-500 dark:text-rose-400 uppercase tracking-wider mb-1">Category Name</span>
                <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 font-sans">{categoryToDelete.name}</span>
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setCategoryToDelete(null)}
                  className="px-4 py-2.5 bg-black/5 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-semibold text-xs rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleCategoryAction("delete", categoryToDelete.id);
                    setCategoryToDelete(null);
                  }}
                  className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-rose-500/10 transition-all cursor-pointer"
                >
                  Delete Category
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {brandToDelete && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setBrandToDelete(null)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative bg-white/95 dark:bg-[#0a0a0a]/95 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-3xl p-6 shadow-2xl max-w-md w-full overflow-hidden z-10"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 bg-rose-500/10 dark:bg-rose-500/5 text-rose-600 dark:text-rose-400 border border-rose-500/20 rounded-2xl">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white font-display">Delete Brand?</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Are you sure you want to delete this brand?</p>
                </div>
              </div>

              <div className="p-4 bg-rose-500/5 border border-rose-500/10 rounded-2xl mb-6">
                <span className="block text-[10px] font-bold text-rose-500 dark:text-rose-400 uppercase tracking-wider mb-1">Brand Name</span>
                <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 font-sans">{brandToDelete.name}</span>
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setBrandToDelete(null)}
                  className="px-4 py-2.5 bg-black/5 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-semibold text-xs rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleBrandAction("delete", brandToDelete.id);
                    setBrandToDelete(null);
                  }}
                  className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-rose-500/10 transition-all cursor-pointer"
                >
                  Delete Brand
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
