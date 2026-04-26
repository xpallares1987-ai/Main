import APP_CONFIG from "./config.js";
import {
  attachPropertiesPanel,
  createModeler,
  destroyModeler,
  detachPropertiesPanel,
  fitViewport,
  importDiagram,
  zoomByStep,
} from "./services/modeler-service.js";
import { exportToPng } from "./services/export-service.js";
import { saveToGitHub } from "./services/cloud-service.js";
import {
  loadDiagramSession,
  loadUiSession,
  saveDiagramSession,
  saveUiSession,
} from "./services/storage-service.js";
import {
  downloadXmlFile,
  getDiagramXml,
  loadXmlFromUrl,
  openLocalXmlFromInput,
} from "./services/xml-service.js";
import { setDiagramName } from "./ui/render.js";
import { createSidebar } from "./ui/sidebar.js";
import { createStatusbar } from "./ui/statusbar.js";
import { createToolbar } from "./ui/toolbar.js";
import { on, qs } from "./utils/dom.js";
import {
  debounce,
  ensureExtension,
  formatError,
  getFileNameFromPath,
  safeTrim,
  throttle,
} from "./utils/helpers.js";

const state = {
  modeler: null,
  diagramName: "",
  hasUnsavedChanges: false,
  propertiesPanelOpen: APP_CONFIG.ui.propertiesPanelOpen,
  theme: localStorage.getItem("theme") || "light",
  toolbar: null,
  sidebar: null,
  cleanups: [],
};

const ui = resolveUi(APP_CONFIG.selectors);

const statusbar = createStatusbar({
  statusElement: ui.statusText,
  selectionElement: ui.selectionText,
});

function resolveUi(selectors) {
  return Object.entries(selectors).reduce((acc, [key, selector]) => {
    const element = qs(selector);
    if (!element) {
      throw new Error(`No se encontró el elemento requerido: ${selector}`);
    }
    acc[key] = element;
    return acc;
  }, {});
}

function getDefaultDiagramName() {
  return getFileNameFromPath(
    APP_CONFIG.paths.defaultDiagram,
    APP_CONFIG.download.defaultFileName
  );
}

function getSafeDiagramName(name) {
  const trimmed = safeTrim(name, APP_CONFIG.download.defaultFileName);
  return ensureExtension(trimmed, ".bpmn");
}

function getSelectionLabel(element) {
  if (!element) return APP_CONFIG.ui.statusNoSelection;
  const type = safeTrim(String(element.type || "Elemento").replace("bpmn:", ""), "Elemento");
  const name = safeTrim(element.businessObject?.name, "");
  return name ? `${type}: ${name}` : type;
}

function updateDirtyState(isDirty) {
  state.hasUnsavedChanges = Boolean(isDirty);
  if (state.hasUnsavedChanges) statusbar.setWarning(APP_CONFIG.ui.statusUnsaved);
}

function persistUiState() {
  if (!APP_CONFIG.storage.enabled) return;
  saveUiSession(APP_CONFIG.storage.keys, { propertiesPanelOpen: state.propertiesPanelOpen });
  localStorage.setItem("theme", state.theme);
}

async function persistDiagramSession() {
  if (!APP_CONFIG.storage.enabled || !state.modeler) return;
  const xml = await getDiagramXml(state.modeler);
  saveDiagramSession(APP_CONFIG.storage.keys, { xml, name: state.diagramName });
}

function restoreUiState() {
  if (!APP_CONFIG.storage.enabled) return;
  const uiSession = loadUiSession(APP_CONFIG.storage.keys);
  if (uiSession && typeof uiSession.propertiesPanelOpen === "boolean") {
    state.propertiesPanelOpen = uiSession.propertiesPanelOpen;
  }
}

function applyTheme() {
  document.body.setAttribute("data-theme", state.theme);
}

function handleToggleTheme() {
  state.theme = state.theme === "light" ? "dark" : "light";
  applyTheme();
  persistUiState();
  statusbar.setStatus(`Tema cambiado a ${state.theme}`);
}

function handleOpenShortcuts() { ui.shortcutsModal.showModal(); }
function handleCloseShortcuts() { ui.shortcutsModal.close(); }

function handleOpenCloudModal() {
  const savedToken = localStorage.getItem(APP_CONFIG.storage.keys.githubToken);
  if (savedToken) ui.githubTokenInput.value = savedToken;
  ui.cloudModal.showModal();
}

function handleCloseCloudModal() { ui.cloudModal.close(); }

