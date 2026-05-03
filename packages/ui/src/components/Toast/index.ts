import { qs } from "@torre/shared";

export type ToastType = "info" | "success" | "warning" | "error";

export interface ToastOptions {
  duration?: number;
  containerSelector?: string;
}

export const Toast = {
  show(message: string, type: ToastType = "info", options: ToastOptions = {}) {
    const { duration = 4000, containerSelector = "#toast-container" } = options;
    
    let container = qs(containerSelector);
    if (!container) {
      container = this.createContainer(containerSelector.replace("#", ""));
    }

    const toast = document.createElement("div");
    toast.className = `toast toast--${type}`;
    toast.textContent = message;

    container.appendChild(toast);

    // Trigger reflow for animation
    void toast.offsetHeight;
    toast.classList.add("toast--visible");

    const removeToast = () => {
      toast.classList.remove("toast--visible");
      setTimeout(() => {
        if (toast.parentNode) {
          toast.remove();
        }
      }, 400);
    };

    setTimeout(removeToast, duration);
  },

  createContainer(id: string) {
    const container = document.createElement("div");
    container.id = id;
    container.className = "toast-container";
    document.body.appendChild(container);
    return container;
  }
};
