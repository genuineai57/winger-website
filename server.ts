/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { 
  BusinessSettings, 
  HomepageSettings, 
  Category, 
  Brand, 
  Product, 
  SystemLog, 
  SecuritySettings, 
  DashboardStats 
} from "./src/types";
import {
  seedDatabaseIfNeeded,
  getBusinessSettings,
  getHomepageSettings,
  getSecuritySettings,
  getUsers,
  getCategories,
  getBrands,
  getProducts,
  getLogs,
  saveBusinessSettings,
  saveHomepageSettings,
  saveSecuritySettings,
  saveUser,
  saveCategory,
  deleteCategory,
  saveBrand,
  deleteBrand,
  saveProduct,
  deleteProduct,
  addLog
} from "./src/firebaseService";

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;
const DB_PATH = path.join(process.cwd(), "db.json");
const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads");

// Ensure local uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Memory session store for administrators
// Token -> { userId: string, expiresAt: number }
interface AdminSession {
  userId: string;
  expiresAt: number;
}
const activeSessions = new Map<string, AdminSession>();

// Rate limiting for Access Key and Password logins
// IP -> { count: number, lockedUntil: number }
interface LoginAttempt {
  count: number;
  lockedUntil: number;
}
const loginAttempts = new Map<string, LoginAttempt>();

// Helper: SHA-256 Hashing
function hashValue(val: string): string {
  return crypto.createHash("sha256").update(val).digest("hex");
}

// In-memory cache to support real-time reads and read-only environments gracefully
let dbInMemoryCache: any = null;
let isDbLoaded = false;
let dbLoadPromise: Promise<any> | null = null;

async function loadDbFromFirebase() {
  console.log("[Firebase] Populating local cache from Firestore...");
  try {
    // Seed Firestore with local db.json if database is currently empty
    await seedDatabaseIfNeeded();

    const [business, homepage, security, users, categories, brands, products, logs] = await Promise.all([
      getBusinessSettings(),
      getHomepageSettings(),
      getSecuritySettings(),
      getUsers(),
      getCategories(),
      getBrands(),
      getProducts(),
      getLogs()
    ]);

    dbInMemoryCache = {
      business,
      homepage,
      security,
      users,
      categories,
      brands,
      products,
      logs
    };
    isDbLoaded = true;
    console.log("[Firebase] In-memory database cache fully initialized!");
    return dbInMemoryCache;
  } catch (error: any) {
    console.error("[Firebase] Error loading database from Firestore:", error.message);
    const fallback = {
      users: [],
      security: {
        accessKeyHash: hashValue("secret"),
        sessionTimeout: 60,
        maintenanceMode: false,
        failedAttemptLimit: 5,
        lockoutDuration: 15
      },
      business: {
        businessName: "Premium Catalog",
        whatsappNumber: "255712345678"
      },
      homepage: {},
      categories: [],
      brands: [],
      products: [],
      logs: []
    };
    dbInMemoryCache = fallback;
    isDbLoaded = true;
    return fallback;
  }
}

// Helper: Read Database
function readDb() {
  if (!isDbLoaded || !dbInMemoryCache) {
    if (!dbLoadPromise) {
      dbLoadPromise = loadDbFromFirebase();
    }
  }
  return dbInMemoryCache || {
    users: [],
    security: {
      accessKeyHash: hashValue("secret"),
      sessionTimeout: 60,
      maintenanceMode: false,
      failedAttemptLimit: 5,
      lockoutDuration: 15
    },
    business: {
      businessName: "Premium Catalog",
      whatsappNumber: "255712345678"
    },
    homepage: {},
    categories: [],
    brands: [],
    products: [],
    logs: []
  };
}

// Helper: Write Database
let syncPromise = Promise.resolve();

