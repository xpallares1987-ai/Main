import { escapeHTML } from "shared-utils";

export const UIComponents = {
    renderKPI(label: string, value: string, sub: string, trend: 'up' | 'down' | 'neutral') {
        let icon = '';
        if (trend === 'down') icon = `<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" class="sub-down"><path stroke-linecap="round" stroke-linejoin="round" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"></path></svg>`;
        else if (trend === 'up') icon = `<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" class="sub-up"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"></path></svg>`;
        else icon = `<span class="sub-neutral"><svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 12h14"></path></svg></span>`;

        return `
            <div class="kpi-card">
                <div class="kpi-label">${escapeHTML(label)}</div>
                <div class="kpi-value">${escapeHTML(value)}</div>
                <div class="kpi-sub">${icon} <span>${escapeHTML(sub)}</span></div>
            </div>
        `;
    },

    renderFilterChip(col: string, val: string, onRemove: string) {
        return `
            <div class="filter-chip">
                <strong>${escapeHTML(col)}:</strong> ${escapeHTML(val)} 
                <button onclick="${onRemove}">×</button>
            </div>
        `;
    },

    renderToast(title: string, message: string, isError: boolean) {
        const icon = isError 
            ? `<svg width="28" height="28" fill="none" stroke="var(--error)" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`
            : `<svg width="28" height="28" fill="none" stroke="var(--success)" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`;
        
        const style = isError ? '' : 'style="border-left-color: var(--success);"';

        return `
            <div class="toast" ${style}>
                ${icon}
                <div class="toast-content">
                    <span class="toast-title">${escapeHTML(title)}</span>
                    <span class="toast-message">${escapeHTML(message)}</span>
                </div>
            </div>
        `;
    }
};



