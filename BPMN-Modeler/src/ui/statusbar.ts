import { ensureElement } from "shared-utils";

export function createStatusbar({ statusElement, selectionElement }: any) {
  const statusEl = ensureElement(statusElement, "elemento de estado");
  const selectionEl = ensureElement(selectionElement, "elemento de selección");

  function setStatus(message: string, state: string = "") {
    statusEl.textContent = message;
    statusEl.className = `statusbar__status ${state ? `is-${state}` : ""}`;
  }

  return {
    setStatus,
    setSelection: (msg: string) => { selectionEl.textContent = msg; },
    setError: (msg: string) => setStatus(msg, "error"),
    setSuccess: (msg: string) => setStatus(msg, "success"),
    setWarning: (msg: string) => setStatus(msg, "warning"),
    reset: (status = "Listo", selection = "Sin selección") => {
      setStatus(status);
      selectionEl.textContent = selection;
    },
  };
}



