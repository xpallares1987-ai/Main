import { ensureElement } from "../utils/helpers.js";

function bindClick(element, handler) {
  if (typeof handler !== "function") return () => {};
  element.addEventListener("click", handler);
  return () => element.removeEventListener("click", handler);
}

export function createToolbar(elements = {}, handlers = {}) {
  const btns = {
    btnNew: ensureElement(elements.btnNew, "botón Nuevo"),
    btnOpen: ensureElement(elements.btnOpen, "botón Abrir"),
    btnSave: ensureElement(elements.btnSave, "botón Guardar"),
    btnExport: ensureElement(elements.btnExport, "botón Exportar"),
    btnTheme: ensureElement(elements.btnTheme, "botón Tema"),
    btnShortcuts: ensureElement(elements.btnShortcuts, "botón Atajos"),
    btnCloud: ensureElement(elements.btnCloud, "botón Nube"),
    btnLogistics: ensureElement(elements.btnLogistics, "botón Logística"),
    btnFit: ensureElement(elements.btnFit, "botón Ajustar"),
    btnZoomIn: ensureElement(elements.btnZoomIn, "botón Zoom +"),
    btnZoomOut: ensureElement(elements.btnZoomOut, "botón Zoom -"),
    btnToggleProperties: ensureElement(elements.btnToggleProperties, "botón Propiedades"),
  };

  const cleanups = [
    bindClick(btns.btnNew, handlers.onNew),
    bindClick(btns.btnOpen, handlers.onOpen),
    bindClick(btns.btnSave, handlers.onSave),
    bindClick(btns.btnExport, handlers.onExport),
    bindClick(btns.btnTheme, handlers.onTheme),
    bindClick(btns.btnShortcuts, handlers.onShortcuts),
    bindClick(btns.btnCloud, handlers.onCloud),
    bindClick(btns.btnLogistics, handlers.onLogistics),
    bindClick(btns.btnFit, handlers.onFit),
    bindClick(btns.btnZoomIn, handlers.onZoomIn),
    bindClick(btns.btnZoomOut, handlers.onZoomOut),
    bindClick(btns.btnToggleProperties, handlers.onToggleProperties),
  ];

  return {
    destroy: () => cleanups.forEach(cleanup => cleanup()),
  };
}
