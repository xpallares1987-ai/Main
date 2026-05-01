import { state } from '../state';
import { FilterCriteria } from '../types';
import { BLACK_COLS, BLACK_FILTERS, PAGE_SIZE } from '../config';
import { escapeHTML, qs } from "../utils/dom";
import { UIComponents } from './components';

export function renderSheetSelect(names: string[]) {
    const s = qs<HTMLSelectElement>('#sheetSelect');
    if (s) s.innerHTML = names.map(n => `<option value="${escapeHTML(n)}">${escapeHTML(n)}</option>`).join('');
}

export function buildFilters(onFilterChange: () => void) {
    const container = qs('#filterGrid');
    if (!container) return;
    container.innerHTML = '';
    if (!state.filterRes.length) return;
    const headers = Object.keys(state.filterRes[0] || {}).filter(h => !h.startsWith('_'));

    const fragment = document.createDocumentFragment();

    headers.forEach(h => {
        if (BLACK_COLS.includes(h) || BLACK_FILTERS.includes(h)) return;
        const unique = [...new Set(state.db[state.currentTab].map(r => String(r[h] || "")))].filter(v => v !== "").sort();
        if (unique.length < 2 || unique.length > 250) return;

        const div = document.createElement('div');
        div.className = 'filter-item';
        div.innerHTML = `<label>${escapeHTML(h)}</label>
            <div class="ms-wrap" id="ms-${escapeHTML(h)}">
                <div class="ms-anchor">
                    <span style="overflow: hidden; text-overflow: ellipsis;">Todas las entidades</span>
                </div>
                <div class="ms-list">
                    <input type="text" class="input-base ms-search" placeholder="Filtrar dimensión...">
                    ${unique.map(v => `<label class="ms-option"><input type="checkbox" value="${escapeHTML(v)}" data-col="${escapeHTML(h)}"> <span style="word-break: break-word;">${escapeHTML(v)}</span></label>`).join('')}
                </div>
            </div>`;

        // Add event listeners
        const anchor = div.querySelector('.ms-anchor') as HTMLElement;
        const searchInput = div.querySelector('.ms-search') as HTMLInputElement;
        const checkboxes = div.querySelectorAll('input[type="checkbox"]');

        anchor.onclick = (e) => {
            e.stopPropagation();
            const wrap = div.querySelector('.ms-wrap') as HTMLElement;
            document.querySelectorAll('.ms-wrap').forEach(w => { if(w !== wrap) w.classList.remove('open') });
            wrap.classList.toggle('open');
        };

        searchInput.oninput = () => {
            const term = searchInput.value.toLowerCase();
            div.querySelectorAll('.ms-option').forEach(opt => {
                const text = (opt.querySelector('span') as HTMLElement).textContent?.toLowerCase() || "";
                (opt as HTMLElement).style.display = text.includes(term) ? 'flex' : 'none';
            });
        };

        checkboxes.forEach(cb => {
            (cb as HTMLInputElement).onchange = () => {
                const wrap = div.querySelector('.ms-wrap') as HTMLElement;
                const checked = wrap.querySelectorAll('input:checked');
                const span = wrap.querySelector('.ms-anchor span') as HTMLElement;
                if (span) {
                    if (checked.length === 0) span.textContent = "Todas las entidades";
                    else if (checked.length === 1) span.textContent = (checked[0] as HTMLInputElement).value;
                    else span.textContent = `${checked.length} selecciones activas`;
                }
                onFilterChange();
            };
        });

        fragment.appendChild(div);
    });
    container.appendChild(fragment);
}

export function updateActiveFiltersDisplay(criteria: FilterCriteria, onRemove: (col: string, val: string) => void) {
    const container = qs('#activeFilters');
    if (!container) return;
    container.innerHTML = '';
    let hasFilters = false;

    for (const col in criteria) {
        if (criteria[col].length > 0) {
            hasFilters = true;
            criteria[col].forEach(val => {
                const chipHtml = UIComponents.renderFilterChip(col, val, "");
                const chipDiv = document.createElement('div');
                chipDiv.innerHTML = chipHtml;
                const chip = chipDiv.firstElementChild as HTMLElement;
                if (chip) {
                    const btn = chip.querySelector('button') as HTMLButtonElement;
                    if (btn) btn.onclick = () => onRemove(col, val);
                    container.appendChild(chip);
                }
            });
        }
    }
    container.style.display = hasFilters ? 'flex' : 'none';
}

