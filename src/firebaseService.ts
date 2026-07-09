/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  getDocs, 
  deleteDoc,
  setLogLevel
} from "firebase/firestore";
import fs from "fs";
import path from "path";
import { BusinessSettings, HomepageSettings, Category, Brand, Product, SystemLog } from "./types";

// Load firebase-applet-config.json
const configPath = path.join(process.cwd(), "firebase-applet-config.json");
let firebaseConfig: any = {};

if (fs.existsSync(configPath)) {
  try {
    firebaseConfig = JSON.parse(fs.readFileSync(configPath, "utf8"));
  } catch (e) {
    console.error("[Firebase] Failed to parse firebase-applet-config.json:", e);
  }
}

// Fallback to env variables if config is not present or partial
const finalConfig = {
  apiKey: firebaseConfig.apiKey || process.env.FIREBASE_API_KEY || "AIzaSyAAwHKGDgTJj6-p23zFxGQotixygOFKDMA",
  authDomain: firebaseConfig.authDomain || process.env.FIREBASE_AUTH_DOMAIN || "delta-rain-494408-s5.firebaseapp.com",
  projectId: firebaseConfig.projectId || process.env.FIREBASE_PROJECT_ID || "delta-rain-494408-s5",
  storageBucket: firebaseConfig.storageBucket || process.env.FIREBASE_STORAGE_BUCKET || "delta-rain-494408-s5.firebasestorage.app",
  messagingSenderId: firebaseConfig.messagingSenderId || process.env.FIREBASE_MESSAGING_SENDER_ID || "1039802765385",
  appId: firebaseConfig.appId || process.env.FIREBASE_APP_ID || "1:1039802765385:web:78292010d7b900fa81af98",
  databaseId: firebaseConfig.firestoreDatabaseId || process.env.FIREBASE_DATABASE_ID || "ai-studio-productcatalogpl-62b97f7c-a96e-4a61-8371-91ab6c6d79db"
};

const app = initializeApp({
  apiKey: finalConfig.apiKey,
  authDomain: finalConfig.authDomain,
  projectId: finalConfig.projectId,
  storageBucket: finalConfig.storageBucket,
  messagingSenderId: finalConfig.messagingSenderId,
  appId: finalConfig.appId
});

// Pass the custom firestoreDatabaseId
export const db = getFirestore(app, finalConfig.databaseId);

// Suppress harmless stream idle timeout warning logs in Node environment
setLogLevel("error");

/**
 * Seeds the Firestore database from the local db.json if the database is empty
 */
export async function seedDatabaseIfNeeded() {
  try {
    const businessDocRef = doc(db, "settings", "business");
    const businessSnap = await getDoc(businessDocRef);
    if (businessSnap.exists()) {
      console.log("[Firebase] Firestore is already seeded.");
      return;
    }

    console.log("[Firebase] Empty Firestore detected. Seeding data...");
    let localData: any = null;
    const dbJsonPath = path.join(process.cwd(), "db.json");
    if (fs.existsSync(dbJsonPath)) {
      try {
        localData = JSON.parse(fs.readFileSync(dbJsonPath, "utf8"));
      } catch (err) {
        console.error("[Firebase] Failed to parse db.json for seeding:", err);
      }
    }

    if (!localData) {
      console.log("[Firebase] No db.json found or failed to load. Seeding skipped.");
      return;
    }

    // Seed Settings documents
    if (localData.business) {
      await setDoc(doc(db, "settings", "business"), localData.business);
    }
    if (localData.homepage) {
      await setDoc(doc(db, "settings", "homepage"), localData.homepage);
    }
    if (localData.security) {
      await setDoc(doc(db, "settings", "security"), localData.security);
    }

    // Seed Users
    if (Array.isArray(localData.users)) {
      for (const u of localData.users) {
        await setDoc(doc(db, "users", u.id), u);
      }
    }

    // Seed Categories
    if (Array.isArray(localData.categories)) {
      for (const c of localData.categories) {
        await setDoc(doc(db, "categories", c.id), c);
      }
    }

    // Seed Brands
    if (Array.isArray(localData.brands)) {
      for (const b of localData.brands) {
        await setDoc(doc(db, "brands", b.id), b);
      }
    }

    // Seed Products
    if (Array.isArray(localData.products)) {
      for (const p of localData.products) {
        await setDoc(doc(db, "products", p.id), p);
      }
    }

    // Seed Logs
    if (Array.isArray(localData.logs)) {
      for (const l of localData.logs) {
        await setDoc(doc(db, "logs", l.id), l);
      }
    }

    console.log("[Firebase] Firestore database seeded successfully with existing data!");
  } catch (err) {
    console.error("[Firebase] Database seeding encountered an error:", err);
  }
}

