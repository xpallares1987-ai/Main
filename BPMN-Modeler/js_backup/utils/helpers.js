export function safeTrim(value, fallback = "") {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  return trimmed || fallback;
}

export function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

export function ensureElement(element, name = "elemento") {
  if (!element) {
    throw new Error(`No se recibió un ${name} válido`);
  }
  return element;
}

export function getFileNameFromPath(path, fallback = "") {
  if (!isNonEmptyString(path)) return fallback;
  const normalized = path.replace(/\\/g, "/");
  const parts = normalized.split("/");
  return parts[parts.length - 1] || fallback;
}

export function ensureExtension(fileName, extension = ".bpmn") {
  const safeName = safeTrim(fileName, `diagram${extension}`);
  const safeExtension = extension.startsWith(".") ? extension : `.${extension}`;
  return safeName.toLowerCase().endsWith(safeExtension.toLowerCase())
    ? safeName
    : `${safeName}${safeExtension}`;
}

export function debounce(fn, delay = 250) {
  let timer = null;
  return (...args) => {
    window.clearTimeout(timer);
    timer = window.setTimeout(() => {
      fn(...args);
    }, delay);
  };
}

export function throttle(fn, delay = 250) {
  let waiting = false;
  return (...args) => {
    if (waiting) return;
    waiting = true;
    fn(...args);
    window.setTimeout(() => {
      waiting = false;
    }, delay);
  };
}

export function formatError(error, prefix = "Error") {
  if (!error) return prefix;
  if (error instanceof Error && error.message) return `${prefix}: ${error.message}`;
  return `${prefix}: ${String(error)}`;
}
