import APP_CONFIG from "./config";
import { state, updateTheme } from "./state";
import {
  attachPropertiesPanel,
  createModeler,
  cleanupModeler,
  detachPropertiesPanel,
  fitViewport,
  importDiagram,
  zoomByStep,
} from "./services/modeler-service";
import { exportToPng } from "./services/export-service";
import { saveToGitHub } from "./services/cloud-service";
import {
  getDiagramXml,
  loadXmlFromUrl,
  openLocalXmlFromInput,
  downloadXmlFile,
} from "./services/xml-service";
import { encryptToken, decryptToken } from "./services/storage-service";
import { setDiagramName, renderTabs } from "./ui/render";
import { createSidebar } from "./ui/sidebar";
import { createStatusbar } from "./ui/statusbar";
import { createToolbar } from "./ui/toolbar";
import {
  on,
  qs,
  debounce,
  ensureExtension,
  formatError,
  safeTrim,
} from "shared-utils";
import { showToast } from "./toast";
import { AppUi, DiagramTab } from "./types";

let ui: AppUi;
let statusbar: any;

function resolveUi(selectors: Record<string, string>): AppUi {
  return Object.entries(selectors).reduce((acc: any, [key, selector]) => {
    const element = qs(selector);
    if (!element) throw new Error(`No se encontró el elemento requerido: ${selector}`);
    acc[key] = element;
    return acc;
  }, {} as AppUi);
}

function createTab(name: string, xml: string): DiagramTab {
  return {
    id: crypto.randomUUID(),
    name: getSafeDiagramName(name),
    xml,
    isDirty: false,
  };
}

function getSafeDiagramName(name: string) {
  const trimmed = safeTrim(name, APP_CONFIG.download.defaultFileName);
  return ensureExtension(trimmed, ".bpmn");
}

function updateTabsUi() {
  renderTabs(ui.tabsContainer, state.tabs, state.activeTabId, handleSwitchTab, handleCloseTab);
}

async function handleSwitchTab(tabId: string) {
  if (tabId === state.activeTabId) return;

  const currentTab = state.tabs.find(t => t.id === state.activeTabId);
  if (currentTab && state.modeler) {
    currentTab.xml = await getDiagramXml(state.modeler);
    // Limpieza de instancia antigua para liberar RAM
    cleanupModeler(state.modeler);
    state.modeler = null;
  }

  state.activeTabId = tabId;
  const nextTab = state.tabs.find(t => t.id === tabId);
  
  if (nextTab) {
    // Re-inicializar modelador para la nueva pestaña
    state.modeler = await createModeler({
      container: APP_CONFIG.selectors.canvas,
      properties: APP_CONFIG.selectors.properties,
      keyboardBindToWindow: true,
      camunda8: true,
      propertiesPanel: state.propertiesPanelOpen,
      zeebeSupport: true,
    });
    
    bindModelerEvents();
    await importDiagram(state.modeler, nextTab.xml);
    setDiagramName(ui.diagramName, nextTab.name);
    updateTabsUi();
    showToast(`Cambiado a: ${nextTab.name}`, "info");
  }
}

async function handleCloseTab(tabId: string) {
  const tab = state.tabs.find(t => t.id === tabId);
  if (tab?.isDirty) {
    if (!confirm(`El diagrama "${tab.name}" tiene cambios sin guardar. ¿Cerrar de todos modos?`)) return;
  }

  const index = state.tabs.findIndex(t => t.id === tabId);
  state.tabs = state.tabs.filter(t => t.id !== tabId);

  if (state.tabs.length === 0) {
    await handleNewDiagram();
  } else if (state.activeTabId === tabId) {
    const nextTab = state.tabs[Math.min(index, state.tabs.length - 1)];
    await handleSwitchTab(nextTab.id);
  } else {
    updateTabsUi();
  }
}

async function handleNewTab() {
  const xml = await loadXmlFromUrl(APP_CONFIG.paths.defaultDiagram);
  const tab = createTab("nuevo-diagrama.bpmn", xml);
  state.tabs.push(tab);
  await handleSwitchTab(tab.id);
}