function writeDb(data: any) {
  dbInMemoryCache = data;
  
  // Update local file backup if possible (gracefully ignore if read-only filesystem)
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), "utf8");
  } catch (e) {
    // Expected on Vercel
  }

  // Queue background synchronization tasks to run sequentially
  syncPromise = syncPromise.then(async () => {
    try {
      console.log("[Firebase] Syncing memory changes to Firestore collections...");
      
      // Sync settings
      if (data.business) await saveBusinessSettings(data.business);
      if (data.homepage) await saveHomepageSettings(data.homepage);
      if (data.security) await saveSecuritySettings(data.security);

      // Sync users
      if (Array.isArray(data.users)) {
        for (const u of data.users) {
          await saveUser(u.id, u);
        }
      }

      // Sync categories (including deletions)
      if (Array.isArray(data.categories)) {
        for (const c of data.categories) {
          await saveCategory(c.id, c);
        }
        const currentCats = await getCategories();
        for (const cc of currentCats) {
          if (!data.categories.some((c: any) => c.id === cc.id)) {
            await deleteCategory(cc.id);
          }
        }
      }

      // Sync brands (including deletions)
      if (Array.isArray(data.brands)) {
        for (const b of data.brands) {
          await saveBrand(b.id, b);
        }
        const currentBrands = await getBrands();
        for (const cb of currentBrands) {
          if (!data.brands.some((b: any) => b.id === cb.id)) {
            await deleteBrand(cb.id);
          }
        }
      }

      // Sync products (including deletions)
      if (Array.isArray(data.products)) {
        for (const p of data.products) {
          await saveProduct(p.id, p);
        }
        const currentProds = await getProducts();
        for (const cp of currentProds) {
          if (!data.products.some((p: any) => p.id === cp.id)) {
            await deleteProduct(cp.id);
          }
        }
      }

      // Sync logs (sync newest 30 logs to optimize writes)
      if (Array.isArray(data.logs)) {
        for (const l of data.logs.slice(0, 30)) {
          await addLog(l);
        }
      }

      console.log("[Firebase] Firestore sync completed successfully!");
    } catch (syncError: any) {
      console.error("[Firebase] Firestore sync task failed:", syncError.message);
    }
  });
}

// Helper: Append Log
function appendLog(action: string, module: string, description: string, req: express.Request) {
  const dbData = readDb();
  const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "unknown";
  const ipHash = hashValue(String(ip)).substring(0, 16);

  const newLog: SystemLog = {
    id: "log-" + Date.now() + "-" + Math.random().toString(36).substring(2, 7),
    action,
    module,
    description,
    timestamp: new Date().toISOString(),
    ipHash
  };

  dbData.logs = dbData.logs || [];
  dbData.logs.unshift(newLog);
  // Keep logs at max 500 records
  if (dbData.logs.length > 500) {
    dbData.logs = dbData.logs.slice(0, 500);
  }
  writeDb(dbData);
}

// Middleware: Parse JSON (increased limit for base64 uploads)
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Middleware to ensure database cache is fully loaded from Firestore before serving requests
app.use("/api", async (req, res, next) => {
  if (!isDbLoaded) {
    if (!dbLoadPromise) {
      dbLoadPromise = loadDbFromFirebase();
    }
    await dbLoadPromise;
  }
  next();
});

// Rate-limiting check helper
function isLockedOut(ip: string): { locked: boolean; message?: string } {
  const attempt = loginAttempts.get(ip);
  if (attempt && attempt.lockedUntil > Date.now()) {
    const minutesLeft = Math.ceil((attempt.lockedUntil - Date.now()) / 60000);
    return { 
      locked: true, 
      message: `Access Temporarily Restricted. Try again in ${minutesLeft} minute(s).` 
    };
  }
  return { locked: false };
}

// Rate-limiting increment helper
function registerFailedAttempt(ip: string) {
  const dbData = readDb();
  const sec = dbData.security;
  const current = loginAttempts.get(ip) || { count: 0, lockedUntil: 0 };
  
  current.count += 1;
  if (current.count >= sec.failedAttemptLimit) {
    current.lockedUntil = Date.now() + (sec.lockoutDuration * 60 * 1000);
    console.log(`IP ${ip} locked out for ${sec.lockoutDuration} minutes.`);
  }
  loginAttempts.set(ip, current);
}

