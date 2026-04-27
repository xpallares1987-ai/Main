/**
 * Common DOM and String Utilities
 */
export function qs(selector, context = document) {
    return context.querySelector(selector);
}
export function qsa(selector, context = document) {
    return context.querySelectorAll(selector);
}
export function on(element, event, handler, options) {
    if (!element)
        return () => { };
    element.addEventListener(event, handler, options);
    return () => element.removeEventListener(event, handler, options);
}
export function escapeHTML(str) {
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
export function debounce(fn, delay = 250) {
    let timeoutId;
    return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn(...args), delay);
    };
}
export function throttle(fn, delay = 250) {
    let waiting = false;
    return (...args) => {
        if (waiting)
            return;
        waiting = true;
        fn(...args);
        setTimeout(() => {
            waiting = false;
        }, delay);
    };
}
export function ensureExtension(fileName, ext = ".bpmn") {
    const safeName = safeTrim(fileName, `file${ext}`);
    return safeName.toLowerCase().endsWith(ext.toLowerCase()) ? safeName : `${safeName}${ext}`;
}
export function formatError(error, prefix = "Error") {
    const msg = error instanceof Error ? error.message : String(error);
    return `${prefix}: ${msg}`;
}
export function safeTrim(str, fallback) {
    if (typeof str !== "string")
        return fallback;
    const trimmed = str.trim();
    return trimmed.length > 0 ? trimmed : fallback;
}
export function ensureElement(element, name = "element") {
    if (!element)
        throw new Error(`No valid ${name} provided`);
    return element;
}
export function getFileNameFromPath(path, fallback = "") {
    if (!path || typeof path !== "string")
        return fallback;
    const parts = path.replace(/\\/g, "/").split("/");
    return parts[parts.length - 1] || fallback;
}
export function hexToRgbA(hex, alpha = 1) {
    let r = 0, g = 0, b = 0;
    if (hex.length === 4) {
        r = parseInt(hex[1] + hex[1], 16);
        g = parseInt(hex[2] + hex[2], 16);
        b = parseInt(hex[3] + hex[3], 16);
    }
    else if (hex.length === 7) {
        r = parseInt(hex[1] + hex[2], 16);
        g = parseInt(hex[3] + hex[4], 16);
        b = parseInt(hex[5] + hex[6], 16);
    }
    return `rgba(${r},${g},${b},${alpha})`;
}
