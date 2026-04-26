function ensureElement(element, name = 'elemento') {
  if (!element) {
    throw new Error(`No se recibió un ${name} válido`);
  }

  return element;
}

function setText(element, value) {
  ensureElement(element);
  element.textContent = typeof value === 'string' ? value : '';
}

export function setDiagramName(element, fileName) {
  ensureElement(element, 'elemento de nombre de diagrama');

  const safeName =
    typeof fileName === 'string' && fileName.trim() ? fileName.trim() : 'diagram.bpmn';

  setText(element, safeName);
  element.setAttribute('title', safeName);
}

export function setPropertiesPanelState(sidebarElement, isOpen) {
  ensureElement(sidebarElement, 'panel lateral');

  if (isOpen) {
    sidebarElement.classList.remove('sidebar--hidden');
    sidebarElement.setAttribute('aria-hidden', 'false');
    return;
  }

  sidebarElement.classList.add('sidebar--hidden');
  sidebarElement.setAttribute('aria-hidden', 'true');
}