// ==========================================
// BUSINESS SETTINGS
// ==========================================
export async function getBusinessSettings(): Promise<BusinessSettings> {
  const ref = doc(db, "settings", "business");
  const snap = await getDoc(ref);
  return snap.exists() ? (snap.data() as BusinessSettings) : {} as BusinessSettings;
}

export async function saveBusinessSettings(data: BusinessSettings) {
  await setDoc(doc(db, "settings", "business"), data, { merge: true });
}

// ==========================================
// HOMEPAGE SETTINGS
// ==========================================
export async function getHomepageSettings(): Promise<HomepageSettings> {
  const ref = doc(db, "settings", "homepage");
  const snap = await getDoc(ref);
  return snap.exists() ? (snap.data() as HomepageSettings) : {} as HomepageSettings;
}

export async function saveHomepageSettings(data: HomepageSettings) {
  await setDoc(doc(db, "settings", "homepage"), data, { merge: true });
}

// ==========================================
// SECURITY CONFIGURATION
// ==========================================
export async function getSecuritySettings(): Promise<any> {
  const ref = doc(db, "settings", "security");
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data() : {};
}

export async function saveSecuritySettings(data: any) {
  await setDoc(doc(db, "settings", "security"), data, { merge: true });
}

// ==========================================
// USERS (AUTHENTICATION)
// ==========================================
export async function getUsers(): Promise<any[]> {
  const colRef = collection(db, "users");
  const snap = await getDocs(colRef);
  return snap.docs.map(d => d.data());
}

export async function saveUser(id: string, data: any) {
  await setDoc(doc(db, "users", id), data, { merge: true });
}

// ==========================================
// CATEGORIES
// ==========================================
export async function getCategories(): Promise<Category[]> {
  const colRef = collection(db, "categories");
  const snap = await getDocs(colRef);
  const list = snap.docs.map(d => d.data() as Category);
  return list.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
}

export async function saveCategory(id: string, data: Category) {
  await setDoc(doc(db, "categories", id), data);
}

export async function deleteCategory(id: string) {
  await deleteDoc(doc(db, "categories", id));
}

// ==========================================
// BRANDS
// ==========================================
export async function getBrands(): Promise<Brand[]> {
  const colRef = collection(db, "brands");
  const snap = await getDocs(colRef);
  return snap.docs.map(d => d.data() as Brand);
}

export async function saveBrand(id: string, data: Brand) {
  await setDoc(doc(db, "brands", id), data);
}

export async function deleteBrand(id: string) {
  await deleteDoc(doc(db, "brands", id));
}

// ==========================================
// PRODUCTS
// ==========================================
export async function getProducts(): Promise<Product[]> {
  const colRef = collection(db, "products");
  const snap = await getDocs(colRef);
  return snap.docs.map(d => d.data() as Product);
}

export async function saveProduct(id: string, data: Product) {
  await setDoc(doc(db, "products", id), data);
}

export async function deleteProduct(id: string) {
  await deleteDoc(doc(db, "products", id));
}

// ==========================================
// LOGS (SYSTEM AUDIT)
// ==========================================
export async function getLogs(): Promise<SystemLog[]> {
  const colRef = collection(db, "logs");
  const snap = await getDocs(colRef);
  const list = snap.docs.map(d => d.data() as SystemLog);
  return list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export async function addLog(log: SystemLog) {
  await setDoc(doc(db, "logs", log.id), log);
}
