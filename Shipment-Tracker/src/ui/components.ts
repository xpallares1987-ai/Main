import { Shipment, Milestone, Agent } from '../types';
import { qs, on, escapeHTML, debounce } from "shared-utils";
import { ShipmentService } from '../services/shipmentService';
import { I18nService } from '../services/i18nService';
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

    return `
      <div class="card ${exceptions.length > 0 ? 'card--exception' : ''}" data-id="${s.id}">
        <div class="card-status" style="color: ${statusColor}">${(t as any)[s.status]?.toUpperCase() || s.status.toUpperCase()}</div>
        <h3>
          <span class="icon-cyan">${renderIcon(s.mode)}</span>
          ${escapeHTML(s.reference)}
        </h3>
        ${exceptions.map(e => `<div class="exception-badge ${e.type === 'delay' ? 'delay' : 'critical'}">⚠️ ${(t as any)[e.type + 'Alert'] || e.message}</div>`).join('')}
        <div class="info-row"><span class="info-label">${t.route}:</span><span>${escapeHTML(s.origin)} ➔ ${escapeHTML(s.destination)}</span></div>
        <div class="info-row"><span class="info-label">${t.container}:</span><span class="${!isContainerValid ? 'text-danger' : ''}">${escapeHTML(s.container)}</span></div>
        <div class="info-row"><span class="info-label">${t.eta}:</span><span class="eta-value">${escapeHTML(s.eta)}</span></div>
        <div class="timeline">${s.milestones.map(m => this.renderMilestone(m)).join('')}</div>
        <div class="card-actions"><button class="btn-details" onclick="window.showDetails('${s.id}')">${exceptions.length > 0 ? t.analyzeException : t.viewDetails}</button></div>
      </div>
    `;
  },

  renderMilestone(m: Milestone) {
    const t = I18nService.t;
    const label = (t as any)[m.key] || m.label;
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



