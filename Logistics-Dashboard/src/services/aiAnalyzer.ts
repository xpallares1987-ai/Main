import { DataRow } from '../types';
import { escapeHTML } from "shared-utils";

export function getTop(data: DataRow[], col: string): string | null {
    if(!data.length || data[0][col] === undefined) return null;
    const counts: Record<string, number> = {};
    data.forEach(r => { if(r[col] && r[col]!=="") counts[r[col]] = (counts[r[col]] || 0) + 1; });
    const keys = Object.keys(counts).sort((a,b) => counts[b] - counts[a]);
    return keys.length > 0 ? keys[0] : null;
}

export function generateAIInsights(filterRes: DataRow[]): string {
    if (filterRes.length === 0) { 
        return "<div class='ai-desc'>Insuficiencia de datos para estructurar modelos lógicos o generar inteligencia contextual.</div>"; 
    }

    const head = Object.keys(filterRes[0] || {});
    const isFinancial = head.includes('Payables') || head.includes('Receivables');
    const isShipment = head.includes('TEU') || head.includes('GP Ops.');

    let html = `<div class="ai-pills">`;

    if (isFinancial) {
        const topClient = getTop(filterRes, 'Customer Name') || getTop(filterRes, 'Debitor/Creditor');
        const topCharge = getTop(filterRes, 'Charge (desc)');
        let totAR = 0, totAP = 0;
        filterRes.forEach(r => { totAR += (Number(r['Receivables'])||0); totAP += (Number(r['Payables'])||0); });

        if(topClient) html += `<div class="ai-pill"><span>Socio Comercial Frecuente:</span> <strong>${escapeHTML(topClient)}</strong></div>`;
        if(topCharge) html += `<div class="ai-pill"><span>Concepto Mayoritario:</span> <strong>${escapeHTML(topCharge)}</strong></div>`;
        
        html += `</div><div class="ai-desc">`;
        html += `El análisis financiero procesa <strong>${filterRes.length.toLocaleString('es-ES')} transacciones</strong> en este segmento. `;
        html += `Volumen agregado de Cuentas por Cobrar (AR): <strong>${totAR.toLocaleString('es-ES', {style:'currency', currency:'EUR'})}</strong>, frente a Cuentas por Pagar (AP): <strong>${totAP.toLocaleString('es-ES', {style:'currency', currency:'EUR'})}</strong>. `;
        
        if (totAR > totAP) html += `<br><br><span style="color:var(--success); font-weight:800;">✅ Diagnóstico:</span> Balance Netamente Positivo detectado en la selección actual.`;
        else if (totAP > totAR) html += `<br><br><span style="color:var(--warning); font-weight:800;">⚠️ Diagnóstico:</span> Dominancia de costes operativos o Balance Negativo.`;
        else html += `<br><br><span style="color:var(--info); font-weight:800;">ℹ️ Diagnóstico:</span> Equilibrio financiero detectado.`;

    } else if (isShipment) {
        const topClient = getTop(filterRes, 'Customer Name') || getTop(filterRes, 'Consignee Name');
        const topPOL = getTop(filterRes, 'POL');
        const topPOD = getTop(filterRes, 'POD');
        let totTEU = 0, totGP = 0;
        filterRes.forEach(r => { totTEU += (Number(r['TEU'])||0); totGP += (Number(r['GP Ops.'])||0); });

        if(topClient) html += `<div class="ai-pill"><span>Cuenta Estratégica:</span> <strong>${escapeHTML(topClient)}</strong></div>`;
        if(topPOL) html += `<div class="ai-pill"><span>POL Crítico:</span> <strong>${escapeHTML(topPOL)}</strong></div>`;
        if(topPOD) html += `<div class="ai-pill"><span>POD Frecuente:</span> <strong>${escapeHTML(topPOD)}</strong></div>`;
        
        html += `</div><div class="ai-desc">`;
        html += `El módulo de tráfico evalúa <strong>${totTEU.toLocaleString('es-ES')} TEUs</strong> gestionados en ${filterRes.length} operaciones. `;
        html += `El Beneficio Bruto (GP) proyectado asciende a <strong>${totGP.toLocaleString('es-ES', {style:'currency', currency:'EUR'})}</strong>. `;
        
        let avgTeuGP = totTEU > 0 ? (totGP / totTEU) : 0;
        if (avgTeuGP > 0) {
            html += `<br><br><span style="color:var(--success); font-weight:800;">💡 Eficiencia Rentable:</span> El rendimiento promedio se establece en <strong>${avgTeuGP.toLocaleString('es-ES', {maximumFractionDigits:2})} € por TEU operado</strong>.`;
        }

    } else {
        const topClient = getTop(filterRes, 'Customer Name') || getTop(filterRes, 'Main Contact') || getTop(filterRes, 'Branch');
        const topWH = getTop(filterRes, 'Warehouse') || getTop(filterRes, 'POL');
        const topDest = getTop(filterRes, 'Final Destination') || getTop(filterRes, 'POD');
        
        let totalQty = filterRes.length; 
        let measureName = "registros estructurados";
        
        if (filterRes[0] && filterRes[0]['Quantity'] !== undefined) {
            totalQty = filterRes.reduce((a,b)=>a+(Number(b['Quantity'])||0), 0);
            measureName = "unidades operativas";
        } else if (filterRes[0] && filterRes[0]['Item Number'] !== undefined) {
            const s = new Set();
            filterRes.forEach(r => { if(r['Item Number']) s.add(r['Item Number']); });
            totalQty = s.size;
            measureName = "bobinas/ítems únicos";
        }

        let totalPending = 0;
        if(filterRes[0] && filterRes[0]['Pending'] !== undefined) {
            totalPending = filterRes.reduce((a,b)=>a+(Number(b['Pending'])||0), 0);
        }
        
        if(topClient && topClient !== "N/A") html += `<div class="ai-pill"><span>Entidad Crítica:</span> <strong>${escapeHTML(topClient)}</strong></div>`;
        if(topWH && topWH !== "N/A") html += `<div class="ai-pill"><span>HUB Primario:</span> <strong>${escapeHTML(topWH)}</strong></div>`;
        if(topDest && topDest !== "N/A") html += `<div class="ai-pill"><span>Vector Destino:</span> <strong>${escapeHTML(topDest)}</strong></div>`;
        html += `</div><div class="ai-desc">`;

        html += `A través de las dimensiones filtradas, la IA consolida un flujo logístico de <strong>${totalQty.toLocaleString('es-ES')} ${escapeHTML(measureName)}</strong>. `;
        
        if (filterRes[0] && filterRes[0]['Pending'] !== undefined) {
            let completionRate = totalQty > 0 ? (((totalQty - totalPending) / totalQty) * 100).toFixed(1) : 100;
            html += `El ratio de cumplimiento operativo se sitúa en un <strong>${completionRate}%</strong>. `;
            
            if(totalPending > 0) {
                html += `<br><br><span style="color:var(--warning); font-weight:800;">⚠️ Alerta Operativa:</span> Existen <strong>${totalPending.toLocaleString('es-ES')} unidades en estado Pending</strong>, provocando degradación en la latencia de la cadena de suministro.`;
            } else if (totalQty > 0) {
                html += `<br><br><span style="color:var(--success); font-weight:800;">✅ Estado de Salud:</span> Integridad operativa al 100%. Ausencia de cuellos de botella.`;
            }
        }
    }
    html += `</div>`;
    return html;
}

