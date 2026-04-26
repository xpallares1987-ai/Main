import { ensureElement } from "../utils/helpers.js";

function ensureId(element, prefix = "sidebar") {
  if (element.id && element.id.trim()) return element.id.trim();
  const id = `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
  element.id = id;
  return id;
}

function normalizeLabel(value, fallback) {
  if (typeof value !== "string" || !value.trim()) return fallback;
  return value.trim();
}

function applySidebarState(sidebarElement, isOpen) {
  if (isOpen) {
    sidebarElement.classList.remove("sidebar--hidden");
    sidebarElement.setAttribute("aria-hidden", "false");
  } else {
    sidebarElement.classList.add("sidebar--hidden");
    sidebarElement.setAttribute("aria-hidden", "true");
  }
}

function applyToggleButtonState(buttonElement, sidebarId, isOpen, labels) {
  if (!buttonElement) return;
  buttonElement.setAttribute("aria-controls", sidebarId);
  buttonElement.setAttribute("aria-expanded", String(isOpen));
  buttonElement.setAttribute("aria-pressed", String(isOpen));
  const nextLabel = isOpen ? labels.hide : labels.show;
  buttonElement.textContent = nextLabel;
  buttonElement.setAttribute("title", nextLabel);
}

export function createSidebar({
  sidebarElement,
  toggleButton = null,
  initialOpen = true,
  labels = {},
  syncOnInit = true,
  onOpen = () => {},
  onClose = () => {},
  onChange = () => {},
} = {}) {
  const sidebar = ensureElement(sidebarElement, "panel lateral");
  const button = toggleButton ? ensureElement(toggleButton, "botón del panel lateral") : null;
  const sidebarId = ensureId(sidebar, "properties-sidebar");
  const safeLabels = {
    show: normalizeLabel(labels.show, "Propiedades"),
    hide: normalizeLabel(labels.hide, "Ocultar propiedades"),
  };
  const state = { open: Boolean(initialOpen) };

  function render() {
    applySidebarState(sidebar, state.open);
    applyToggleButtonState(button, sidebarId, state.open, safeLabels);
  }

  function notify() {
    if (state.open) onOpen();
    else onClose();
    onChange(state.open);
  }

  function setOpen(value, options = {}) {
    const nextValue = Boolean(value);
    const hasChanged = state.open !== nextValue;
    state.open = nextValue;
    render();
    if (hasChanged || options.forceNotify) notify();
    return state.open;
  }

  render();
  if (syncOnInit) notify();

  return {
    open: (opts) => setOpen(true, opts),
    close: (opts) => setOpen(false, opts),
    toggle: (opts) => setOpen(!state.open, opts),
    setOpen,
    isOpen: () => state.open,
    render,
    destroy: () => {
      if (!button) return;
      ["aria-controls", "aria-expanded", "aria-pressed", "title"].forEach(attr => button.removeAttribute(attr));
    },
  };
}