async function handleCloudSync() {
  const token = ui.githubTokenInput.value.trim();
  if (!token) {
    statusbar.setError("Por favor, introduce un token de GitHub");
    return;
  }
  localStorage.setItem(APP_CONFIG.storage.keys.githubToken, token);
  statusbar.setStatus("Sincronizando con la nube...");
  try {
    const xml = await getDiagramXml(state.modeler);
    const fileName = getSafeDiagramName(state.diagramName);
    const gistId = localStorage.getItem(APP_CONFIG.storage.keys.gistId);
    const result = await saveToGitHub(token, fileName, xml, gistId);
    if (result && result.id) {
      localStorage.setItem(APP_CONFIG.storage.keys.gistId, result.id);
      handleCloseCloudModal();
      statusbar.setSuccess("Sincronizado con éxito en GitHub Gist");
    }
  } catch (error) {
    console.error(error);
    statusbar.setError(`Error de sincronización: ${error.message}`);
  }
}

async function loadDiagram(xml, fileName, statusMessage, persist = true) {
  await importDiagram(state.modeler, xml);
  state.diagramName = getSafeDiagramName(fileName);
  state.hasUnsavedChanges = false;
  setDiagramName(ui.diagramName, state.diagramName);
  statusbar.setSelection(APP_CONFIG.ui.statusNoSelection);
  statusbar.setSuccess(statusMessage);
  if (APP_CONFIG.ui.fitViewportOnLoad) fitViewport(state.modeler);
  if (persist && APP_CONFIG.storage.enabled) {
    saveDiagramSession(APP_CONFIG.storage.keys, { xml, name: state.diagramName });
  }
}

async function loadDefaultDiagram() {
  statusbar.setStatus(APP_CONFIG.ui.statusLoading);
  const xml = await loadXmlFromUrl(APP_CONFIG.paths.defaultDiagram);
  await loadDiagram(xml, getDefaultDiagramName(), APP_CONFIG.ui.statusImported);
}

async function restoreDiagramSessionOrDefault() {
  if (APP_CONFIG.storage.enabled) {
    const stored = loadDiagramSession(APP_CONFIG.storage.keys);
    if (stored?.xml) {
      await loadDiagram(stored.xml, stored.name || getDefaultDiagramName(), "Sesión recuperada", false);
      return;
    }
  }
  await loadDefaultDiagram();
}

async function handleNewDiagram() { await loadDefaultDiagram(); }

async function handleLogisticsTemplate() {
  let templatePath = APP_CONFIG.paths.logisticsSeaExport;
  let templateName = "exportacion-maritima.bpmn";
  if (state.diagramName === "exportacion-maritima.bpmn") {
    templatePath = APP_CONFIG.paths.logisticsSeaImport;
    templateName = "importacion-maritima.bpmn";
  }
  statusbar.setStatus("Cargando plantilla logística...");
  try {
    const xml = await loadXmlFromUrl(templatePath);
    await loadDiagram(xml, templateName, "Plantilla de Logística cargada");
  } catch (error) {
    console.error(error);
    statusbar.setError("Error al cargar la plantilla logística");
  }
}

async function handleOpenDiagram() {
  statusbar.setStatus(APP_CONFIG.ui.statusLoading);
  const result = await openLocalXmlFromInput(ui.fileInput);
  if (!result) {
    statusbar.setStatus(APP_CONFIG.ui.statusReady);
    return;
  }
  await loadDiagram(result.xml, result.name, `Archivo cargado: ${result.name}`);
}

async function handleSaveDiagram() {
  const xml = await getDiagramXml(state.modeler);
  const fileName = getSafeDiagramName(state.diagramName);
  await downloadXmlFile(fileName, xml, APP_CONFIG.download.mimeType);
  state.hasUnsavedChanges = false;
  if (APP_CONFIG.storage.enabled) saveDiagramSession(APP_CONFIG.storage.keys, { xml, name: fileName });
  statusbar.setSuccess(APP_CONFIG.ui.statusSaved);
}

async function handleExportDiagram() {
  const fileName = getSafeDiagramName(state.diagramName).replace(".bpmn", "");
  statusbar.setStatus("Generando imagen...");
  await exportToPng(state.modeler, fileName);
  statusbar.setSuccess("Imagen exportada correctamente");
}

function handleFitViewport() { fitViewport(state.modeler); statusbar.setStatus("Vista ajustada"); }
function handleZoomIn() { zoomByStep(state.modeler, APP_CONFIG.zoom.step, APP_CONFIG.zoom); statusbar.setStatus("Zoom aumentado"); }
function handleZoomOut() { zoomByStep(state.modeler, -APP_CONFIG.zoom.step, APP_CONFIG.zoom); statusbar.setStatus("Zoom reducido"); }
function handleToggleProperties() { if (state.sidebar) state.sidebar.toggle(); }

