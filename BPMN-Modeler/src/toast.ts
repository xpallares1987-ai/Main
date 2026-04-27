import APP_CONFIG from "./config";
import { qs } from "shared-utils";

export type ToastType = "info" | "success" | "warning" | "error";

export function showToast(message: string, type: ToastType = "info", duration: number = 4000) {
  const container = qs(APP_CONFIG.selectors.toastContainer);
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = `toast toast--${type}`;
  toast.textContent = message;

  container.appendChild(toast);

  // Trigger animation
  requestAnimationFrame(() => {
    toast.classList.add("toast--visible");
  });

  setTimeout(() => {
    toast.classList.remove("toast--visible");
    toast.addEventListener("transitionend", () => {
      toast.remove();
    }, { once: true });
  }, duration);
}

