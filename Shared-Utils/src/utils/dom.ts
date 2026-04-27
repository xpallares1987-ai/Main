/**
 * Common DOM and String Utilities
 */

export function qs<T extends HTMLElement>(selector: string, context: HTMLElement | Document = document): T | null {
  return context.querySelector(selector) as T | null;
}

export function qsa(selector: string, context: HTMLElement | Document = document): NodeListOf<HTMLElement> {
  return context.querySelectorAll(selector);
}

export function on(element: HTMLElement | Window | Document | null, event: string, handler: any, options?: any): Function {
  if (!element) return () => {};
  element.addEventListener(event, handler, options);
  return () => element.removeEventListener(event, handler, options);
}

export function escapeHTML(str: string): string {
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

export function debounce(fn: Function, delay: number = 250) {
    let timeoutId: any;
    return (...args: any[]) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => fn(...args), delay);
    };
}

export function throttle(fn: Function, delay: number = 250) {
    let waiting = false;
    return (...args: any[]) => {
      if (waiting) return;
      waiting = true;
      fn(...args);
      setTimeout(() => {
        waiting = false;
      }, delay);
    };
}

export function ensureExtension(fileName: string, ext: string = ".bpmn"): string {
    const safeName = safeTrim(fileName, `file${ext}`);
    return safeName.toLowerCase().endsWith(ext.toLowerCase()) ? safeName : `${safeName}${ext}`;
}

export function formatError(error: any, prefix = "Error"): string {
    const msg = error instanceof Error ? error.message : String(error);
    return `${prefix}: ${msg}`;
}

export function safeTrim(str: any, fallback: string): string {
    if (typeof str !== "string") return fallback;
    const trimmed = str.trim();
    return trimmed.length > 0 ? trimmed : fallback;
}

export function ensureElement<T extends HTMLElement>(element: T | null, name: string = "element"): T {
    if (!element) throw new Error(`No valid ${name} provided`);
    return element;
}

export function getFileNameFromPath(path: string, fallback: string = ""): string {
    if (!path || typeof path !== "string") return fallback;
    const parts = path.replace(/\\/g, "/").split("/");
    return parts[parts.length - 1] || fallback;
}