async function runAction(action, errorPrefix) {
  try { await action(); } catch (error) { console.error(error); statusbar.setError(formatError(error, errorPrefix)); }
}

function bindToolbar() {
  state.toolbar = createToolbar(ui, {
    onNew: () => runAction(handleNewDiagram, "Error al crear un diagrama nuevo"),
    onOpen: () => runAction(handleOpenDiagram, "Error al abrir el archivo"),
    onSave: () => runAction(handleSaveDiagram, "Error al guardar"),
    onExport: () => runAction(handleExportDiagram, "Error al exportar imagen"),
    onTheme: handleToggleTheme,
    onShortcuts: handleOpenShortcuts,
    onCloud: handleOpenCloudModal,
    onLogistics: handleLogisticsTemplate,
    onFit: handleFitViewport,
    onZoomIn: handleZoomIn,
    onZoomOut: handleZoomOut,
    onToggleProperties: handleToggleProperties,
  });
  const onResize = throttle(() => { if (state.modeler && APP_CONFIG.ui.fitViewportOnLoad) fitViewport(state.modeler); }, 150);
  state.cleanups.push(on(window, "resize", onResize));
}

function initSidebar() {
  state.sidebar = createSidebar({
    sidebarElement: ui.propertiesSidebar,
    toggleButton: ui.btnToggleProperties,
    initialOpen: state.propertiesPanelOpen,
    labels: { show: "Propiedades", hide: "Ocultar propiedades" },
    syncOnInit: true,
    onChange: (isOpen) => {
      state.propertiesPanelOpen = isOpen;
      if (state.modeler) {
        if (isOpen) attachPropertiesPanel(state.modeler, ui.properties);
        else detachPropertiesPanel(state.modeler);
      }
      persistUiState();
    },
  });
}

function bindModelerEvents() {
  const debouncedPersist = debounce(async () => {
    if (APP_CONFIG.storage.enabled && APP_CONFIG.ui.autoSave) {
      try { await persistDiagramSession(); } catch (error) { console.error(error); }
    }
  }, 1000);
  state.modeler.on("commandStack.changed", () => { updateDirtyState(true); debouncedPersist(); });
  state.modeler.on("selection.changed", (event) => {
    const element = event.newSelection?.[0] || null;
    const label = getSelectionLabel(element);
    statusbar.setSelection(label);
    if (element) statusbar.setStatus(`Seleccionado: ${label}`);
  });
}

async function initModeler() {
  state.modeler = createModeler({
    container: APP_CONFIG.selectors.canvas,
    properties: APP_CONFIG.selectors.properties,
    keyboardBindToWindow: APP_CONFIG.modeler.keyboardBindToWindow,
    camunda8: APP_CONFIG.modeler.camunda8,
    propertiesPanel: APP_CONFIG.modeler.propertiesPanel,
    zeebeSupport: APP_CONFIG.modeler.zeebeSupport,
  });
  bindModelerEvents();
}

function destroyApp() {
  state.cleanups.forEach(cleanup => { if (typeof cleanup === "function") cleanup(); });
  state.cleanups = [];
  if (state.toolbar?.destroy) state.toolbar.destroy();
  if (state.sidebar?.destroy) state.sidebar.destroy();
  if (state.modeler) destroyModeler(state.modeler);
}

function handleBeforeUnload(event) { if (state.hasUnsavedChanges) { event.preventDefault(); event.returnValue = ""; } }

async function init() {
  try {
    statusbar.reset(APP_CONFIG.ui.statusLoading, APP_CONFIG.ui.statusNoSelection);
    restoreUiState();
    applyTheme();
    await initModeler();
    initSidebar();
    bindToolbar();
    await restoreDiagramSessionOrDefault();
    state.cleanups.push(on(window, "beforeunload", handleBeforeUnload));
    state.cleanups.push(on(window, "unload", destroyApp));
    state.cleanups.push(on(ui.btnCloseModal, "click", handleCloseShortcuts));
    state.cleanups.push(on(ui.btnCloseCloudModal, "click", handleCloseCloudModal));
    state.cleanups.push(on(ui.btnCloudSync, "click", handleCloudSync));
  } catch (error) { console.error(error); statusbar.setError(formatError(error, "Error al iniciar la aplicación")); }
}

init();
