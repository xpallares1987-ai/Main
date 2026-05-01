import { Shipment } from "../types";
import { escapeHTML } from "../../Shared-Utils/src/index";
import { I18nService, TranslationKey } from "../services/i18nService";

const getIconPath = (mode: string) => {
  switch(mode) {
    case 'sea': return './assets/icons/ship.svg';
    case 'air': return './assets/icons/plane.svg';
    case 'land': return './assets/icons/truck.svg';
    default: return './assets/icons/map-pin.svg';
  }
};

export const ModalUI = {
  open(shipment: Shipment) {
    const modal = document.getElementById("detailsModal");
    const body = document.getElementById("modalBody");
    if (!modal || !body) return;

    const t = I18nService.t;
    const dem = this.calculateDemurrage(shipment);
    const iconPath = getIconPath(shipment.mode);

    body.innerHTML = `
      <div class="modal-header">
        <h2 style="color: var(--primary); margin-top: 0; display: flex; align-items: center; gap: 12px;">
          <img src="${iconPath}" style="width: 24px; height: 24px; filter: invert(53%) sepia(93%) saturate(3033%) hue-rotate(175deg) brightness(101%) contrast(92%);" alt="${shipment.mode}">
          ${escapeHTML(shipment.reference)}
        </h2>
        <p class="text-soft">${shipment.status.toUpperCase()} | ${shipment.container}</p>
      </div>
      
      <div class="modal-tabs" style="display: flex; gap: 0.5rem; border-bottom: 1px solid var(--border); margin-top: 1rem;">
          <button class="modal-tab-btn active" onclick="window.switchModalTab('info')">${t.generalInfo}</button>
          <button class="modal-tab-btn" onclick="window.switchModalTab('notes')">${t.notes} (${shipment.notes?.length || 0})</button>
          <button class="modal-tab-btn" onclick="window.switchModalTab('audit')">${t.auditTrail}</button>
      </div>

      <div id="modal-tab-info" class="modal-tab-content">
          <div class="modal-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-top: 1.5rem;">
            <div class="details-section">
              <h4 style="color: var(--cyan); margin-bottom:0.5rem;">${t.generalInfo}</h4>
              <p style="font-size:0.9rem;"><strong>${t.route}:</strong> ${escapeHTML(shipment.origin)} ➔ ${escapeHTML(shipment.destination)}</p>
              <p style="font-size:0.9rem;"><strong>${t.eta}:</strong> ${escapeHTML(shipment.eta)}</p>
            </div>
            <div class="audit-section">
              <h4 style="color: var(--cyan); margin-bottom:0.5rem;">${t.demurrageStatus}</h4>
              <div class="demurrage-panel ${dem.overdue ? "overdue" : ""}" style="background: rgba(255,255,255,0.05); padding: 0.8rem; border-radius: 8px;">
                <p style="font-size:0.85rem;">${t.daysInPort}: <strong>${dem.days}</strong> / ${shipment.freeTimeDays}</p>
                ${dem.overdue ? `<p style="color: var(--danger); font-weight: 800; font-size:0.85rem;">${t.accumulatedFine}: $${dem.cost} USD</p>` : `<p style="color: var(--success); font-size:0.85rem;">${t.underControl}</p>`}
              </div>
            </div>
          </div>
          <div class="history-section" style="margin-top: 1.5rem;">
          <h4 style="color: var(--cyan); margin-bottom:0.5rem;">${t.milestoneHistory}</h4>
          <div class="full-timeline">
            ${shipment.milestones.map(m => `
              <div style="display: flex; gap: 1rem; align-items: center; margin-bottom: 0.5rem; opacity: ${m.completed ? 1 : 0.4}">
                <div style="width: 8px; height: 8px; border-radius: 50%; background: ${m.completed ? "var(--success)" : "var(--border)"}"></div>
                <span style="font-size: 0.85rem;">${escapeHTML(t[m.key as TranslationKey] || m.label)}</span>
                <span style="margin-left: auto; font-size: 0.7rem; color: var(--text-soft)">${m.date || t.pending}</span>
              </div>
            `).join("")}
          </div>
          </div>

      </div>

      <div id="modal-tab-notes" class="modal-tab-content" style="display: none; margin-top: 1rem;">
          <div class="notes-list" style="max-height: 200px; overflow-y: auto; margin-bottom: 1rem;">
              ${shipment.notes?.length ? shipment.notes.map(n => `
                  <div style="background: rgba(255,255,255,0.03); padding: 0.8rem; border-radius: 8px; margin-bottom: 0.8rem; border-left: 3px solid var(--primary);">
                      <div style="display: flex; justify-content: space-between; font-size: 0.7rem; color: var(--text-soft); margin-bottom: 0.3rem;">
                          <span>${escapeHTML(n.author)}</span>
                          <span>${n.date}</span>
                      </div>
                      <p style="margin: 0; font-size: 0.85rem;">${escapeHTML(n.text)}</p>
                  </div>
              `).reverse().join("") : `<p class="text-soft" style="text-align: center; font-size:0.9rem;">${t.noNotes}</p>`}
          </div>
          <div style="border-top: 1px solid var(--border); padding-top: 1rem;">
              <textarea id="noteInput" placeholder="${t.notePlaceholder}" style="width: 100%; background: var(--bg); border: 1px solid var(--border); border-radius: 8px; color: white; padding: 0.6rem; height: 60px; resize: none; font-size:0.85rem;"></textarea>
              <button class="btn-primary" style="margin-top: 0.5rem; width: 100%; font-size:0.85rem;" onclick="window.submitNote('${shipment.id}')">${t.addNote}</button>
          </div>
      </div>

      <div id="modal-tab-audit" class="modal-tab-content" style="display: none; margin-top: 1rem;">
          <div class="audit-list" style="max-height: 300px; overflow-y: auto;">
              <table style="width: 100%; border-collapse: collapse; font-size: 0.75rem;">
                  <thead>
                      <tr style="text-align: left; color: var(--cyan); border-bottom: 1px solid var(--border);">
                          <th style="padding: 0.5rem;">${t.timestamp}</th>
                          <th style="padding: 0.5rem;">${t.action}</th>
                          <th style="padding: 0.5rem;">${t.author}</th>
                          <th style="padding: 0.5rem;">${t.details}</th>
                      </tr>
                  </thead>
                  <tbody>
                      ${shipment.auditHistory?.map(a => `
                          <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                              <td style="padding: 0.5rem; color: var(--text-soft);">${a.timestamp}</td>
                              <td style="padding: 0.5rem;"><code>${a.action}</code></td>
                              <td style="padding: 0.5rem;">${escapeHTML(a.author)}</td>
                              <td style="padding: 0.5rem;">${escapeHTML(a.details)}</td>
                          </tr>
                      `).reverse().join("") || ''}
                  </tbody>
              </table>
          </div>
      </div>

      <div class="modal-actions" style="margin-top: 1.5rem; text-align: right; border-top: 1px solid var(--border); padding-top: 1rem;">
        <button class="btn-details" style="width: auto; padding: 0.5rem 1.5rem; font-size:0.85rem;" onclick="window.closeModal()">Cerrar</button>
      </div>
    `;

    modal.style.display = "flex";
    document.body.style.overflow = "hidden";
  },

  close() {
    const modal = document.getElementById("detailsModal");
    if (modal) {
      modal.style.display = "none";
      document.body.style.overflow = "auto";
    }
  },

  calculateDemurrage(s: Shipment) {
    if (!s.portArrivalDate) return { days: 0, cost: 0, overdue: false };
    const arrival = new Date(s.portArrivalDate);
    const today = new Date("2026-04-25");
    const diffDays = Math.ceil(Math.abs(today.getTime() - arrival.getTime()) / (1000 * 60 * 60 * 24));
    const overdue = diffDays > s.freeTimeDays;
    const cost = overdue ? (diffDays - s.freeTimeDays) * s.demurrageRate : 0;
    return { days: diffDays, cost, overdue };
  }
};