// Rate-limiting reset helper
function resetAttempts(ip: string) {
  loginAttempts.delete(ip);
}

// Middleware: Authenticate Session
function authenticateAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Access Denied. Bearer Token required." });
  }

  const token = authHeader.split(" ")[1];
  const session = activeSessions.get(token);

  if (!session) {
    return res.status(401).json({ error: "Invalid or expired session. Please login again." });
  }

  if (session.expiresAt < Date.now()) {
    activeSessions.delete(token);
    return res.status(401).json({ error: "Session expired. Please login again." });
  }

  // Refresh session expiration on activity
  const dbData = readDb();
  const timeoutMin = dbData.security.sessionTimeout || 60;
  session.expiresAt = Date.now() + (timeoutMin * 60 * 1000);
  activeSessions.set(token, session);

  (req as any).adminUserId = session.userId;
  next();
}

// ==========================================
// PUBLIC ENDPOINTS
// ==========================================

// 1. Get Settings (Business & Homepage & Active Maintenance Status)
app.get("/api/settings", (req, res) => {
  const dbData = readDb();
  
  // Strip sensitive hashes from returned security settings
  const publicSecurity = {
    maintenanceMode: dbData.security.maintenanceMode
  };

  res.json({
    business: dbData.business as BusinessSettings,
    homepage: dbData.homepage as HomepageSettings,
    security: publicSecurity,
    categories: (dbData.categories || []).filter((c: any) => c.isActive !== false) as Category[],
    brands: (dbData.brands || []).filter((b: any) => b.isActive !== false) as Brand[]
  });
});

// Get Active Categories
app.get("/api/categories", (req, res) => {
  const dbData = readDb();
  res.json((dbData.categories || []).filter((c: any) => c.isActive !== false) as Category[]);
});

// Get Active Brands
app.get("/api/brands", (req, res) => {
  const dbData = readDb();
  res.json((dbData.brands || []).filter((b: any) => b.isActive !== false) as Brand[]);
});

// 2. Get Products (Public browse & filters)
app.get("/api/products", (req, res) => {
  const dbData = readDb();
  let productsList: Product[] = dbData.products || [];

  // Exclude internal notes from public view
  const publicProducts = productsList.map(({ internalNotes, ...rest }) => rest);

  res.json(publicProducts);
});

// 3. Get Single Product (Increments views)
app.get("/api/products/:idOrSlug", (req, res) => {
  const dbData = readDb();
  const { idOrSlug } = req.params;

  const productIndex = dbData.products.findIndex(
    (p: any) => p.id === idOrSlug || p.slug === idOrSlug
  );

  if (productIndex === -1) {
    return res.status(404).json({ error: "Product not found" });
  }

  // Increment view count
  dbData.products[productIndex].totalViews += 1;
  writeDb(dbData);

  const product = dbData.products[productIndex];
  
  // In public view, exclude internal notes
  const { internalNotes, ...publicProduct } = product;
  
  res.json(publicProduct);
});

// 4. Register Interaction (WhatsApp Click, Share, Favorite)
app.post("/api/analytics/track", (req, res) => {
  const { productId, type } = req.body; // type: "whatsapp" | "share_winger" | "share_normal" | "copy_specs" | "favorite"
  
  const dbData = readDb();
  const productIndex = dbData.products.findIndex((p: any) => p.id === productId);

  if (productIndex !== -1) {
    if (type === "whatsapp") {
      dbData.products[productIndex].whatsappClicks = (dbData.products[productIndex].whatsappClicks || 0) + 1;
    } else if (type === "share_winger" || type === "share_normal" || type === "copy_specs") {
      dbData.products[productIndex].totalShares = (dbData.products[productIndex].totalShares || 0) + 1;
    } else if (type === "favorite") {
      dbData.products[productIndex].favoritesCount = (dbData.products[productIndex].favoritesCount || 0) + 1;
    }
    writeDb(dbData);
    return res.json({ success: true });
  }

  res.status(404).json({ error: "Product not found" });
});


