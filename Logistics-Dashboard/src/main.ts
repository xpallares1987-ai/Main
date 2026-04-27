import '../assets/css/app.css';
import { state, resetState } from './state';
import { generateAIInsights } from './services/aiAnalyzer';
import { buildDynamicCharts } from './services/chartBuilder';
import { 
    renderSheetSelect, 
    buildFilters, 
    updateKPIs, 
    renderTable, 
    updateActiveFiltersDisplay,
    showToast
} from './ui/render';
import { qs } from "shared-utils";
import { FilterCriteria } from './types';

function applyFilters() {
    const criteria: FilterCriteria = {};
    document.querySelectorAll('.ms-wrap input:checked').forEach(i => {
        const input = i as HTMLInputElement;
        const col = input.dataset.col!;
        if (!criteria[col]) criteria[col] = [];
        criteria[col].push(String(input.value));
    });

    state.filterRes = state.db[state.currentTab].filter(row => {
        return Object.keys(criteria).every(col => criteria[col].includes(String(row[col] || "")));
    });

    updateActiveFiltersDisplay(criteria, removeFilter);
    state.sortCol = '';
    state.pIndex = 1;
    renderAll();
}

function removeFilter(col: string, val: string) {
    const inputs = document.querySelectorAll(`.ms-wrap input[data-col="${col}"]`);
    inputs.forEach(i => {
        const input = i as HTMLInputElement;
        if (input.value === val) {
            input.checked = false;
            // Trigger label update by finding the wrap
            const wrap = input.closest('.ms-wrap') as HTMLElement;
            const checked = wrap.querySelectorAll('input:checked');
            const span = wrap.querySelector('.ms-anchor span') as HTMLElement;
            if (span) {
                if (checked.length === 0) span.textContent = "Todas las entidades";
                else if (checked.length === 1) span.textContent = (checked[0] as HTMLInputElement).value;
                else span.textContent = `${checked.length} selecciones activas`;
            }
        }
    });
    applyFilters();
}

function resetFilters() {
    document.querySelectorAll('.ms-wrap input[type="checkbox"]').forEach(i => (i as HTMLInputElement).checked = false);
    document.querySelectorAll('.ms-anchor span').forEach(s => s.textContent = "Todas las entidades");
    document.querySelectorAll('.ms-search').forEach(s => (s as HTMLInputElement).value = "");
    document.querySelectorAll('.ms-option').forEach(o => (o as HTMLElement).style.display = 'flex');
    applyFilters();
}

function renderAll() {
    updateKPIs();
    renderTable();
    buildDynamicCharts(state.filterRes, 'chartsGrid');
    const aiSummary = qs('#aiSummary');
    if (aiSummary) aiSummary.innerHTML = generateAIInsights(state.filterRes);
}

function switchTab(tabId: string) {
    document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    
    qs(`#${tabId}`)?.classList.add('active');
    if (tabId === 'tab-charts') qs('#tabChartsBtn')?.classList.add('active');
    else qs('#tabDataBtn')?.classList.add('active');
}

async function handleFileUpload(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;

    const loader = qs('#loader');
    const dashboardUI = qs('#dashboardUI');
    const uploadPanel = qs('#uploadPanel');

    if (loader) loader.style.display = 'flex';
    if (dashboardUI) dashboardUI.style.display = 'none';
    if (uploadPanel) uploadPanel.style.display = 'none';

    try {
        resetState();
        
        // Uso de Web Worker para procesamiento off-thread
        const worker = new Worker(new URL('./services/excelWorker.ts', import.meta.url), { type: 'module' });
        const arrayBuffer = await file.arrayBuffer();
        
        worker.postMessage(arrayBuffer, [arrayBuffer]); // Transferencia de buffer para máxima eficiencia

        worker.onmessage = (event) => {
            const { success, db, error } = event.data;
            if (success) {
                state.db = db;
                const sheets = Object.keys(state.db);
                
                if (sheets.length > 0) {
                    state.currentTab = sheets[0];
                    renderSheetSelect(sheets);
                    state.filterRes = [...state.db[state.currentTab]];
                    buildFilters(applyFilters);
                    renderAll();
                    if (dashboardUI) dashboardUI.style.display = 'block';
                    showToast("Auditoría Finalizada", "El ecosistema de datos ha sido estructurado exitosamente.", false);
                } else {
                    showToast("Carencia de Datos", "El archivo no contiene matrices válidas para auditoría.");
                    if (uploadPanel) uploadPanel.style.display = 'flex';
                }
            } else {
                console.error(error);
                showToast("Fallo Crítico", "Error en el procesamiento de datos: " + error);
                if (uploadPanel) uploadPanel.style.display = 'flex';
            }
            if (loader) loader.style.display = 'none';
            worker.terminate();
        };

        worker.onerror = (err) => {
            console.error("Worker Error:", err);
            showToast("Fallo Crítico", "Error interno en el motor de auditoría.");
            if (loader) loader.style.display = 'none';
            if (uploadPanel) uploadPanel.style.display = 'flex';
            worker.terminate();
        };

    } catch (err) {
        console.error(err);
        showToast("Fallo Crítico", "No se pudo iniciar el motor de auditoría.");
        if (loader) loader.style.display = 'none';
        if (uploadPanel) uploadPanel.style.display = 'flex';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const excelInput = qs('#excelInput');
    const btnReset = qs('#btnReset');
    const btnApply = qs('#btnApply');
    const tabChartsBtn = qs('#tabChartsBtn');
    const tabDataBtn = qs('#tabDataBtn');
    const btnPrev = qs('#btnPrev');
    const btnNext = qs('#btnNext');
    const tableSearch = qs('#tableSearch');
    const sheetSelect = qs('#sheetSelect');

    excelInput?.addEventListener('change', handleFileUpload);
    btnReset?.addEventListener('click', resetFilters);
    btnApply?.addEventListener('click', applyFilters);
    tabChartsBtn?.addEventListener('click', () => switchTab('tab-charts'));
    tabDataBtn?.addEventListener('click', () => switchTab('tab-data'));
    btnPrev?.addEventListener('click', () => { if (state.pIndex > 1) { state.pIndex--; renderTable(); } });
    btnNext?.addEventListener('click', () => { 
        const total = Math.ceil(state.filterRes.length / 50);
        if (state.pIndex < total) { state.pIndex++; renderTable(); } 
    });
    tableSearch?.addEventListener('input', () => { state.pIndex = 1; renderTable(); });

    sheetSelect?.addEventListener('change', (e) => {
        state.currentTab = (e.target as HTMLSelectElement).value;
        state.sortCol = '';
        state.pIndex = 1;
        state.filterRes = [...state.db[state.currentTab]];
        buildFilters(applyFilters);
        renderAll();
    });

    // Global click listener to close multi-selects
    window.addEventListener('click', (event) => {
        const target = event.target as HTMLElement;
        if (!target.matches('.ms-anchor') && !target.closest('.ms-anchor') && !target.closest('.ms-list')) {
            document.querySelectorAll('.ms-wrap').forEach(w => w.classList.remove('open'));
        }
    });
});




