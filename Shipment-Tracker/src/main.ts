import '../assets/css/shared-theme.css';
import '../assets/css/style.css';
import { ShipmentService } from "./services/shipmentService";
import { AgentService } from "./services/agentService";
import { MapService } from "./services/mapService";
import { UIComponents } from "./ui/components";
import { ModalUI } from "./ui/modal";
import { Toast } from "./ui/toast";
import { debounce } from "./utils/dom";
import { I18nService } from "./services/i18nService";
import { ExportService } from "./services/exportService";
import { ChartService } from "./services/chartService";
import { ExcelService } from "./services/excelService";
import { Shipment, Agent, ShipmentFilters } from "./types";

interface AppState {
  allShipments: Shipment[];
  allAgents: Agent[];
  filters: ShipmentFilters;
  showAnalytics: boolean;
  isOnline: boolean;
  currentView: 'dashboard' | 'contacts';
}

const state: AppState = {
  allShipments: [],
  allAgents: [],
  filters: { term: "", status: "all" },
  showAnalytics: false,
  isOnline: navigator.onLine,
  currentView: 'dashboard'
};

// Custom interface for window to avoid 'any'
interface CustomWindow extends Window {
  setLanguage: (lang: 'es' | 'en') => void;
  showDetails: (id: string) => void;
  closeModal: () => void;
  switchModalTab: (tab: 'info' | 'notes' | 'audit') => void;
  submitNote: (id: string) => Promise<void>;
}

const customWindow = (window as unknown as CustomWindow);

// Event Delegation for dynamic elements
document.addEventListener('click', async (e) => {
  const target = e.target as HTMLElement;
  
  // Show Details
  const detailsBtn = target.closest('[data-action="show-details"]');
  if (detailsBtn) {
    const id = detailsBtn.getAttribute('data-id');
    if (id) {
      const shipment = state.allShipments.find(s => s.id === id);
      if (shipment) ModalUI.open(shipment);
    }
    return;
  }

  // Switch Modal Tab
  const tabBtn = target.closest('.modal-tab-btn');
  if (tabBtn) {
    const tab = tabBtn.getAttribute('data-tab') as 'info' | 'notes' | 'audit';
    if (tab) customWindow.switchModalTab(tab);
    return;
  }

  // Close Modal
  const closeBtn = target.closest('[data-action="close-modal"]');
  if (closeBtn) {
    customWindow.closeModal();
    return;
  }
});

// Global exports only for legacy inline handlers (if any remain in HTML)
customWindow.setLanguage = (lang: 'es' | 'en') => {
  I18nService.setLang(lang);
  updateStaticTranslations();
  updateView();
};

customWindow.closeModal = () => { ModalUI.close(); };

customWindow.switchModalTab = (tab: 'info' | 'notes' | 'audit') => {
  const tabs = ['info', 'notes', 'audit'] as const;
  tabs.forEach(t => {
    const el = document.getElementById(`modal-tab-${t}`);
    if (el) el.style.display = t === tab ? 'block' : 'none';
  });
  document.querySelectorAll('.modal-tab-btn').forEach(btn => {
    const isTarget = btn.getAttribute('data-tab') === tab;
    btn.classList.toggle('active', !!isTarget);
  });
};

customWindow.submitNote = async (id: string) => {
  const input = document.getElementById('noteInput') as HTMLTextAreaElement;
  if (!input || !input.value.trim()) return;
  const updatedShipment = await ShipmentService.addNote(id, input.value.trim());
  if (updatedShipment) {
    state.allShipments = await ShipmentService.getShipments();
    ModalUI.open(updatedShipment);
    customWindow.switchModalTab('notes');
    Toast.show("Nota registrada", "success");
    updateView();
  }
};

function switchView(view: 'dashboard' | 'contacts') {
  state.currentView = view;
  const dashboardEl = document.getElementById('view-dashboard');
  const contactsEl = document.getElementById('view-contacts');
  const navDash = document.getElementById('nav-dashboard');
  const navCont = document.getElementById('nav-contacts');

  if (dashboardEl && contactsEl && navDash && navCont) {
    dashboardEl.style.display = view === 'dashboard' ? 'block' : 'none';
    contactsEl.style.display = view === 'contacts' ? 'block' : 'none';
    navDash.classList.toggle('active', view === 'dashboard');
    navCont.classList.toggle('active', view === 'contacts');
  }

  if (view === 'contacts') renderAgents();
  else updateView();
}

function renderAgents() {
  const list = document.getElementById('agentList');
  const searchInput = document.getElementById('agentSearch') as HTMLInputElement;
  const term = searchInput?.value.toLowerCase() || "";

  if (list) {
    const filtered = state.allAgents.filter(a => 
      a.name.toLowerCase().includes(term) || 
      a.email.toLowerCase().includes(term) ||
      a.specialties.some(s => s.toLowerCase().includes(term))
    );
    list.innerHTML = filtered.map(a => UIComponents.renderAgentCard(a)).join('');
  }
}

