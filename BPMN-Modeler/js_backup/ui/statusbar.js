import { ensureElement } from "../utils/helpers.js";

function clearStateClasses(element) {
  element.classList.remove("is-error", "is-success", "is-warning");
}

function applyStateClass(element, state) {
  clearStateClasses(element);
  if (state === "error") element.classList.add("is-error");
  else if (state === "success") element.classList.add("is-success");
  else if (state === "warning") element.classList.add("is-warning");
}

export function createStatusbar({ statusElement, selectionElement }) {
  const statusEl = ensureElement(statusElement, "elemento de estado");
  const selectionEl = ensureElement(selectionElement, "elemento de selección");

  function setStatus(message, state = "") {
    statusEl.textContent = typeof message === "string" ? message : "";
    applyStateClass(statusEl, state);
  }

  return {
    setStatus,
    setSelection: (msg) => { selectionEl.textContent = typeof msg === "string" ? msg : ""; },
    setError: (msg) => setStatus(msg, "error"),
    setSuccess: (msg) => setStatus(msg, "success"),
    setWarning: (msg) => setStatus(msg, "warning"),
    reset: (status = "Listo", selection = "Sin selección") => {
      setStatus(status);
      selectionEl.textContent = selection;
    },
  };
}