export function updateKPIs() {
    const container = qs('#kpiContainer');
    if (!container) return;
    container.innerHTML = '';
    if (!state.filterRes.length) return;
    const head = Object.keys(state.filterRes[0] || {});

    const metrics: { label: string; val: string; sub: string; trend: 'up' | 'down' | 'neutral' }[] = [{
        label: 'Transacciones Evaluadas',
        val: state.filterRes.length.toLocaleString('es-ES'),
        sub: `${((state.filterRes.length / state.db[state.currentTab].length)*100).toFixed(1)}% del volumen original`,
        trend: state.filterRes.length === state.db[state.currentTab].length ? 'neutral' : 'up'
    }];

    let totalRev = 0, totalGP = 0;
    let totalPay = 0, totalRec = 0;

    state.filterRes.forEach(r => {
        if (r['Revenue Ops.']) totalRev += Number(r['Revenue Ops.']);
        if (r['GP Ops.']) totalGP += Number(r['GP Ops.']);
        if (r['Payables']) totalPay += Number(r['Payables']);
        if (r['Receivables']) totalRec += Number(r['Receivables']);
    });

    const targets = ['Quantity', 'Total', 'Pending', 'Weight (Tons)', 'TEU', 'GP Ops.', 'Payables', 'Receivables'];
    targets.forEach(m => {
        if (head.includes(m) && state.filterRes.some(r => r[m] !== undefined && r[m] !== 0)) {
            const sum = state.filterRes.reduce((a, b) => a + (Number(b[m]) || 0), 0);

            let formatConfig: Intl.NumberFormatOptions = {maximumFractionDigits: 0};
            if (m.includes('Weight') || m.includes('Ops.') || m === 'Payables' || m === 'Receivables') {
                formatConfig = {minimumFractionDigits: 2, maximumFractionDigits: 2};
            }

            let label = `Total ${m}`;
            if (m === 'GP Ops.') label = 'Beneficio Bruto (GP)';
            if (m === 'Weight (Tons)') label = 'Masa Operativa (Tons)';

            metrics.push({
                label: label,
                val: sum.toLocaleString('es-ES', formatConfig),
                sub: m.includes('Ops.') || m === 'Payables' || m === 'Receivables' ? '€' : 'Volumen',
                trend: sum > 0 ? 'up' : 'neutral'
            });
        }
    });

    if (totalRev > 0) {
        const margin = (totalGP / totalRev) * 100;
        metrics.push({ label: 'Margen Operativo', val: `${margin.toFixed(2)}%`, sub: 'GP / Revenue', trend: margin >= 10 ? 'up' : 'down' });
    }

    if (totalRec > 0 || totalPay > 0) {
        const balance = totalRec - totalPay;
        metrics.push({ label: 'Balance Neto', val: balance.toLocaleString('es-ES', {minimumFractionDigits:2, maximumFractionDigits:2}), sub: 'AR - AP (€)', trend: balance >= 0 ? 'up' : 'down' });
    }

    metrics.slice(0, 8).forEach(m => {
        container.innerHTML += UIComponents.renderKPI(m.label, m.val, m.sub, m.trend);
    });
}

