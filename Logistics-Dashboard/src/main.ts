import '@torre/shared/assets/css/shared-theme.css';
import '@torre/ui/assets/css/components.css';
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
    toggleRow
} from './ui/render';
import { qs } from "@torre/shared";
import { Toast } from "@torre/ui";
import { FilterCriteria } from './types';

// Attach to window for string-based onclick handlers
(window as unknown as { toggleRow: typeof toggleRow }).toggleRow = toggleRow;

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

    updateActiveFiltersDisplay(criteria, removeFilter, resetFilters);
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
    buildDynamicCharts(state.filterRes);
    const aiSummary = qs('#aiSummary');
    if (aiSummary) {
        aiSummary.innerHTML = generateAIInsights(state.filterRes);
        const copyBtn = document.createElement('button');
        copyBtn.className = 'btn btn-secondary';
        copyBtn.style.marginTop = '1rem';
        copyBtn.style.fontSize = '0.75rem';
        copyBtn.innerHTML = '📋 Copiar Resumen';
        copyBtn.onclick = () => {
            const text = aiSummary.innerText.replace('📋 Copiar Resumen', '').trim();
            navigator.clipboard.writeText(text);
            Toast.show('Resumen copiado al portapapeles', 'success');
        };
        aiSummary.appendChild(copyBtn);
    }
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
                    Toast.show("El ecosistema de datos ha sido estructurado exitosamente.", "success");
                } else {
                    Toast.show("El archivo no contiene matrices válidas para auditoría.", "warning");
                    if (uploadPanel) uploadPanel.style.display = 'flex';
                }
            } else {
                console.error(error);
                Toast.show("Error en el procesamiento de datos: " + error, "error");
                if (uploadPanel) uploadPanel.style.display = 'flex';
            }
            if (loader) loader.style.display = 'none';
            worker.terminate();
        };

        worker.onerror = (err) => {
            console.error("Worker Error:", err);
            Toast.show("Error interno en el motor de auditoría.", "error");
            if (loader) loader.style.display = 'none';
            if (uploadPanel) uploadPanel.style.display = 'flex';
            worker.terminate();
        };

    } catch (err) {
        console.error(err);
        Toast.show("No se pudo iniciar el motor de auditoría.", "error");
        if (loader) loader.style.display = 'none';
        if (uploadPanel) uploadPanel.style.display = 'flex';
    }
}

import { sampleFreightForwardingData } from './services/sampleData';

function loadSampleData() {
    resetState();
    state.db = sampleFreightForwardingData;
    const sheets = Object.keys(state.db);

    if (sheets.length > 0) {
        state.currentTab = sheets[0];
        renderSheetSelect(sheets);
        state.filterRes = [...state.db[state.currentTab]];
        buildFilters(applyFilters);
        renderAll();

        const dashboardUI = qs('#dashboardUI');
        const uploadPanel = qs('#uploadPanel');
        if (dashboardUI) dashboardUI.style.display = 'block';
        if (uploadPanel) uploadPanel.style.display = 'none';

        Toast.show("Se ha estructurado un ecosistema de Freight Forwarding ficticio para demostración.", "success");
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const excelInput = qs('#excelInput');
    const btnLoadSample = qs('#btnLoadSample');
    const btnReset = qs('#btnReset');
    const btnApply = qs('#btnApply');
    const tabChartsBtn = qs('#tabChartsBtn');
    const tabDataBtn = qs('#tabDataBtn');
    const btnPrev = qs('#btnPrev');
    const btnNext = qs('#btnNext');
    const tableSearch = qs('#tableSearch');
    const sheetSelect = qs('#sheetSelect');

    const btnTheme = qs('#btnTheme');
    const btnPrint = qs('#btnPrint');

    function updateTheme() {
        document.body.setAttribute('data-theme', state.theme);
        localStorage.setItem('theme', state.theme);
        if (btnTheme) {
            btnTheme.innerHTML = state.theme === 'light' ? 
                `<svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path></svg>` :
                `<svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z"></path></svg>`;
        }
    }

    btnTheme?.addEventListener('click', () => {
        state.theme = state.theme === 'light' ? 'dark' : 'light';
        updateTheme();
    });

    btnPrint?.addEventListener('click', () => {
        window.print();
    });

    updateTheme();

    excelInput?.addEventListener('change', handleFileUpload);
    btnLoadSample?.addEventListener('click', loadSampleData);
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

    window.addEventListener('click', (event) => {
        const target = event.target as HTMLElement;
        if (!target.matches('.ms-anchor') && !target.closest('.ms-anchor') && !target.closest('.ms-list')) {
            document.querySelectorAll('.ms-wrap').forEach(w => w.classList.remove('open'));
        }
    });
});
