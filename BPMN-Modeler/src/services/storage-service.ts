import { db } from "./local-db";
import { DiagramTab } from "../types";

async function getEncryptionKey(pin: string, salt: Uint8Array) {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(pin),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      salt: salt as any,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

export async function encryptToken(token: string, pin: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await getEncryptionKey(pin, salt);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encodedToken = new TextEncoder().encode(token);
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encodedToken
  );
  
  const combined = new Uint8Array(salt.length + iv.length + ciphertext.byteLength);
  combined.set(salt);
  combined.set(iv, salt.length);
  combined.set(new Uint8Array(ciphertext), salt.length + iv.length);
  
  return btoa(String.fromCharCode(...combined));
}

export async function decryptToken(encrypted: string, pin: string): Promise<string> {
  try {
    const combined = new Uint8Array(atob(encrypted).split("").map(c => c.charCodeAt(0)));
    const salt = combined.slice(0, 16);
    const iv = combined.slice(16, 28);
    const ciphertext = combined.slice(28);
    const key = await getEncryptionKey(pin, salt);
    
    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      key,
      ciphertext
    );
    
    return new TextDecoder().decode(decrypted);
  } catch {
    throw new Error("PIN incorrecto o datos corruptos");
  }
}

function isStorageAvailable(): boolean {
  try {
    const storage = window.localStorage;
    const testKey = "__mi_aplicacion_test__";
    storage.setItem(testKey, "1");
    storage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

function safeSetItem(key: string, value: string): boolean {
  if (!isStorageAvailable()) return false;
  try {
    window.localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

function safeGetItem(key: string): string | null {
  if (!isStorageAvailable()) return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export interface StorageKeys {
  diagramXml: string;
  diagramName: string;
  uiState: string;
  appConfig: string;
  elementTemplates: string;
  githubToken: string;
  gistId: string;
  tabsState: string;
}

export function saveUiSession(keys: StorageKeys, uiState: { propertiesPanelOpen?: boolean } = {}) {
  if (!keys.uiState) return false;
  const payload = JSON.stringify({
    propertiesPanelOpen: Boolean(uiState.propertiesPanelOpen),
  });
  return safeSetItem(keys.uiState, payload);
}

export function loadUiSession(keys: StorageKeys) {
  if (!keys.uiState) return null;
  const raw = safeGetItem(keys.uiState);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return {
      propertiesPanelOpen: Boolean(parsed.propertiesPanelOpen),
    };
  } catch {
    return null;
  }
}

export async function saveTabsSession(
  keys: StorageKeys,
  tabs: DiagramTab[],
  activeTabId: string,
) {
  if (!keys.tabsState) return false;
  const payload = { tabs, activeTabId };
  await db.set(keys.tabsState, payload);
  return true;
}

export async function loadTabsSession(keys: StorageKeys): Promise<{
  tabs: DiagramTab[];
  activeTabId: string;
} | null> {
  if (!keys.tabsState) return null;
  try {
    return await db.get(keys.tabsState, null);
  } catch {
    return null;
  }
}