export function renderTable() {
    const head = qs('#dtHead');
    const body = qs('#dtBody');
    const searchInput = qs<HTMLInputElement>('#tableSearch');
    const term = searchInput ? searchInput.value.toLowerCase() : "";

    if (!body) return;

    if (state.filterRes.length === 0) {
        body.innerHTML = '<tr><td colspan="100%" style="text-align:center; padding: 3rem; color: var(--App-gray); font-weight: 500;">Entorno vacío. Ajuste los parámetros de filtro.</td></tr>';
        return;
    }

    const keys = Object.keys(state.filterRes[0]).filter(k => !k.startsWith('_'));
    const hasExpandable = state.filterRes.some(r => r._children && r._children.length > 0);

    // Header
    const headerRow = document.createElement('tr');
    if (hasExpandable) headerRow.innerHTML = '<th style="width:50px; text-align:center;">Drill</th>';
    keys.forEach(k => {
        const sortArrow = state.sortCol === k ? (state.sortAsc ? ' ↑' : ' ↓') : '';
        const th = document.createElement('th');
        th.innerHTML = `${escapeHTML(String(k))}<span class="sort-icon">${sortArrow}</span>`;
        th.onclick = () => {
            if (state.sortCol === k) state.sortAsc = !state.sortAsc;
            else { state.sortCol = k; state.sortAsc = true; }
            sortAndRender();
        };
        headerRow.appendChild(th);
    });
    if (head) {
        head.innerHTML = '';
        head.appendChild(headerRow);
    }

    const filteredTableData = term ? state.filterRes.filter(row => keys.some(k => {
        let v = row[k];
        if (v instanceof Date) v = v.toLocaleDateString('es-ES');
        return String(v || "").toLowerCase().includes(term);
    })) : state.filterRes;

    const data = filteredTableData.slice((state.pIndex - 1) * PAGE_SIZE, state.pIndex * PAGE_SIZE);

    body.innerHTML = '';
    data.forEach((row, idx) => {
        const hasChildren = !!(row._children && row._children.length > 0);
        const rowId = `row_${state.pIndex}_${idx}`;

        const tr = document.createElement('tr');
        tr.className = 'row-parent';
        if (hasChildren) {
            tr.onclick = () => toggleRow(rowId);
        }

        if (hasExpandable) {
            const td = document.createElement('td');
            td.style.textAlign = 'center';
            if (hasChildren) {
                td.innerHTML = `<button class="expand-btn" aria-label="Expandir"><svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg></button>`;
            }
            tr.appendChild(td);
        }

        keys.forEach(k => {
            const td = document.createElement('td');
            const v = row[k];
            let safeV = escapeHTML(String(v || ""));

            if (v instanceof Date) safeV = escapeHTML(v.toLocaleDateString('es-ES'));
            else if (typeof v === 'number') {
                safeV = escapeHTML(v.toLocaleString('es-ES', { maximumFractionDigits: 2 }));
            }

            let formatHtml = safeV;
            if (k === 'Pending' && Number(v) > 0) formatHtml = `<span class="badge badge-danger"><svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg> ${safeV}</span>`;      
            else if (k === 'Pending' && Number(v) === 0) formatHtml = `<span class="badge badge-success"><svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"></path></svg> OK</span>`;

            td.innerHTML = formatHtml || '<span style="color:#CBD5E0;">-</span>';
            td.title = safeV;
            tr.appendChild(td);
        });
        body.appendChild(tr);

        if (hasChildren && row._children) {
            const childKeys = Object.keys(row._children[0]).filter(k => !k.startsWith('_') && k !== 'Load Code');
            const childTr = document.createElement('tr');
            childTr.className = 'row-child';
            childTr.id = `child_${rowId}`;
            childTr.innerHTML = `
                <td colspan="${keys.length + (hasExpandable ? 1 : 0)}" style="padding:0;">
                    <div class="sub-table-wrap">
                        <table class="sub-table">
                            <thead><tr>${childKeys.map(k => `<th>${escapeHTML(String(k))}</th>`).join('')}</tr></thead>
                            <tbody>
                                ${row._children.map(c => `<tr>${childKeys.map(k => {
                                    let cv = c[k];
                                    if (cv instanceof Date) cv = cv.toLocaleDateString('es-ES');
                                    else if (typeof cv === 'number') cv = cv.toLocaleString('es-ES', { maximumFractionDigits: 2 });
                                    return `<td>${escapeHTML(String(cv || '-'))}</td>`;
                                }).join('')}</tr>`).join('')}
                            </tbody>
                        </table>
                    </div>
                </td>
            `;
            body.appendChild(childTr);
        }
    });

    const total = Math.ceil(filteredTableData.length / PAGE_SIZE) || 1;
    const pageLabel = qs('#pageLabel');
    if (pageLabel) pageLabel.textContent = `Mostrando segmento ${state.pIndex} de ${total}`;

    const btnPrev = qs<HTMLButtonElement>('#btnPrev');
    const btnNext = qs<HTMLButtonElement>('#btnNext');
    if (btnPrev) btnPrev.disabled = state.pIndex === 1;
    if (btnNext) btnNext.disabled = state.pIndex >= total;
}

function sortAndRender() {
    const col = state.sortCol;
    state.filterRes.sort((a, b) => {
        let valA = a[col]; let valB = b[col];
        if (valA === undefined || valA === null) valA = '';
        if (valB === undefined || valB === null) valB = '';

        if (typeof valA === 'number' && typeof valB === 'number') {
            return state.sortAsc ? (valA as number) - (valB as number) : (valB as number) - (valA as number);
        }
        if (valA instanceof Date && valB instanceof Date) {
            return state.sortAsc ? (valA as Date).getTime() - (valB as Date).getTime() : (valB as Date).getTime() - (valA as Date).getTime();
        }

        const strA = String(valA).toLowerCase();
        const strB = String(valB).toLowerCase();
        if (strA < strB) return state.sortAsc ? -1 : 1;
        if (strA > strB) return state.sortAsc ? 1 : -1;
        return 0;
    });
    state.pIndex = 1;
    renderTable();
}

export function toggleRow(id: string) {
    const el = qs(`#child_${id}`);
    if (!el) return;
    el.classList.toggle('active');

    const trParent = el.previousElementSibling as HTMLElement;
    if (trParent) {
        const btn = trParent.querySelector('.expand-btn') as HTMLElement;
        if (btn) {
            if(el.classList.contains('active')) {
                btn.innerHTML = '<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M18 12H6"></path></svg>';
                btn.style.backgroundColor = 'var(--App-red)';
                btn.style.color = 'white';
                btn.style.borderColor = 'var(--App-red)';
            } else {
                btn.innerHTML = '<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>';
                btn.style.backgroundColor = '';
                btn.style.color = '';
                btn.style.borderColor = '';
            }
        }
    }
}

export function showToast(title: string, message: string, isError = true) {
    const container = qs('#toastContainer');
    if (!container) return;
    const toastDiv = document.createElement('div');
    toastDiv.innerHTML = UIComponents.renderToast(title, message, isError);
    const toast = toastDiv.firstElementChild as HTMLElement;
    if (toast) {
        container.appendChild(toast);
        setTimeout(() => toast.classList.add('show'), 10);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 400);
        }, 5000);
    }
}
