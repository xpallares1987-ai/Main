import { ensureElement } from "../utils/helpers";
import { DiagramTab } from "../types";

export function setDiagramName(element: HTMLElement, fileName: string) {
  ensureElement(element, "elemento de nombre de diagrama");
  const safeName = fileName && fileName.trim() ? fileName.trim() : "diagram.bpmn";
  element.textContent = safeName;
}

export function renderTabs(
  container: HTMLElement,
  tabs: DiagramTab[],
  activeTabId: string,
  onSwitch: (id: string) => void,
  onClose: (id: string) => void
) {
  ensureElement(container, "contenedor de pestañas");
  container.innerHTML = "";

  tabs.forEach((tab) => {
    const tabEl = document.createElement("div");
    tabEl.className = `tab ${tab.id === activeTabId ? "tab--active" : ""} ${tab.isDirty ? "tab--dirty" : ""}`;
    
    const labelEl = document.createElement("span");
    labelEl.className = "tab__label";
    labelEl.textContent = tab.name;
    labelEl.onclick = () => onSwitch(tab.id);

    const closeEl = document.createElement("button");
    closeEl.className = "tab__close";
    closeEl.innerHTML = "&times;";
    closeEl.onclick = (e) => {
      e.stopPropagation();
      onClose(tab.id);
    };

    tabEl.appendChild(labelEl);
    tabEl.appendChild(closeEl);
    container.appendChild(tabEl);
  });
}