// ==========================================
// HIDDEN AUTH & SECURITY ENDPOINTS
// ==========================================

// Step 1: Verify Access Key
app.post("/api/auth/verify-access-key", (req, res) => {
  const ip = String(req.headers["x-forwarded-for"] || req.socket.remoteAddress || "unknown");
  
  const lockout = isLockedOut(ip);
  if (lockout.locked) {
    return res.status(423).json({ error: lockout.message });
  }

  const { accessKey } = req.body;
  if (!accessKey) {
    return res.status(400).json({ error: "Access Key is required." });
  }

  const dbData = readDb();
  const hashedInput = hashValue(accessKey);

  if (hashedInput === dbData.security.accessKeyHash) {
    resetAttempts(ip);
    // Return an encrypted/hashed token of the access key indicating successful step 1
    const step1Token = hashValue(accessKey + Date.now().toString()).substring(0, 32);
    return res.json({ success: true, step1Token });
  }

  registerFailedAttempt(ip);
  // Security Mandate: Return a generic access denied message
  res.status(403).json({ error: "Access Denied" });
});

// Step 2: Login Credentials
app.post("/api/auth/login", (req, res) => {
  const ip = String(req.headers["x-forwarded-for"] || req.socket.remoteAddress || "unknown");
  
  const lockout = isLockedOut(ip);
  if (lockout.locked) {
    return res.status(423).json({ error: lockout.message });
  }

  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "Username and Password are required." });
  }

  const dbData = readDb();
  const user = dbData.users.find(
    (u: any) => u.username === username && u.isActive
  );

  if (!user) {
    registerFailedAttempt(ip);
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const passwordHash = hashValue(password);
  if (passwordHash !== user.passwordHash) {
    registerFailedAttempt(ip);
    return res.status(401).json({ error: "Invalid credentials" });
  }

  // Clear attempts
  resetAttempts(ip);

  // Generate secure session token
  const sessionToken = crypto.randomBytes(32).toString("hex");
  const timeoutMin = dbData.security.sessionTimeout || 60;
  
  activeSessions.set(sessionToken, {
    userId: user.id,
    expiresAt: Date.now() + (timeoutMin * 60 * 1000)
  });

  // Log successful login
  appendLog("Login Successful", "Security", `Admin user '${username}' logged in successfully.`, req);

  res.json({
    success: true,
    token: sessionToken,
    user: {
      username: user.username,
      displayName: user.displayName,
      role: user.role
    }
  });
});

// Verify active token (for page refresh persistence)
app.get("/api/auth/verify-token", (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No token supplied." });
  }

  const token = authHeader.split(" ")[1];
  const session = activeSessions.get(token);

  if (!session || session.expiresAt < Date.now()) {
    if (session) activeSessions.delete(token);
    return res.status(401).json({ error: "Session expired." });
  }

  const dbData = readDb();
  const user = dbData.users.find((u: any) => u.id === session.userId);

  if (!user) {
    return res.status(401).json({ error: "User not found." });
  }

  res.json({
    success: true,
    user: {
      username: user.username,
      displayName: user.displayName,
      role: user.role
    }
  });
});


// ==========================================
// SECURE ADMIN ENDPOINTS (Requires authenticateAdmin)
// ==========================================

// 1. Get Security Logs
app.get("/api/admin/logs", authenticateAdmin, (req, res) => {
  const dbData = readDb();
  res.json(dbData.logs || []);
});

