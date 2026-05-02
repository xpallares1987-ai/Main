import "../assets/css/app.css";
import APP_CONFIG from "./config";
import { state, updateTheme } from "./state";
import {
  attachPropertiesPanel,
  createModeler,
  cleanupModeler,
  detachPropertiesPanel,
  fitViewport,
  highlightElement,
  importDiagram,
  searchElements,
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
import {
  encryptToken,
  decryptToken,
  loadTabsSession,
  saveTabsSession,
} from "./services/storage-service";
import { setDiagramName, renderTabs } from "./ui/render";
import { createSidebar } from "./ui/sidebar";
import { createStatusbar, Statusbar } from "./ui/statusbar";
import { createToolbar } from "./ui/toolbar";
import {
  on,
  qs,
  debounce,
  ensureExtension,
  formatError,
  safeTrim,
} from "./utils/dom";
import { showToast } from "./toast";
import { AppUi, DiagramTab } from "./types";

let ui: AppUi;
let statusbar: Statusbar;

function resolveUi(selectors: Record<string, string>): AppUi {
  return Object.entries(selectors).reduce((acc, [key, selector]) => {
    const element = qs(selector);
    if (!element)
      throw new Error(`No se encontró el elemento requerido: ${selector}`);
    (acc as unknown as Record<string, HTMLElement>)[key] = element;
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
  renderTabs(
    ui.tabsContainer,
    state.tabs,
    state.activeTabId,
    handleSwitchTab,
    handleCloseTab,
  );
}

async function handleSwitchTab(tabId: string) {
  if (tabId === state.activeTabId) return;

  const currentTab = state.tabs.find((t) => t.id === state.activeTabId);
  if (currentTab && state.modeler) {
    currentTab.xml = await getDiagramXml(state.modeler);
    cleanupModeler(state.modeler);
    state.modeler = null;
  }

  state.activeTabId = tabId;
  const nextTab = state.tabs.find((t) => t.id === tabId);

  if (nextTab) {
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
    await saveTabsSession(APP_CONFIG.storage.keys, state.tabs, state.activeTabId);
    showToast(`Cambiado a: ${nextTab.name}`, "info");
  }
}

async function handleCloseTab(tabId: string) {
  const tab = state.tabs.find((t) => t.id === tabId);
  if (tab?.isDirty) {
    if (
      !confirm(
        `El diagrama "${tab.name}" tiene cambios sin guardar. ¿Cerrar de todos modos?`,
      )
    )
      return;
  }

  const index = state.tabs.findIndex((t) => t.id === tabId);
  state.tabs = state.tabs.filter((t) => t.id !== tabId);

  if (state.tabs.length === 0) {
    await handleNewDiagram();
  } else if (state.activeTabId === tabId) {
    const nextTab = state.tabs[Math.min(index, state.tabs.length - 1)];
    await handleSwitchTab(nextTab.id);
  } else {
    updateTabsUi();
    await saveTabsSession(APP_CONFIG.storage.keys, state.tabs, state.activeTabId);
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
  const templates = [
    {
      name: "Exportación Marítima",
      path: APP_CONFIG.paths.logisticsSeaExport,
      icon: "🚢",
      desc: "Gestión de envíos FCL/LCL vía mar.",
    },
    {
      name: "Importación Marítima",
      path: APP_CONFIG.paths.logisticsSeaImport,
      icon: "⚓",
      desc: "Recepción y seguimiento de carga.",
    },
    {
      name: "Exportación Aérea",
      path: APP_CONFIG.paths.logisticsAirExport,
      icon: "✈️",
      desc: "Procesos para carga aérea urgente.",
    },
    {
      name: "Importación Aérea",
      path: APP_CONFIG.paths.logisticsAirImport,
      icon: "🛬",
      desc: "Recepción y despacho de carga aérea.",
    },
    {
      name: "Despacho de Aduanas",
      path: APP_CONFIG.paths.logisticsCustoms,
      icon: "🛂",
      desc: "Validación y liberación de mercancía.",
    },
    {
      name: "Recepción Almacén",
      path: APP_CONFIG.paths.logisticsWarehouse,
      icon: "🏢",
      desc: "Control de entrada en bodega.",
    },
    {
      name: "Consolidación LCL",
      path: APP_CONFIG.paths.logisticsLclConsol,
      icon: "📦",
      desc: "Agrupación de carga parcial en contenedor.",
    },
    {
      name: "Última Milla",
      path: APP_CONFIG.paths.logisticsLastMile,
      icon: "🚚",
      desc: "Entrega final al cliente consignatario.",
    },
  ];

  ui.logisticsTemplatesList.innerHTML = templates
    .map(
      (t) => `
    <div class="template-card" data-path="${t.path}" data-name="${t.name}">
      <div class="template-card__icon">${t.icon}</div>
      <div class="template-card__name">${t.name}</div>
      <div class="template-card__desc">${t.desc}</div>
    </div>
  `,
    )
    .join("");

  ui.logisticsTemplatesList
    .querySelectorAll(".template-card")
    .forEach((card) => {
      on(card as HTMLElement, "click", async () => {
        const path = card.getAttribute("data-path")!;
        const name = card.getAttribute("data-name")!;
        try {
          const xml = await loadXmlFromUrl(path);
          await loadDiagramInNewTab(
            xml,
            name.toLowerCase().replace(/ /g, "-") + ".bpmn",
          );
          ui.logisticsModal.close();
          showToast(`Plantilla cargada: ${name}`, "success");
        } catch (error) {
          console.error(error);
          showToast("Error al cargar la plantilla", "error");
        }
      });
    });

  ui.logisticsModal.showModal();
}

async function handleSaveDiagram() {
  if (!state.modeler) return;
  const xml = await getDiagramXml(state.modeler);
  const activeTab = state.tabs.find((t) => t.id === state.activeTabId);
  if (!activeTab) return;

  await downloadXmlFile(activeTab.name, xml);
  activeTab.isDirty = false;
  activeTab.xml = xml;
  updateTabsUi();
  showToast("Diagrama guardado", "success");
}

async function handleExportDiagram() {
  if (!state.modeler) return;
  const activeTab = state.tabs.find((t) => t.id === state.activeTabId);
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

async function handleCopyXml() {
  if (!state.modeler) return;
  try {
    const xml = await getDiagramXml(state.modeler);
    await navigator.clipboard.writeText(xml);
    showToast("XML copiado al portapapeles", "success");
  } catch (err) {
    console.error("Error al copiar XML", err);
    showToast("No se pudo copiar el XML", "error");
  }
}

function bindToolbar() {
  state.toolbar = createToolbar(ui, {
    onNew: () =>
      runAction(handleNewDiagram, "Error al crear un diagrama nuevo"),
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

  const btnCopyXml = document.getElementById("btnCopyXml");
  if (btnCopyXml) {
    on(btnCopyXml, "click", handleCopyXml);
  }
}

function handleToggleTheme() {
  const newTheme = state.theme === "light" ? "dark" : "light";
  updateTheme(newTheme);
  updateThemeIcon();
  showToast(`Tema: ${state.theme}`, "info");
}

function updateThemeIcon() {
  const btn = ui.btnTheme;
  if (btn) {
    btn.innerHTML = state.theme === "light" ? 
      `<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path></svg>` :
      `<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z"></path></svg>`;
  }
}

async function handleOpenCloudModal() {
  const encryptedToken = sessionStorage.getItem(
    APP_CONFIG.storage.keys.githubToken,
  );
  if (encryptedToken) {
    const pin = prompt("Introduce tu PIN para desbloquear el token:");
    if (pin) {
      try {
        const token = await decryptToken(encryptedToken, pin);
        ui.githubTokenInput.value = token;
      } catch {
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
  if (!pin)
    return showToast("El PIN es obligatorio para proteger el token", "warning");

  try {
    const encrypted = await encryptToken(token, pin);
    sessionStorage.setItem(APP_CONFIG.storage.keys.githubToken, encrypted);

    if (!state.modeler) return;
    const xml = await getDiagramXml(state.modeler);
    const activeTab = state.tabs.find((t) => t.id === state.activeTabId);
    const result = await saveToGitHub(
      token,
      activeTab?.name || "diagram.bpmn",
      xml,
      sessionStorage.getItem(APP_CONFIG.storage.keys.gistId),
    );
    if (result?.id) {
      sessionStorage.setItem(APP_CONFIG.storage.keys.gistId, result.id);
      ui.cloudModal.close();
      showToast("Sincronizado con GitHub", "success");
    }
  } catch {
    showToast("Error de sincronización", "error");
  }
}

async function runAction(action: () => Promise<void> | void, errorPrefix: string) {
  try {
    await action();
  } catch (error) {
    showToast(formatError(error, errorPrefix), "error");
  }
}

function bindModelerEvents() {
  if (!state.modeler) return;
  state.modeler.on(
    "commandStack.changed",
    debounce(async () => {
      const activeTab = state.tabs.find((t) => t.id === state.activeTabId);
      if (activeTab && state.modeler) {
        activeTab.isDirty = true;
        activeTab.xml = await getDiagramXml(state.modeler);
        await saveTabsSession(APP_CONFIG.storage.keys, state.tabs, state.activeTabId);
        updateTabsUi();
      }
    }, 1000),
  );

  state.modeler.on("selection.changed", (event: { newSelection?: Array<{ type: string }> }) => {
    const element = event.newSelection?.[0] || null;
    const type = element
      ? String(element.type).replace("bpmn:", "")
      : "Sin selección";
    statusbar.setSelection(type);
  });
}

async function handleAutoSave() {
  const activeTab = state.tabs.find((t) => t.id === state.activeTabId);
  if (!activeTab || !state.modeler || !activeTab.isDirty) return;

  const indicator = document.getElementById("autoSaveText");
  if (indicator) indicator.textContent = "Guardando...";

  try {
    const xml = await getDiagramXml(state.modeler);
    activeTab.xml = xml;
    activeTab.isDirty = false;
    await saveTabsSession(APP_CONFIG.storage.keys, state.tabs, state.activeTabId);
    updateTabsUi();
    if (indicator) {
      const now = new Date().toLocaleTimeString();
      indicator.textContent = `Auto-guardado: ${now}`;
    }
  } catch (error) {
    console.error("Auto-save failed", error);
  }
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
    updateThemeIcon();

    state.sidebar = createSidebar({
      sidebarElement: ui.propertiesSidebar,
      toggleButton: ui.btnToggleProperties,
      initialOpen: state.propertiesPanelOpen,
      onChange: (isOpen: boolean) => {
        state.propertiesPanelOpen = isOpen;
        const workspace = qs(".workspace");
        if (workspace) {
          if (isOpen) workspace.classList.remove("workspace--sidebar-hidden");
          else workspace.classList.add("workspace--sidebar-hidden");
        }
        if (state.modeler) {
          if (isOpen) attachPropertiesPanel(state.modeler, ui.properties);
          else detachPropertiesPanel(state.modeler);
        }
      },
    });

    on(ui.btnAddTab, "click", handleNewTab);
    on(ui.btnCloseModal, "click", () => ui.shortcutsModal.close());
    on(ui.btnCloseCloudModal, "click", () => ui.cloudModal.close());
    on(ui.btnCloseLogisticsModal, "click", () => ui.logisticsModal.close());

    const cloudForm = qs("#cloudForm");
    if (cloudForm) {
      on(cloudForm, "submit", (e: Event) => {
        e.preventDefault();
        handleCloudSync();
      });
    }

    const canvasEl = ui.canvas;
    on<DragEvent>(canvasEl, "dragover", handleDragOver);
    on<DragEvent>(canvasEl, "drop", handleDrop);

    const searchInput = document.getElementById("diagramSearch") as HTMLInputElement;
    if (searchInput) {
      on(searchInput, "input", debounce(() => {
        const term = searchInput.value;
        if (state.modeler && term.length > 2) {
          const results = searchElements(state.modeler, term);
          if (results.length > 0) {
            highlightElement(state.modeler, results[0]);
            showToast(`Encontrado: ${results[0].businessObject.name || results[0].id}`, "info");
          }
        }
      }, 500));
    }

    const savedSession = await loadTabsSession(APP_CONFIG.storage.keys);
    if (savedSession && savedSession.tabs && savedSession.tabs.length > 0) {
      state.tabs = savedSession.tabs;
      await handleSwitchTab(savedSession.activeTabId || state.tabs[0].id);
    } else {
      await handleNewTab();
    }

    showToast("Bienvenido al Modelador BPMN", "success");
    setInterval(handleAutoSave, 30000);
  } catch (error) {
    console.error(error);
  }
}

init();
