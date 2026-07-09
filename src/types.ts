/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface BusinessSettings {
  businessName: string;
  tagline: string;
  logoUrl: string;
  faviconUrl: string;
  whatsappNumber: string;
  email: string;
  physicalAddress: string;
  googleMapsUrl: string;
  facebookUrl: string;
  instagramUrl: string;
  tiktokUrl: string;
  youtubeUrl: string;
  twitterUrl: string;
  websiteUrl: string;
  footerText: string;
}

export interface HomepageSettings {
  heroTitle: string;
  heroSubtitle: string;
  heroBackground: string;
  primaryButtonText: string;
  secondaryButtonText: string;
  featuredLimit: number;
  newArrivalsLimit: number;
  hotDealsLimit: number;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
}

export interface Brand {
  id: string;
  name: string;
  logoUrl: string;
  description: string;
  isActive: boolean;
  createdAt: string;
}

export interface ProductSpecification {
  name: string;
  value: string;
}

export type ProductCondition = "Brand New" | "Used" | "Refurbished" | "Open Box";
export type ProductStatus = "Available" | "Coming Soon" | "Sold Out";

export interface Product {
  id: string;
  title: string;
  slug: string;
  categoryId: string;
  brandId: string;
  model: string;
  description: string;
  sellingPrice: number;
  previousPrice?: number;
  stockQuantity: number;
  lowStockThreshold: number;
  condition: ProductCondition;
  status: ProductStatus;
  coverImage: string;
  images: string[];
  isFeatured: boolean;
  isHotDeal: boolean;
  totalViews: number;
  totalShares: number;
  whatsappClicks: number;
  favoritesCount: number;
  specifications: ProductSpecification[];
  internalNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SystemLog {
  id: string;
  action: string;
  module: string;
  description: string;
  timestamp: string;
  ipHash: string;
}

export interface SecuritySettings {
  accessKeyHash: string;
  sessionTimeout: number; // in minutes
  maintenanceMode: boolean;
  failedAttemptLimit: number;
  lockoutDuration: number; // in minutes
}

export interface DashboardStats {
  totalProducts: number;
  availableProducts: number;
  soldOutProducts: number;
  lowStockProducts: number;
  featuredProducts: number;
  hotDealsProducts: number;
  totalCategories: number;
  totalBrands: number;
  totalViews: number;
  totalWhatsAppClicks: number;
  totalShares: number;
  totalFavorites: number;
}