// 2. Get Analytics Stats
app.get("/api/admin/analytics", authenticateAdmin, (req, res) => {
  const dbData = readDb();
  const products: Product[] = dbData.products || [];

  // Calculate stats
  const stats: DashboardStats = {
    totalProducts: products.length,
    availableProducts: products.filter(p => p.status === "Available").length,
    soldOutProducts: products.filter(p => p.status === "Sold Out").length,
    lowStockProducts: products.filter(p => p.stockQuantity <= p.lowStockThreshold).length,
    featuredProducts: products.filter(p => p.isFeatured).length,
    hotDealsProducts: products.filter(p => p.isHotDeal).length,
    totalCategories: (dbData.categories || []).length,
    totalBrands: (dbData.brands || []).length,
    totalViews: products.reduce((sum, p) => sum + (p.totalViews || 0), 0),
    totalWhatsAppClicks: products.reduce((sum, p) => sum + (p.whatsappClicks || 0), 0),
    totalShares: products.reduce((sum, p) => sum + (p.totalShares || 0), 0),
    totalFavorites: products.reduce((sum, p) => sum + (p.favoritesCount || 0), 0)
  };

  res.json(stats);
});

// 3. Update Business settings
app.put("/api/admin/settings/business", authenticateAdmin, (req, res) => {
  const dbData = readDb();
  dbData.business = { ...dbData.business, ...req.body };
  writeDb(dbData);
  appendLog("Business Rebranding", "Settings", `Business settings updated dynamically.`, req);
  res.json({ success: true, message: "Business settings saved successfully." });
});

// 4. Update Homepage banner settings
app.put("/api/admin/settings/homepage", authenticateAdmin, (req, res) => {
  const dbData = readDb();
  dbData.homepage = { ...dbData.homepage, ...req.body };
  writeDb(dbData);
  appendLog("Homepage Updated", "Settings", `Homepage hero and limits configuration updated.`, req);
  res.json({ success: true, message: "Homepage configuration saved successfully." });
});

// 5. Update Security parameters
app.get("/api/admin/settings/security", authenticateAdmin, (req, res) => {
  const dbData = readDb();
  const { accessKeyHash, ...safeSecurity } = dbData.security || {};
  res.json({ security: safeSecurity });
});

app.put("/api/admin/settings/security", authenticateAdmin, (req, res) => {
  const dbData = readDb();
  const { currentPassword, newUsername, newPassword, newAccessKey, maintenanceMode, sessionTimeout, failedAttemptLimit, lockoutDuration, imgbbApiKey } = req.body;

  // Find admin user in DB to verify current password
  const adminUserIndex = dbData.users.findIndex((u: any) => u.id === (req as any).adminUserId);
  if (adminUserIndex === -1) {
    return res.status(404).json({ error: "Administrator account not found." });
  }

  // To update security parameters (username, password, access key), verify password first
  const currentPasswordHash = hashValue(currentPassword);
  if (currentPasswordHash !== dbData.users[adminUserIndex].passwordHash) {
    return res.status(403).json({ error: "Incorrect current password verification." });
  }

  // Update Username if supplied
  if (newUsername && newUsername.trim()) {
    dbData.users[adminUserIndex].username = newUsername.trim();
  }

  // Update Password if supplied
  if (newPassword && newPassword.trim()) {
    dbData.users[adminUserIndex].passwordHash = hashValue(newPassword);
  }

  // Update Access Key if supplied
  if (newAccessKey && newAccessKey.trim()) {
    dbData.security.accessKeyHash = hashValue(newAccessKey);
  }

  // Update other settings
  if (maintenanceMode !== undefined) dbData.security.maintenanceMode = !!maintenanceMode;
  if (sessionTimeout !== undefined) dbData.security.sessionTimeout = Number(sessionTimeout);
  if (failedAttemptLimit !== undefined) dbData.security.failedAttemptLimit = Number(failedAttemptLimit);
  if (lockoutDuration !== undefined) dbData.security.lockoutDuration = Number(lockoutDuration);
  if (imgbbApiKey !== undefined) dbData.security.imgbbApiKey = imgbbApiKey.trim();

  writeDb(dbData);
  appendLog("Security Rules Updated", "Security", `Administrator updated security profile and settings.`, req);
  res.json({ success: true, message: "Security profile saved successfully." });
});

