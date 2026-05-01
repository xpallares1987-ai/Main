import APP_CONFIG from "./config";
import { qs } from "./utils/dom";

export type ToastType = "info" | "success" | "warning" | "error";

export function showToast(
  message: string,
  type: ToastType = "info",
  duration: number = 4000,
) {
  const container = qs(APP_CONFIG.selectors.toastContainer);
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = `toast toast--${type}`;
  toast.textContent = message;

  container.appendChild(toast);

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
}
