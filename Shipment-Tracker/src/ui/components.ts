import { Shipment, Milestone, Agent } from '../types';
import { escapeHTML } from "@torre/shared";
import { ShipmentService } from '../services/shipmentService';
import { I18nService, TranslationKey } from '../services/i18nService';
import { ValidationUtils } from '../utils/validation';

const getIconPath = (mode: string) => {
  switch(mode) {
    case 'sea': return './assets/icons/ship.svg';
    case 'air': return './assets/icons/plane.svg';
    case 'land': return './assets/icons/truck.svg';
    default: return './assets/icons/map-pin.svg';
  }
};

const renderIcon = (mode: string, className: string = 'icon') => {
  return `<img src="${getIconPath(mode)}" class="${className}" alt="${mode}">`;
};

export const UIComponents = {
  renderStats(shipments: Shipment[]) {
    const t = I18nService.t;
    const total = shipments.length;
    const transit = shipments.filter(s => s.status === 'transit').length;
    const exceptions = shipments.filter(s => ShipmentService.checkExceptions(s).length > 0).length;
    const done = shipments.filter(s => s.status === 'delivered').length;

    return `
      <div class="stat-card">
        <div class="stat-value">${total}</div>
        <div class="stat-label">${t.totalShipments}</div>
      </div>
      <div class="stat-card stat-card--cyan">
        <div class="stat-value">${transit}</div>
        <div class="stat-label">${t.inTransit}</div>
      </div>
      <div class="stat-card stat-card--warning">
        <div class="stat-value">${exceptions}</div>
        <div class="stat-label">${t.criticalManagement}</div>
      </div>
      <div class="stat-card stat-card--success">
        <div class="stat-value">${done}</div>
        <div class="stat-label">${t.completed}</div>
      </div>
    `;
  },

  renderShipmentCard(s: Shipment) {
    const t = I18nService.t;
    const exceptions = ShipmentService.checkExceptions(s);
    const isContainerValid = s.mode === 'sea' ? ValidationUtils.isValidContainer(s.container) : true;
    const statusColor = s.status === 'delivered' ? 'var(--success)' :
                       s.status === 'customs' ? 'var(--warning)' : 'var(--primary)';

    const trackingLink = this.getTrackingLink(s.container, s.carrier);

    return `
      <div class="card ${exceptions.length > 0 ? 'card--exception' : ''}" data-id="${s.id}">
        <div class="card-status" style="color: ${statusColor}; background: ${statusColor}15; padding: 4px 10px; border-radius: 20px;">
          ${(t[s.status as TranslationKey] || s.status).toUpperCase()}
        </div>
        <h3 style="display: flex; align-items: center; gap: 12px; margin-bottom: 1.5rem;">
          <div class="icon-cyan" style="background: var(--primary)15; padding: 10px; border-radius: 10px; display: flex;">
            ${renderIcon(s.mode)}
          </div>
          <div style="display: flex; flex-direction: column;">
            <span style="font-size: 1.1rem; color: var(--text);">${escapeHTML(s.reference)}</span>
            <span style="font-size: 0.75rem; color: var(--text-soft); font-weight: 500;">ID: ${s.id.slice(0,8)}</span>
          </div>
        </h3>
        ${exceptions.map(e => `<div class="exception-badge ${e.type === 'delay' ? 'delay' : 'critical'}">⚠️ ${t[`${e.type}Alert` as TranslationKey] || e.message}</div>`).join('')}
        
        <div style="background: var(--bg); padding: 1rem; border-radius: 12px; margin-bottom: 1.5rem;">
          <div class="info-row" style="margin: 0 0 8px 0;"><span class="info-label">${t.route}:</span><span style="font-weight: 600;">${escapeHTML(s.origin)} ➔ ${escapeHTML(s.destination)}</span></div>
          <div class="info-row" style="margin: 0 0 8px 0;"><span class="info-label">${t.container}:</span><span class="${!isContainerValid ? 'text-danger' : ''}" style="font-family: monospace; font-size: 1rem;">${escapeHTML(s.container)}</span></div>
          ${s.carrier ? `<div class="info-row" style="margin: 0;"><span class="info-label">Carrier:</span><span style="font-weight: 600;">${escapeHTML(s.carrier)}</span></div>` : ''}
        </div>

        <div class="info-row" style="border-top: 1px dashed var(--border); padding-top: 1rem; margin-bottom: 1rem;">
          <span class="info-label">${t.eta}:</span>
          <span class="eta-value" style="font-size: 1.1rem;">${escapeHTML(s.eta)}</span>
        </div>

        <div class="timeline" style="margin-bottom: 1.5rem;">${s.milestones.map(m => this.renderMilestone(m)).join('')}</div>
        
        <div class="card-actions" style="display: flex; gap: 0.75rem; margin-top: 1rem; border-top: 1px solid var(--border); padding-top: 1.25rem;">
          <button class="btn-primary" style="flex: 2; font-size: 0.85rem;" data-action="show-details" data-id="${s.id}">
            ${exceptions.length > 0 ? t.analyzeException : t.viewDetails}
          </button>
          ${trackingLink ? `
            <a href="${trackingLink}" target="_blank" class="btn-secondary" style="flex: 1; text-align: center; text-decoration: none; font-size: 0.85rem; display: flex; align-items: center; justify-content: center; gap: 6px;">
              <span>🌐</span> Track
            </a>
          ` : ''}
        </div>
      </div>
    `;
  },

  getTrackingLink(container: string, carrier?: string): string | null {
    if (!container) return null;
    const c = (carrier || '').toLowerCase();
    const cont = container.trim();

    if (c.includes('msc')) return `https://www.msc.com/en/track-a-shipment?query=${cont}`;
    if (c.includes('maersk')) return `https://www.maersk.com/tracking/${cont}`;
    if (c.includes('hapag') || c.includes('hl')) return `https://www.hapag-lloyd.com/en/online-business/track-and-trace/container-tracing.html?container=${cont}`;
    if (c.includes('cosco')) return `https://world.lines.coscoshipping.com/track/container/${cont}`;
    if (c.includes('cma')) return `https://www.cma-cgm.com/ebusiness/tracking/search?SearchBy=Container&Reference=${cont}`;
    
    // Generic search as fallback if carrier is known but not mapped
    if (carrier) return `https://www.google.com/search?q=${encodeURIComponent(carrier + ' tracking ' + cont)}`;
    
    return null;
  },

  renderMilestone(m: Milestone) {
    const t = I18nService.t;
    const label = t[m.key as TranslationKey] || m.label;
    return `
      <div class="milestone ${m.completed ? 'milestone--completed' : ''}">
        <div class="dot"></div>
        <span class="milestone-label">${escapeHTML(label)}</span>
      </div>
    `;
  },

  renderAgentCard(a: Agent) {
    const t = I18nService.t;
    const statusColor = a.status === 'active' ? 'var(--success)' : a.status === 'away' ? 'var(--warning)' : 'var(--text-soft)';
    
    return `
      <div class="agent-card">
        <div class="agent-status-dot" style="background: ${statusColor}"></div>
        <div class="agent-avatar">${a.name.charAt(0)}</div>
        <h3 style="margin: 1rem 0 0.25rem 0;">${escapeHTML(a.name)}</h3>
        <p class="text-soft" style="font-size: 0.8rem; margin-bottom: 1rem;">${escapeHTML(a.role)}</p>
        <div class="info-row"><span class="info-label">${t.route}:</span><span>${escapeHTML(a.region)}</span></div>
        <div class="specialties">
          ${a.specialties.map(s => `<span class="specialty-tag">${escapeHTML(s)}</span>`).join('')}
        </div>
        <div class="agent-actions">
          <a href="mailto:${a.email}" class="btn-lang active" style="flex: 1; text-align: center; text-decoration: none; padding: 8px;">${t.email}</a>
          <a href="tel:${a.phone}" class="btn-lang" style="flex: 1; text-align: center; text-decoration: none; padding: 8px; border: 1px solid var(--border);">${t.call}</a>
        </div>
      </div>
    `;
  }
};