// 6. Category Management
app.post("/api/admin/categories", authenticateAdmin, (req, res) => {
  const dbData = readDb();
  const { action, id, name, icon, displayOrder, isActive } = req.body;

  if (action === "create") {
    const newCat: Category = {
      id: "cat-" + Date.now(),
      name,
      icon: icon || "Smartphone",
      displayOrder: displayOrder || ((dbData.categories || []).length + 1),
      isActive: isActive !== undefined ? isActive : true,
      createdAt: new Date().toISOString()
    };
    dbData.categories.push(newCat);
    appendLog("Category Added", "Inventory", `Created category '${name}'`, req);
  } else if (action === "update") {
    const idx = dbData.categories.findIndex((c: any) => c.id === id);
    if (idx !== -1) {
      dbData.categories[idx] = { 
        ...dbData.categories[idx], 
        name: name !== undefined ? name : dbData.categories[idx].name, 
        icon: icon !== undefined ? icon : dbData.categories[idx].icon, 
        displayOrder: displayOrder !== undefined ? displayOrder : dbData.categories[idx].displayOrder, 
        isActive: isActive !== undefined ? isActive : (dbData.categories[idx].isActive !== undefined ? dbData.categories[idx].isActive : true)
      };
      appendLog("Category Updated", "Inventory", `Updated category ID '${id}'`, req);
    }
  } else if (action === "delete") {
    // Check if any products use this category
    const hasProducts = dbData.products.some((p: any) => p.categoryId === id);
    if (hasProducts) {
      return res.status(400).json({ error: "Cannot delete category containing products. Reassign products first." });
    }
    dbData.categories = dbData.categories.filter((c: any) => c.id !== id);
    appendLog("Category Deleted", "Inventory", `Deleted category ID '${id}'`, req);
  } else if (action === "reorder") {
    const { orders } = req.body; // array of { id: string, displayOrder: number }
    orders.forEach((o: any) => {
      const idx = dbData.categories.findIndex((c: any) => c.id === o.id);
      if (idx !== -1) dbData.categories[idx].displayOrder = o.displayOrder;
    });
    // Sort
    dbData.categories.sort((a: any, b: any) => a.displayOrder - b.displayOrder);
  }

  writeDb(dbData);
  res.json({ success: true, categories: dbData.categories });
});

// 7. Brand Management
app.post("/api/admin/brands", authenticateAdmin, (req, res) => {
  const dbData = readDb();
  const { action, id, name, logoUrl, description, isActive } = req.body;

  if (action === "create") {
    const newBrand: Brand = {
      id: "brand-" + Date.now(),
      name,
      logoUrl: logoUrl || "",
      description: description || "",
      isActive: isActive !== undefined ? isActive : true,
      createdAt: new Date().toISOString()
    };
    dbData.brands.push(newBrand);
    appendLog("Brand Added", "Inventory", `Created brand '${name}'`, req);
  } else if (action === "update") {
    const idx = dbData.brands.findIndex((b: any) => b.id === id);
    if (idx !== -1) {
      dbData.brands[idx] = { 
        ...dbData.brands[idx], 
        name: name !== undefined ? name : dbData.brands[idx].name, 
        logoUrl: logoUrl !== undefined ? logoUrl : dbData.brands[idx].logoUrl, 
        description: description !== undefined ? description : dbData.brands[idx].description, 
        isActive: isActive !== undefined ? isActive : (dbData.brands[idx].isActive !== undefined ? dbData.brands[idx].isActive : true)
      };
      appendLog("Brand Updated", "Inventory", `Updated brand ID '${id}'`, req);
    }
  } else if (action === "delete") {
    // Check if any products use this brand
    const hasProducts = dbData.products.some((p: any) => p.brandId === id);
    if (hasProducts) {
      return res.status(400).json({ error: "Cannot delete brand associated with active products." });
    }
    dbData.brands = dbData.brands.filter((b: any) => b.id !== id);
    appendLog("Brand Deleted", "Inventory", `Deleted brand ID '${id}'`, req);
  }

  writeDb(dbData);
  res.json({ success: true, brands: dbData.brands });
});

