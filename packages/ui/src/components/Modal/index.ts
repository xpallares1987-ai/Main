export interface ModalOptions {
  title?: string;
  id?: string;
  onClose?: () => void;
  maxWidth?: string;
}

export const Modal = {
  create(contentHtml: string, options: ModalOptions = {}) {
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

    modalOverlay.innerHTML = `
      <div class="modal-content ff-card" style="max-width: ${maxWidth}; width: 100%;">
        <div class="modal-header">
          <h2 class="modal-title">${title}</h2>
          <button class="modal-close-btn" aria-label="Cerrar">&times;</button>
        </div>
        <div class="modal-body">
          ${contentHtml}
        </div>
      </div>
    `;

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
