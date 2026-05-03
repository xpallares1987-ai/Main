import { Shipment } from "../types";
import { escapeHTML } from "@torre/shared";
import { I18nService, TranslationKey } from "../services/i18nService";
import { Modal } from "@torre/ui";
import type { ModalInstance } from "@torre/ui";

const getIconPath = (mode: string) => {
  switch (mode) {
    case "sea":
      return "./assets/icons/ship.svg";
    case "air":
      return "./assets/icons/plane.svg";
    case "land":
      return "./assets/icons/truck.svg";
    default:
      return "./assets/icons/map-pin.svg";
  }
};

export const ModalUI = {
  activeModal: null as ModalInstance | null,

  open(shipment: Shipment) {
    const t = I18nService.t;
    const dem = this.calculateDemurrage(shipment);
    const iconPath = getIconPath(shipment.mode);

    const contentHtml = `
      <div class="modal-header-custom" style="margin-bottom: 1.5rem;">
        <p class="text-soft" style="margin: 0;">${shipment.status.toUpperCase()} | ${shipment.container}</p>
      </div>
      
      <div class="modal-tabs" style="display: flex; gap: 0.5rem; border-bottom: 1px solid var(--ff-border); margin-top: 1rem;">
          <button class="modal-tab-btn active" data-tab="info">${t.generalInfo}</button>
          <button class="modal-tab-btn" data-tab="notes">${t.notes} (${shipment.notes?.length || 0})</button>
          <button class="modal-tab-btn" data-tab="audit">${t.auditTrail}</button>
      </div>

      <div id="modal-tab-info" class="modal-tab-content">
          <div class="modal-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-top: 1.5rem;">
            <div class="details-section">
              <h4 style="color: var(--ff-blue); margin-bottom:0.5rem;">${t.generalInfo}</h4>
              <p style="font-size:0.9rem;"><strong>${t.route}:</strong> ${escapeHTML(shipment.origin)} ➔ ${escapeHTML(shipment.destination)}</p>
              <p style="font-size:0.9rem;"><strong>${t.eta}:</strong> ${escapeHTML(shipment.eta)}</p>
            </div>
            <div class="audit-section">
              <h4 style="color: var(--ff-blue); margin-bottom:0.5rem;">${t.demurrageStatus}</h4>
              <div class="demurrage-panel ${dem.overdue ? "overdue" : ""}" style="background: var(--ff-bg-app); padding: 0.8rem; border-radius: 8px; border: 1px solid var(--ff-border);">
                <p style="font-size:0.85rem; margin: 0;">${t.daysInPort}: <strong>${dem.days}</strong> / ${shipment.freeTimeDays}</p>
                ${dem.overdue ? `<p style="color: var(--ff-danger); font-weight: 800; font-size:0.85rem; margin: 0.5rem 0 0 0;">${t.accumulatedFine}: $${dem.cost} USD</p>` : `<p style="color: var(--ff-success); font-size:0.85rem; margin: 0.5rem 0 0 0;">${t.underControl}</p>`}
              </div>
            </div>
          </div>
          <div class="history-section" style="margin-top: 1.5rem;">
          <h4 style="color: var(--ff-blue); margin-bottom:0.5rem;">${t.milestoneHistory}</h4>
          <div class="full-timeline">
            ${shipment.milestones
              .map(
                (m) => `
              <div style="display: flex; gap: 1rem; align-items: center; margin-bottom: 0.5rem; opacity: ${m.completed ? 1 : 0.4}">
                <div style="width: 8px; height: 8px; border-radius: 50%; background: ${m.completed ? "var(--ff-success)" : "var(--ff-border)"}"></div>
                <span style="font-size: 0.85rem;">${escapeHTML(t[m.key as TranslationKey] || m.label)}</span>
                <span style="margin-left: auto; font-size: 0.7rem; color: var(--ff-text-soft)">${m.date || t.pending}</span>
              </div>
            `,
              )
              .join("")}
          </div>
          </div>

      </div>

      <div id="modal-tab-notes" class="modal-tab-content" style="display: none; margin-top: 1rem;">
          <div class="notes-list" style="max-height: 200px; overflow-y: auto; margin-bottom: 1rem;">
              ${shipment.notes?.length ? shipment.notes.map((n) => `
                  <div style="background: var(--ff-bg-app); padding: 0.8rem; border-radius: 8px; margin-bottom: 0.8rem; border-left: 3px solid var(--ff-blue);">
                      <div style="display: flex; justify-content: space-between; font-size: 0.7rem; color: var(--ff-text-soft); margin-bottom: 0.3rem;">
                          <span>${escapeHTML(n.author)}</span>
                          <span>${n.date}</span>
                      </div>
                      <p style="margin: 0; font-size: 0.85rem;">${escapeHTML(n.text)}</p>
                  </div>
              `).reverse().join("") : `<p class="text-soft" style="text-align: center; font-size:0.9rem;">${t.noNotes}</p>`}
          </div>
          <div style="border-top: 1px solid var(--ff-border); padding-top: 1rem;">
              <textarea id="noteInput" name="noteInput" placeholder="${t.notePlaceholder}" style="width: 100%; background: white; border: 1px solid var(--ff-border); border-radius: 8px; color: var(--ff-text-main); padding: 0.6rem; height: 60px; resize: none; font-size:0.85rem;" autocomplete="off"></textarea>
              <button class="ff-btn-primary" style="margin-top: 0.5rem; width: 100%; font-size:0.85rem;" onclick="window.submitNote('${shipment.id}')">${t.addNote}</button>
          </div>      </div>

      <div id="modal-tab-audit" class="modal-tab-content" style="display: none; margin-top: 1rem;">
          <div class="audit-list" style="max-height: 300px; overflow-y: auto;">
              <table style="width: 100%; border-collapse: collapse; font-size: 0.75rem;">
                  <thead>
                      <tr style="text-align: left; color: var(--ff-blue); border-bottom: 1px solid var(--ff-border);">
                          <th style="padding: 0.5rem;">${t.timestamp}</th>
                          <th style="padding: 0.5rem;">${t.action}</th>
                          <th style="padding: 0.5rem;">${t.author}</th>
                          <th style="padding: 0.5rem;">${t.details}</th>
                      </tr>
                  </thead>
                  <tbody>
                      ${shipment.auditHistory?.map((a) => `
                          <tr style="border-bottom: 1px solid var(--ff-border);">
                              <td style="padding: 0.5rem; color: var(--ff-text-soft);">${a.timestamp}</td>
                              <td style="padding: 0.5rem;"><code>${a.action}</code></td>
                              <td style="padding: 0.5rem;">${escapeHTML(a.author)}</td>
                              <td style="padding: 0.5rem;">${escapeHTML(a.details)}</td>
                          </tr>
                      `).reverse().join("") || ""}
                  </tbody>
              </table>
          </div>
      </div>

      <div class="modal-actions" style="margin-top: 1.5rem; text-align: right; border-top: 1px solid var(--ff-border); padding-top: 1rem;">
        <button class="ff-btn-primary" style="width: auto; padding: 0.5rem 1.5rem; font-size:0.85rem;" data-action="close-modal">Cerrar</button>
      </div>
    `;

    const modalTitle = `
      <div style="display: flex; align-items: center; gap: 12px;">
        <img src="${iconPath}" style="width: 24px; height: 24px; filter: var(--ff-icon-filter);" alt="${shipment.mode}">
        ${escapeHTML(shipment.reference)}
      </div>
    `;

    this.activeModal = Modal.create(contentHtml, {
      title: modalTitle,
      id: "detailsModal",
      maxWidth: "700px",
    });

    // Attach local listeners for tabs
    this.activeModal.element.querySelectorAll(".modal-tab-btn").forEach((btn: any) => {
      btn.addEventListener("click", () => {
        const tab = btn.getAttribute("data-tab");
        (window as any).switchModalTab(tab);
      });
    });

    this.activeModal.element.querySelector('[data-action="close-modal"]')?.addEventListener("click", () => {
      this.close();
    });
  },

  close() {
    if (this.activeModal) {
      this.activeModal.close();
      this.activeModal = null;
    }
  },

  calculateDemurrage(s: Shipment) {
    if (!s.portArrivalDate) return { days: 0, cost: 0, overdue: false };
    const arrival = new Date(s.portArrivalDate);
    const today = new Date("2026-04-25");
    const diffDays = Math.ceil(
      Math.abs(today.getTime() - arrival.getTime()) / (1000 * 60 * 60 * 24),
    );
    const overdue = diffDays > s.freeTimeDays;
    const cost = overdue ? (diffDays - s.freeTimeDays) * s.demurrageRate : 0;
    return { days: diffDays, cost, overdue };
  },
};