async function handleNewDiagram() {
  await handleNewTab();
}

async function loadDiagramInNewTab(xml: string, fileName: string) {
  const tab = createTab(fileName, xml);
  state.tabs.push(tab);
  await handleSwitchTab(tab.id);
  showToast(`Cargado: ${tab.name}`, "success");
}

async function handleOpenDiagram() {
  const result = await openLocalXmlFromInput(ui.fileInput);
  if (result) {
    await loadDiagramInNewTab(result.xml, result.name);
  }
}

async function handleLogisticsTemplate() {
  const activeTab = state.tabs.find(t => t.id === state.activeTabId);
  const templatePath = activeTab?.name === "exportacion-maritima.bpmn"
    ? APP_CONFIG.paths.logisticsSeaImport
    : APP_CONFIG.paths.logisticsSeaExport;
  
  const templateName = templatePath.includes("export") ? "exportacion-maritima.bpmn" : "importacion-maritima.bpmn";

  try {
    const xml = await loadXmlFromUrl(templatePath);
    await loadDiagramInNewTab(xml, templateName);
  } catch (error) {
    showToast("Error al cargar la plantilla", "error");
  }
}

async function handleSaveDiagram() {
  if (!state.modeler) return;
  const xml = await getDiagramXml(state.modeler);
  const activeTab = state.tabs.find(t => t.id === state.activeTabId);
  if (!activeTab) return;

  await downloadXmlFile(activeTab.name, xml);
  activeTab.isDirty = false;
  activeTab.xml = xml;
  updateTabsUi();
  showToast("Diagrama guardado", "success");
}

async function handleExportDiagram() {
  if (!state.modeler) return;
  const activeTab = state.tabs.find(t => t.id === state.activeTabId);
  const fileName = activeTab ? activeTab.name.replace(".bpmn", "") : "diagrama";
  await exportToPng(state.modeler, fileName);
  showToast("Imagen exportada", "success");
}

function handleDragOver(e: DragEvent) {
  e.preventDefault();
  if (e.dataTransfer) e.dataTransfer.dropEffect = "copy";
}

async function handleDrop(e: DragEvent) {
  e.preventDefault();
  const file = e.dataTransfer?.files[0];
  if (file && (file.name.endsWith(".bpmn") || file.name.endsWith(".xml"))) {
    const reader = new FileReader();
    reader.onload = async (event) => {
      const xml = event.target?.result as string;
      await loadDiagramInNewTab(xml, file.name);
    };
    reader.readAsText(file);
  } else {
    showToast("Por favor, suelta un archivo .bpmn o .xml válido", "warning");
  }
}

function bindToolbar() {
  state.toolbar = createToolbar(ui, {
    onNew: () => runAction(handleNewDiagram, "Error al crear un diagrama nuevo"),
    onOpen: () => runAction(handleOpenDiagram, "Error al abrir el archivo"),
    onSave: () => runAction(handleSaveDiagram, "Error al guardar"),
    onExport: () => runAction(handleExportDiagram, "Error al exportar imagen"),
    onTheme: handleToggleTheme,
    onShortcuts: () => ui.shortcutsModal.showModal(),
    onCloud: handleOpenCloudModal,
    onLogistics: handleLogisticsTemplate,
    onFit: () => state.modeler && fitViewport(state.modeler),
    onZoomIn: () => state.modeler && zoomByStep(state.modeler, 0.1),
    onZoomOut: () => state.modeler && zoomByStep(state.modeler, -0.1),
    onToggleProperties: () => state.sidebar?.toggle(),
  });
}

function handleToggleTheme() {
  const newTheme = state.theme === "light" ? "dark" : "light";
  updateTheme(newTheme);
  showToast(`Tema: ${state.theme}`, "info");
}

