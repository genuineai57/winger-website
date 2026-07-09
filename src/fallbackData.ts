/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BusinessSettings, HomepageSettings, Category, Brand, Product } from "./types";

export const DEFAULT_BUSINESS_SETTINGS: BusinessSettings = {
  businessName: "TanzaTech Premium",
  tagline: "Your Ultimate Technology Partner in Tanzania",
  logoUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=200&h=200&q=80",
  faviconUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=32&h=32&q=80",
  whatsappNumber: "255712345678",
  email: "sales@tanzatech.co.tz",
  physicalAddress: "Mlimani City Mall, Wing B, Dar es Salaam, Tanzania",
  googleMapsUrl: "https://maps.google.com/?q=Mlimani+City+Dar+es+Salaam",
  facebookUrl: "https://facebook.com/tanzatech",
  instagramUrl: "https://instagram.com/tanzatech",
  tiktokUrl: "https://tiktok.com/@tanzatech",
  youtubeUrl: "https://youtube.com/tanzatech",
  twitterUrl: "https://twitter.com/tanzatech",
  websiteUrl: "https://tanzatech.co.tz",
  footerText: "© 2026 TanzaTech Premium. Providing top-tier electronics, professional customer showcase & broker-friendly marketing support. Located in Dar es Salaam."
};

export const DEFAULT_HOMEPAGE_SETTINGS: HomepageSettings = {
  heroTitle: "Find the Best Smartphones, Laptops & Accessories",
  heroSubtitle: "Browse genuine premium tech at competitive prices. Contact our sales team directly on WhatsApp or copy price-free specs instantly to share with your clients.",
  heroBackground: "https://images.unsplash.com/photo-1531297484001-80022131f5a1?auto=format&fit=crop&w=1600&q=80",
  primaryButtonText: "Browse Catalog",
  secondaryButtonText: "Contact Sales",
  featuredLimit: 6,
  newArrivalsLimit: 6,
  hotDealsLimit: 6
};

export const DEFAULT_CATEGORIES: Category[] = [
  {
    id: "cat-smartphones",
    name: "Smartphones",
    icon: "Smartphone",
    displayOrder: 1,
    isActive: true,
    createdAt: "2026-06-29T12:00:00Z"
  },
  {
    id: "cat-laptops",
    name: "Laptops",
    icon: "Laptop",
    displayOrder: 2,
    isActive: true,
    createdAt: "2026-06-29T12:00:00Z"
  },
  {
    id: "cat-accessories",
    name: "Accessories",
    icon: "Headphones",
    displayOrder: 3,
    isActive: true,
    createdAt: "2026-06-29T12:00:00Z"
  }
];

export const DEFAULT_BRANDS: Brand[] = [
  {
    id: "brand-apple",
    name: "Apple",
    logoUrl: "https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?auto=format&fit=crop&w=100&h=100&q=80",
    description: "Premium iOS devices and MacBooks.",
    isActive: true,
    createdAt: "2026-06-29T12:00:00Z"
  },
  {
    id: "brand-samsung",
    name: "Samsung",
    logoUrl: "https://images.unsplash.com/photo-1610792516307-ea5acd9c3b00?auto=format&fit=crop&w=100&h=100&q=80",
    description: "Leading Android innovation.",
    isActive: true,
    createdAt: "2026-06-29T12:00:00Z"
  },
  {
    id: "brand-dell",
    name: "Dell",
    logoUrl: "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=100&h=100&q=80",
    description: "Reliable enterprise laptops and PCs.",
    isActive: true,
    createdAt: "2026-06-29T12:00:00Z"
  },
  {
    id: "brand-hp",
    name: "HP",
    logoUrl: "https://images.unsplash.com/photo-1589561084283-930aa7b1ce50?auto=format&fit=crop&w=100&h=100&q=80",
    description: "Stylish and high performance PCs.",
    isActive: true,
    createdAt: "2026-06-29T12:00:00Z"
  },
  {
    id: "brand-sony",
    name: "Sony",
    logoUrl: "https://images.unsplash.com/photo-1608248597481-496100c80836?auto=format&fit=crop&w=100&h=100&q=80",
    description: "Industry-leading audio products and gear.",
    isActive: true,
    createdAt: "2026-06-29T12:00:00Z"
  }
];

