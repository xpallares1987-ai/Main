import { escapeHTML } from "@torre/shared";

export interface ModalOptions {
  title?: string;
  id?: string;
  onClose?: () => void;
  maxWidth?: string;
}

export const Modal = {
  create(content: string | HTMLElement, options: ModalOptions = {}) {
    const { 
      title = "", 
      id = "shared-modal", 
      onClose,
      maxWidth = "600px"
    } = options;

    // Remove existing if any
    const existing = document.getElementById(id);
    if (existing) existing.remove();

    const modalOverlay = document.createElement("div");
    modalOverlay.id = id;
    modalOverlay.className = "modal-overlay";
    modalOverlay.style.display = "flex";

    const safeTitle = escapeHTML(title);

    modalOverlay.innerHTML = `
      <div class="modal-content ff-card" style="max-width: ${maxWidth}; width: 100%;">
        <div class="modal-header">
          <h2 class="modal-title">${safeTitle}</h2>
          <button class="modal-close-btn" aria-label="Cerrar">&times;</button>
        </div>
        <div class="modal-body"></div>
      </div>
    `;

    const bodyContainer = modalOverlay.querySelector(".modal-body") as HTMLElement;
    if (typeof content === "string") {
      // If we must use innerHTML for legacy support, we should ideally sanitize it
      // but for now we follow the pattern while at least securing the title
      bodyContainer.innerHTML = content;
    } else {
      bodyContainer.appendChild(content);
    }

    document.body.appendChild(modalOverlay);
    document.body.style.overflow = "hidden";

    const close = () => {
      modalOverlay.remove();
      document.body.style.overflow = "auto";
      if (onClose) onClose();
    };

    modalOverlay.querySelector(".modal-close-btn")?.addEventListener("click", close);
    modalOverlay.addEventListener("click", (e) => {
      if (e.target === modalOverlay) close();
    });

    return {
      close,
      element: modalOverlay
    };
  }
};

export interface ModalInstance {
  close: () => void;
  element: HTMLElement;
}