function updateStaticTranslations() {
  const t = I18nService.t;
  const els: Record<string, HTMLElement | null> = {
    title: document.getElementById('txt-title'),
    live: document.getElementById('txt-live'),
    search: document.getElementById('searchInput'),
    filter: document.getElementById('statusFilter'),
    export: document.getElementById('btnExport'),
    chartStatus: document.getElementById('txt-chart-status'),
    chartMode: document.getElementById('txt-chart-mode'),
    navDash: document.getElementById('nav-dashboard'),
    navCont: document.getElementById('nav-contacts'),
    agentsTitle: document.getElementById('txt-agents-title')
  };

  if (els.title) els.title.textContent = t.title;
  if (els.live) {
    const now = new Date().toLocaleTimeString();
    els.live.textContent = `${t.liveData} - Last update: ${now}`;
  }

  if (els.search) (els.search as HTMLInputElement).placeholder = t.searchPlaceholder;
  if (els.export) els.export.textContent = t.exportReport;
  if (els.chartStatus) els.chartStatus.textContent = t.statusDist;
  if (els.chartMode) els.chartMode.textContent = t.modeDist;
  if (els.navDash) els.navDash.textContent = t.dashboard;
  if (els.navCont) els.navCont.textContent = t.contacts;
  if (els.agentsTitle) els.agentsTitle.textContent = t.agents;

  const filterSelect = els.filter as HTMLSelectElement | null;
  if (filterSelect) {
    const currentVal = filterSelect.value || state.filters.status;
    filterSelect.innerHTML = `
      <option value="all">${t.allStates}</option>
      <option value="booking">${t.booking}</option>
      <option value="transit">${t.transit}</option>
      <option value="customs">${t.customs}</option>
      <option value="delivered">${t.delivered}</option>
    `;
    filterSelect.value = currentVal;
  }
  document.querySelectorAll('.btn-lang').forEach(btn => {
    btn.classList.toggle('active', btn.textContent?.toLowerCase() === I18nService.lang);
  });
}

function updateView() {
  const filtered = ShipmentService.filterShipments(state.allShipments, state.filters);
  const statsPanel = document.getElementById("statsPanel");
  if (statsPanel) statsPanel.innerHTML = UIComponents.renderStats(filtered);
  const list = document.getElementById("shipmentList");
  if (list) {
    list.innerHTML = filtered.map(s => UIComponents.renderShipmentCard(s)).join("");
    setTimeout(() => { document.querySelectorAll(".card").forEach(c => c.classList.add("visible")); }, 50);
  }
  MapService.renderShipments(filtered);
  ChartService.update(filtered);
}

async function initApp() {
  state.allShipments = await ShipmentService.getShipments();
  state.allAgents = AgentService.getAgents();
  state.filters = await ShipmentService.loadFilters() || { term: "", status: "all" };

  MapService.init("map");
  ChartService.init();
  updateStaticTranslations();

  const searchInput = document.getElementById("searchInput") as HTMLInputElement;
  const statusFilter = document.getElementById("statusFilter") as HTMLSelectElement;
  const btnExport = document.getElementById("btnExport");
  const btnAnalytics = document.getElementById("btnAnalytics");
  const navDash = document.getElementById('nav-dashboard');
  const navCont = document.getElementById('nav-contacts');
  const agentSearch = document.getElementById('agentSearch');

  if (searchInput) searchInput.value = state.filters.term;
  if (statusFilter) statusFilter.value = state.filters.status;

  updateView();
  setInterval(updateStaticTranslations, 60000);

  const handleFilterChange = async () => {
    state.filters.term = searchInput.value;
    state.filters.status = statusFilter.value;
    await ShipmentService.saveFilters(state.filters);
    updateView();
  };

  searchInput?.addEventListener("input", debounce(handleFilterChange, 300));
  statusFilter?.addEventListener("change", handleFilterChange);
  btnExport?.addEventListener("click", () => ExportService.exportToCSV(ShipmentService.filterShipments(state.allShipments, state.filters)));
  agentSearch?.addEventListener("input", debounce(renderAgents, 300));

  btnAnalytics?.addEventListener("click", () => {
    state.showAnalytics = !state.showAnalytics;
    const panel = document.getElementById("analyticsPanel");
    if (panel) panel.style.display = state.showAnalytics ? 'grid' : 'none';
  });

  const btnImport = document.getElementById("btnImport");
  const excelInput = document.getElementById("excelInput") as HTMLInputElement;

  btnImport?.addEventListener("click", () => excelInput?.click());
  excelInput?.addEventListener("change", async (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    try {
      const newShipments = await ExcelService.parseShipments(file);
      state.allShipments = [...state.allShipments, ...newShipments];
      await ShipmentService.saveShipments(state.allShipments);
      updateView();
      Toast.show(`Importados ${newShipments.length} embarques`, "success");
    } catch (err) {
      console.error(err);
      Toast.show("Error al importar archivo", "error");
    }
  });

  navDash?.addEventListener('click', () => switchView('dashboard'));
  navCont?.addEventListener('click', () => switchView('contacts'));

  window.addEventListener('online', () => { state.isOnline = true; updateView(); });
  window.addEventListener('offline', () => { state.isOnline = false; updateView(); });
  window.addEventListener("keydown", (e) => { if (e.key === "Escape") ModalUI.close(); });
}

document.addEventListener("DOMContentLoaded", initApp);