export const DEFAULT_PRODUCTS: Product[] = [
  {
    id: "prod-iphone15pro",
    title: "iPhone 15 Pro Max",
    slug: "iphone-15-pro-max",
    categoryId: "cat-smartphones",
    brandId: "brand-apple",
    model: "iPhone 15 Pro Max",
    description: "The titanium masterpiece with 5x optical zoom camera. Powered by the incredibly fast A17 Pro chip for outstanding mobile computing power, dynamic island multitasking, and beautiful aerospace-grade build quality.",
    sellingPrice: 3450000,
    previousPrice: 3800000,
    stockQuantity: 12,
    lowStockThreshold: 3,
    condition: "Brand New",
    status: "Available",
    coverImage: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=600&q=80",
    images: [
      "https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1695048132930-b3b4f69eb1d2?auto=format&fit=crop&w=600&q=80"
    ],
    isFeatured: true,
    isHotDeal: true,
    totalViews: 142,
    totalShares: 28,
    whatsappClicks: 19,
    favoritesCount: 11,
    specifications: [
      { name: "RAM", value: "8GB" },
      { name: "Storage", value: "256GB" },
      { name: "Processor", value: "Apple A17 Pro" },
      { name: "Display", value: "6.7-inch Super Retina XDR OLED" },
      { name: "Battery", value: "4441 mAh with fast charge" },
      { name: "Camera", value: "48MP + 12MP + 12MP Triple Setup" },
      { name: "Operating System", value: "iOS 17" }
    ],
    createdAt: "2026-06-29T10:00:00Z",
    updatedAt: "2026-06-29T12:00:00Z"
  },
  {
    id: "prod-s24ultra",
    title: "Samsung Galaxy S24 Ultra",
    slug: "samsung-galaxy-s24-ultra",
    categoryId: "cat-smartphones",
    brandId: "brand-samsung",
    model: "Galaxy S24 Ultra",
    description: "The ultimate Android flagship with Galaxy AI capabilities, 200MP ultra-clear lens, built-in S-Pen, and Snapdragon 8 Gen 3 processor for superb multi-tasking and premium performance.",
    sellingPrice: 3200000,
    previousPrice: 3500000,
    stockQuantity: 8,
    lowStockThreshold: 2,
    condition: "Brand New",
    status: "Available",
    coverImage: "https://images.unsplash.com/photo-1610792516307-ea5acd9c3b00?auto=format&fit=crop&w=600&q=80",
    images: [
      "https://images.unsplash.com/photo-1610792516307-ea5acd9c3b00?auto=format&fit=crop&w=600&q=80"
    ],
    isFeatured: true,
    isHotDeal: false,
    totalViews: 98,
    totalShares: 15,
    whatsappClicks: 8,
    favoritesCount: 6,
    specifications: [
      { name: "RAM", value: "12GB" },
      { name: "Storage", value: "512GB" },
      { name: "Processor", value: "Snapdragon 8 Gen 3" },
      { name: "Display", value: "6.8-inch Dynamic AMOLED 2X 120Hz" },
      { name: "Battery", value: "5000 mAh with 45W fast charge" },
      { name: "Camera", value: "200MP + 50MP + 12MP + 10MP Quad" },
      { name: "Operating System", value: "Android 14 (One UI 6.1)" }
    ],
    createdAt: "2026-06-29T09:00:00Z",
    updatedAt: "2026-06-29T11:00:00Z"
  },
  {
    id: "prod-macbookpro",
    title: "MacBook Pro 14\" M3 Max",
    slug: "macbook-pro-14-m3-max",
    categoryId: "cat-laptops",
    brandId: "brand-apple",
    model: "MacBook Pro 14 (Late 2023)",
    description: "Powerhouse laptop for creative professionals and software engineers. Liquid Retina XDR screen with up to 120Hz ProMotion technology and stunning power efficiency.",
    sellingPrice: 6800000,
    previousPrice: 7200000,
    stockQuantity: 4,
    lowStockThreshold: 1,
    condition: "Brand New",
    status: "Available",
    coverImage: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=600&q=80",
    images: [
      "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=600&q=80"
    ],
    isFeatured: true,
    isHotDeal: true,
    totalViews: 204,
    totalShares: 42,
    whatsappClicks: 12,
    favoritesCount: 18,
    specifications: [
      { name: "RAM", value: "36GB" },
      { name: "Storage", value: "1TB SSD" },
      { name: "Processor", value: "Apple M3 Max" },
      { name: "Display", value: "14.2-inch Liquid Retina XDR" },
      { name: "Battery", value: "72.4-watt-hour battery" }
    ],
    createdAt: "2026-06-29T08:00:00Z",
    updatedAt: "2026-06-29T10:00:00Z"
  }
];
