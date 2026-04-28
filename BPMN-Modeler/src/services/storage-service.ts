async function getEncryptionKey(pin: string) {
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
      salt: enc.encode("bpmn-modeler-salt"),
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
  const key = await getEncryptionKey(pin);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encodedToken = new TextEncoder().encode(token);
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encodedToken
  );
  
  const combined = new Uint8Array(iv.length + ciphertext.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(ciphertext), iv.length);
  
  return btoa(String.fromCharCode(...combined));
}

export async function decryptToken(encrypted: string, pin: string): Promise<string> {
  try {
    const combined = new Uint8Array(atob(encrypted).split("").map(c => c.charCodeAt(0)));
    const iv = combined.slice(0, 12);
    const ciphertext = combined.slice(12);
    const key = await getEncryptionKey(pin);
    
    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      key,
      ciphertext
    );
    
    return new TextDecoder().decode(decrypted);
  } catch (e) {
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
  } catch (error) {
    return false;
  }
}

function safeSetItem(key: string, value: string): boolean {
  if (!isStorageAvailable()) return false;
  try {
    window.localStorage.setItem(key, value);
    return true;
  } catch (error) {
    return false;
  }
}

function safeGetItem(key: string): string | null {
  if (!isStorageAvailable()) return null;
  try {
    return window.localStorage.getItem(key);
  } catch (error) {
    return null;
  }
}

export function saveUiSession(keys: any, uiState: any = {}) {
  if (!keys.uiState) return false;
  const payload = JSON.stringify({
    propertiesPanelOpen: Boolean(uiState.propertiesPanelOpen),
  });
  return safeSetItem(keys.uiState, payload);
}

export function loadUiSession(keys: any) {
  if (!keys.uiState) return null;
  const raw = safeGetItem(keys.uiState);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return {
      propertiesPanelOpen: Boolean(parsed.propertiesPanelOpen),
    };
  } catch (error) {
    return null;
  }
}


