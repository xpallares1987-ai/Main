import { Chart, registerables, ChartType } from 'chart.js';
import { DataRow } from '../types';
import { BLACK_FILTERS, PALETTES } from '../config';
import { escapeHTML, hexToRgbA } from "shared-utils";

Chart.register(...registerables);

const chartInstances: Record<string, Chart> = {};

export function destroyCharts() {
    Object.keys(chartInstances).forEach(id => {
        chartInstances[id].destroy();
        delete chartInstances[id];
    });
}

export function groupData(data: DataRow[], catCol: string, numCol: string) {
    const groups: Record<string, number | Set<unknown>> = {};
    data.forEach(r => {
        const k = String(r[catCol] || "N/D");
        if (!groups[k]) groups[k] = (BLACK_FILTERS.includes(numCol) && (numCol==='Customer Order' || numCol==='Item Number')) ? new Set() : 0;
        
        const groupValue = groups[k];
        if (groupValue instanceof Set) { 
            const val = r[numCol];
            if(val) groupValue.add(val); 
        }
        else if (numCol === '_Count') { 
            groups[k] = (groupValue as number) + 1; 
        }
        else { 
            groups[k] = (groupValue as number) + (Number(r[numCol]) || 0); 
        }
    });

    const sorted = Object.keys(groups).sort((a,b) => {
        const vA = (groups[a] instanceof Set) ? (groups[a] as Set<unknown>).size : (groups[a] as number);
        const vB = (groups[b] instanceof Set) ? (groups[b] as Set<unknown>).size : (groups[b] as number);
        return vB - vA;
    }).slice(0, 12);

    return {
        labels: sorted,
        values: sorted.map(k => (groups[k] instanceof Set) ? (groups[k] as Set<unknown>).size : (groups[k] as number))
    };
}

export function renderCJS(id: string, type: ChartType, labels: string[], data: number[], label: string, colorConfig: string | string[], fillArea=false, horizontal=false) {
    const canvas = document.getElementById(id) as HTMLCanvasElement;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const isPie = type === 'pie' || type === 'doughnut' || type === 'polarArea';
    
    let bgColors: string | string[] = colorConfig;
    let borderColors: string | string[] = '#ffffff';

    if (!isPie) {
        bgColors = fillArea ? hexToRgbA(Array.isArray(colorConfig) ? colorConfig[0] : colorConfig, 0.1) : colorConfig;
        borderColors = colorConfig;
    }

    chartInstances[id] = new Chart(ctx, {
        type: type,
        data: {
            labels: labels,
            datasets: [{
                label: label,
                data: data,
                backgroundColor: bgColors,
                borderColor: borderColors,
                borderWidth: isPie ? 2 : (type==='line'?3:0),
                fill: fillArea,
                tension: 0.4,
                borderRadius: type==='bar' ? 6 : 0,
                pointRadius: type==='line' ? 3 : 0,
                pointBackgroundColor: colorConfig as unknown as string[]
            }]
        },
        options: {
            indexAxis: horizontal ? 'y' : 'x',
            responsive: true,
            maintainAspectRatio: false,
            plugins: { 
                legend: { display: isPie, position: 'right', labels: { usePointStyle: true, padding: 20 } },
                tooltip: { padding: 12, cornerRadius: 8, titleFont: {size: 14}, bodyFont: {size: 13}, backgroundColor: 'rgba(15, 23, 42, 0.9)' }
            },
            scales: isPie ? {} : {
                y: { beginAtZero: true, grid: { color: '#E2E8F0' } },
                x: { grid: { display: false } }
            }
        }
    });
}