// 8. Admin Product Management (CRUD + duplicate)
app.get("/api/admin/products", authenticateAdmin, (req, res) => {
  const dbData = readDb();
  res.json(dbData.products || []);
});

app.post("/api/admin/products", authenticateAdmin, (req, res) => {
  const dbData = readDb();
  const productData = req.body;

  const id = "prod-" + Date.now();
  const slug = (productData.title || "").toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-" + Math.random().toString(36).substring(2, 5);

  // Auto-status adjustment based on stock limits
  let status = productData.status || "Available";
  const stock = Number(productData.stockQuantity || 0);
  const lowThreshold = Number(productData.lowStockThreshold || 0);
  if (stock === 0) {
    status = "Sold Out";
  }

  const newProduct: Product = {
    id,
    title: productData.title,
    slug,
    categoryId: productData.categoryId,
    brandId: productData.brandId,
    model: productData.model || "",
    description: productData.description || "",
    sellingPrice: Number(productData.sellingPrice || 0),
    previousPrice: productData.previousPrice ? Number(productData.previousPrice) : undefined,
    stockQuantity: stock,
    lowStockThreshold: lowThreshold,
    condition: productData.condition || "Brand New",
    status,
    coverImage: productData.coverImage || "https://images.unsplash.com/photo-1531297484001-80022131f5a1?auto=format&fit=crop&w=600&q=80",
    images: productData.images || [],
    isFeatured: !!productData.isFeatured,
    isHotDeal: !!productData.isHotDeal,
    totalViews: 0,
    totalShares: 0,
    whatsappClicks: 0,
    favoritesCount: 0,
    specifications: productData.specifications || [],
    internalNotes: productData.internalNotes || "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  dbData.products = dbData.products || [];
  dbData.products.unshift(newProduct);
  writeDb(dbData);
  appendLog("Product Added", "Inventory", `Created product '${newProduct.title}' with Stock: ${stock}.`, req);

  res.json({ success: true, product: newProduct });
});

app.put("/api/admin/products/:id", authenticateAdmin, (req, res) => {
  const dbData = readDb();
  const { id } = req.params;
  const productData = req.body;

  const idx = dbData.products.findIndex((p: any) => p.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: "Product not found" });
  }

  // Auto status adjustment based on stock limits
  let status = productData.status || "Available";
  const stock = Number(productData.stockQuantity || 0);
  if (stock === 0) {
    status = "Sold Out";
  }

  dbData.products[idx] = {
    ...dbData.products[idx],
    title: productData.title,
    categoryId: productData.categoryId,
    brandId: productData.brandId,
    model: productData.model || "",
    description: productData.description || "",
    sellingPrice: Number(productData.sellingPrice || 0),
    previousPrice: productData.previousPrice ? Number(productData.previousPrice) : undefined,
    stockQuantity: stock,
    lowStockThreshold: Number(productData.lowStockThreshold || 0),
    condition: productData.condition || "Brand New",
    status,
    coverImage: productData.coverImage,
    images: productData.images || [],
    isFeatured: !!productData.isFeatured,
    isHotDeal: !!productData.isHotDeal,
    specifications: productData.specifications || [],
    internalNotes: productData.internalNotes || "",
    updatedAt: new Date().toISOString()
  };

  writeDb(dbData);
  appendLog("Product Updated", "Inventory", `Updated product '${productData.title}' details.`, req);

  res.json({ success: true, product: dbData.products[idx] });
});

