export function safeTrim(value: any, fallback: string = ""): string {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  return trimmed || fallback;
}

export function isNonEmptyString(value: any): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

export function ensureElement<T extends HTMLElement>(element: T | null, name: string = "elemento"): T {
  if (!element) {
    throw new Error(`No se recibió un ${name} válido`);
  }
  return element;
}

export function getFileNameFromPath(path: string, fallback: string = ""): string {
  if (!isNonEmptyString(path)) return fallback;
  const normalized = path.replace(/\\/g, "/");
  const parts = normalized.split("/");
  return parts[parts.length - 1] || fallback;
}

export function ensureExtension(fileName: string, extension: string = ".bpmn"): string {
  const safeName = safeTrim(fileName, `diagram${extension}`);
  const safeExtension = extension.startsWith(".") ? extension : `.${extension}`;
  return safeName.toLowerCase().endsWith(safeExtension.toLowerCase())
    ? safeName
    : `${safeName}${safeExtension}`;
}

export function debounce(fn: Function, delay: number = 250) {
  let timer: any = null;
  return (...args: any[]) => {
    window.clearTimeout(timer);
    timer = window.setTimeout(() => {
      fn(...args);
    }, delay);
  };
}

export function throttle(fn: Function, delay: number = 250) {
  let waiting = false;
  return (...args: any[]) => {
    if (waiting) return;
    waiting = true;
    fn(...args);
    window.setTimeout(() => {
      waiting = false;
    }, delay);
  };
}

export function formatError(error: any, prefix: string = "Error"): string {
  if (!error) return prefix;
  if (error instanceof Error && error.message) return `${prefix}: ${error.message}`;
  return `${prefix}: ${String(error)}`;
}