export function buildDynamicCharts(filterRes: DataRow[], gridId: string) {
    const grid = document.getElementById(gridId);
    if (!grid) return;
    grid.innerHTML = '';
    destroyCharts();

    if (filterRes.length === 0) return;

    const keys = Object.keys(filterRes[0]).filter(k => !k.startsWith('_'));
    const dateCols = keys.filter(k => filterRes[0][k] instanceof Date);
    const numCols = keys.filter(k => typeof filterRes[0][k] === 'number');
    const catCols = keys.filter(k => {
        if (BLACK_FILTERS.includes(k)) return false;
        if(typeof filterRes[0][k] !== 'string') return false;
        const unique = new Set(filterRes.map(r=>r[k])).size;
        return unique > 1 && unique <= 40;
    });
    const distinctCols = ['Customer Order', 'Item Number'].filter(k => keys.includes(k));

    if (catCols.length === 0 && dateCols.length === 0) {
        grid.innerHTML = '<div style="padding: 2rem; text-align:center; color: var(--App-gray); font-weight: 600; width: 100%;">Dimensionalidad insuficiente para vectorizar gráficos.</div>';
        return;
    }

    let chartCount = 0;
    const createContainer = (title: string) => {
        chartCount++;
        const id = `chart_dyn_${chartCount}`;
        const div = document.createElement('div');
        div.className = 'chart-card';
        div.innerHTML = `
            <div class="chart-header">
                <h3 class="chart-title">${escapeHTML(title)}</h3>
            </div>
            <div class="chart-wrapper"><canvas id="${id}"></canvas></div>
        `;
        grid.appendChild(div);
        return id;
    };

    if (dateCols.length > 0) {
        const dateCol = dateCols[0];
        const metrica = numCols.includes('GP Ops.') ? 'GP Ops.' : (numCols.includes('Quantity') ? 'Quantity' : (numCols[0] || '_Count'));
        const timeData: Record<string, number> = {};
        filterRes.forEach(r => {
            const d = r[dateCol];
            if(!d || !(d instanceof Date) || isNaN(d.getTime())) return;
            const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
            if(!timeData[key]) timeData[key] = 0;
            timeData[key] += metrica === '_Count' ? 1 : (Number(r[metrica]) || 0);
        });

        const sortedDates = Object.keys(timeData).sort();
        if (sortedDates.length > 1) {
            const id = createContainer(`Cronología Operativa: ${metrica} vs ${dateCol}`);
            renderCJS(id, 'line', sortedDates, sortedDates.map(k=>timeData[k]), metrica, PALETTES.primary[0], true);
        }
    }

    const cat1 = catCols.includes('Warehouse') ? 'Warehouse' : (catCols.includes('Final Destination') ? 'Final Destination' : (catCols.includes('Charge (desc)') ? 'Charge (desc)' : catCols[0]));
    const met1 = numCols.includes('Receivables') ? 'Receivables' : (numCols.includes('Weight (Tons)') ? 'Weight (Tons)' : (numCols.includes('Quantity') ? 'Quantity' : '_Count'));
    
    if (cat1) {
        const dataGroup = groupData(filterRes, cat1, met1);
        if (dataGroup.labels.length > 0) {
            const id = createContainer(`Distribución Base por ${cat1}`);
            renderCJS(id, 'doughnut', dataGroup.labels, dataGroup.values, met1, PALETTES.primary, false);
        }
    }

    const cat2 = catCols.find(c => c !== cat1 && (c === 'Customer Name' || c === 'Debitor/Creditor' || c === 'Branch')) || catCols.find(c => c !== cat1);
    if (cat2) {
        let met2 = distinctCols.length > 0 ? distinctCols[0] : (numCols.find(n => n !== met1) || met1);
        if(numCols.includes('GP Ops.')) met2 = 'GP Ops.';
        const dataGroup = groupData(filterRes, cat2, met2);
        if (dataGroup.labels.length > 0) {
            const isDistinct = distinctCols.includes(met2);
            const id = createContainer(`Rendimiento por ${cat2} (${isDistinct ? 'Únicos' : met2})`);
            renderCJS(id, 'bar', dataGroup.labels, dataGroup.values, met2, PALETTES.primary[1], false, true);
        }
    }
}