app.delete("/api/admin/products/:id", authenticateAdmin, (req, res) => {
  const dbData = readDb();
  const { id } = req.params;

  const prod = dbData.products.find((p: any) => p.id === id);
  dbData.products = dbData.products.filter((p: any) => p.id !== id);
  writeDb(dbData);

  appendLog("Product Deleted", "Inventory", `Deleted product '${prod?.title || id}'`, req);
  res.json({ success: true });
});

// Duplication Action
app.post("/api/admin/products/:id/duplicate", authenticateAdmin, (req, res) => {
  const dbData = readDb();
  const { id } = req.params;

  const original = dbData.products.find((p: any) => p.id === id);
  if (!original) {
    return res.status(404).json({ error: "Original product not found." });
  }

  const duplicatedId = "prod-" + Date.now();
  const duplicatedTitle = `${original.title} (Copy)`;
  const duplicatedSlug = duplicatedTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-" + Math.random().toString(36).substring(2, 5);

  const copyProduct: Product = {
    ...original,
    id: duplicatedId,
    title: duplicatedTitle,
    slug: duplicatedSlug,
    totalViews: 0,
    totalShares: 0,
    whatsappClicks: 0,
    favoritesCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  dbData.products.unshift(copyProduct);
  writeDb(dbData);

  appendLog("Product Duplicated", "Inventory", `Duplicated product '${original.title}' as '${duplicatedTitle}'`, req);
  res.json({ success: true, product: copyProduct });
});


// 9. ImgBB Upload Proxy with local fallback
app.post("/api/upload", async (req, res) => {
  const { filename, mimeType, base64 } = req.body;
  
  if (!base64) {
    return res.status(400).json({ error: "Missing image base64 data." });
  }

  const cleanBase64 = base64.replace(/^data:image\/\w+;base64,/, "");

  // Use DB security settings imgbbApiKey if present, otherwise fallback to process.env.IMGBB_API_KEY
  const dbData = readDb();
  const imgbbApiKey = dbData.security?.imgbbApiKey || process.env.IMGBB_API_KEY;

  if (imgbbApiKey && imgbbApiKey !== "MY_IMGBB_API_KEY" && imgbbApiKey !== "YOUR_IMGBB_API_KEY") {
    try {
      // Setup urlencoded query
      const url = `https://api.imgbb.com/1/upload?key=${imgbbApiKey}`;
      const body = new URLSearchParams();
      body.append("image", cleanBase64);

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: body.toString()
      });

      const result: any = await response.json();
      if (result && result.success && result.data && result.data.url) {
        return res.json({ success: true, url: result.data.url });
      } else {
        throw new Error(result.error?.message || "ImgBB returned unsuccessful response.");
      }
    } catch (err: any) {
      console.error("ImgBB upload failed, falling back to local file hosting:", err.message);
      // Fallback to local storage
    }
  }

  // Graceful Local Fallback: Write file to /public/uploads/
  try {
    const ext = mimeType ? mimeType.split("/")[1] : "png";
    const cleanFilename = `${Date.now()}-${(filename || "image").replace(/[^a-zA-Z0-9_\.-]/g, "")}.${ext}`;
    const filePath = path.join(UPLOADS_DIR, cleanFilename);

    fs.writeFileSync(filePath, Buffer.from(cleanBase64, "base64"));
    
    // Return relative url accessible under /uploads/
    const publicUrl = `/uploads/${cleanFilename}`;
    res.json({ success: true, url: publicUrl });
  } catch (err: any) {
    console.error("Local file writing failed:", err);
    res.status(500).json({ error: "Image processing and saving failed: " + err.message });
  }
});


// ==========================================
// DEV SERVER MIDDLEWARE & STANDALONE serving
// ==========================================

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[TanzaTech] Server running successfully on http://localhost:${PORT}`);
  });
}

if (!process.env.VERCEL) {
  startServer();
}

export default app;