async function handleOpenCloudModal() {
  const encryptedToken = sessionStorage.getItem(APP_CONFIG.storage.keys.githubToken);
  if (encryptedToken) {
    const pin = prompt("Introduce tu PIN para desbloquear el token:");
    if (pin) {
      try {
        const token = await decryptToken(encryptedToken, pin);
        ui.githubTokenInput.value = token;
      } catch (e) {
        showToast("PIN incorrecto", "error");
        ui.githubTokenInput.value = "";
      }
    }
  }
  ui.cloudModal.showModal();
}

async function handleCloudSync() {
  const token = ui.githubTokenInput.value.trim();
  if (!token) return showToast("Introduce un token de GitHub", "error");
  
  const pin = prompt("Crea un PIN para proteger tu token en esta sesión:");
  if (!pin) return showToast("El PIN es obligatorio para proteger el token", "warning");

  try {
    const encrypted = await encryptToken(token, pin);
    sessionStorage.setItem(APP_CONFIG.storage.keys.githubToken, encrypted);
    
    if (!state.modeler) return;
    const xml = await getDiagramXml(state.modeler);
    const activeTab = state.tabs.find(t => t.id === state.activeTabId);
    const result = await saveToGitHub(token, activeTab?.name || "diagram.bpmn", xml, sessionStorage.getItem(APP_CONFIG.storage.keys.gistId));
    if (result?.id) {
      sessionStorage.setItem(APP_CONFIG.storage.keys.gistId, result.id);
      ui.cloudModal.close();
      showToast("Sincronizado con GitHub", "success");
    }
  } catch (error) {
    showToast("Error de sincronización", "error");
  }
}

async function runAction(action: Function, errorPrefix: string) {
  try { await action(); } catch (error) { showToast(formatError(error, errorPrefix), "error"); }
}

function bindModelerEvents() {
  if (!state.modeler) return;
  state.modeler.on("commandStack.changed", debounce(() => {
    const activeTab = state.tabs.find(t => t.id === state.activeTabId);
    if (activeTab) {
      activeTab.isDirty = true;
      updateTabsUi();
    }
  }, 500));

  state.modeler.on("selection.changed", (event: any) => {
    const element = event.newSelection?.[0] || null;
    const type = element ? String(element.type).replace("bpmn:", "") : "Sin selección";
    statusbar.setSelection(type);
  });
}

async function init() {
  try {
    document.body.setAttribute("data-theme", state.theme);
    ui = resolveUi(APP_CONFIG.selectors);
    
    statusbar = createStatusbar({
      statusElement: ui.statusText,
      selectionElement: ui.selectionText,
    });

    state.modeler = await createModeler({
      container: APP_CONFIG.selectors.canvas,
      properties: APP_CONFIG.selectors.properties,
      keyboardBindToWindow: true,
      camunda8: true,
      propertiesPanel: true,
      zeebeSupport: true,
    });
    
    bindModelerEvents();
    bindToolbar();
    
    state.sidebar = createSidebar({
      sidebarElement: ui.propertiesSidebar,
      toggleButton: ui.btnToggleProperties,
      initialOpen: state.propertiesPanelOpen,
      onChange: (isOpen: boolean) => {
        state.propertiesPanelOpen = isOpen;
        if (state.modeler) {
          if (isOpen) attachPropertiesPanel(state.modeler, ui.properties);
          else detachPropertiesPanel(state.modeler);
        }
      }
    });

    on(ui.btnAddTab, "click", handleNewTab);
    on(ui.btnCloseModal, "click", () => ui.shortcutsModal.close());
    on(ui.btnCloseCloudModal, "click", () => ui.cloudModal.close());
    on(ui.btnCloudSync, "click", handleCloudSync);
    
    // Drag & Drop
    const canvasEl = ui.canvas;
    on(canvasEl, "dragover", handleDragOver);
    on(canvasEl, "drop", handleDrop);

    await handleNewTab();
    showToast("Bienvenido al Modelador BPMN", "success");
  } catch (error) {
    console.error(error);
  }
}

init();



