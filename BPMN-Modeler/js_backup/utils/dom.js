function ensureSelector(selector) {
  if (typeof selector !== 'string' || !selector.trim()) {
    throw new Error('El selector no es válido');
  }

  return selector.trim();
}

function ensureElement(element, name = 'elemento') {
  if (!element) {
    throw new Error(`No se encontró el ${name}`);
  }

  return element;
}

export function qs(selector, parent = document) {
  const safeSelector = ensureSelector(selector);
  const root = parent || document;
  return root.querySelector(safeSelector);
}

export function qsa(selector, parent = document) {
  const safeSelector = ensureSelector(selector);
  const root = parent || document;
  return Array.from(root.querySelectorAll(safeSelector));
}

export function byId(id, parent = document) {
  if (typeof id !== 'string' || !id.trim()) {
    throw new Error('El id no es válido');
  }

  const root = parent || document;
  return root.getElementById(id.trim());
}

export function show(element, display = '') {
  const safeElement = ensureElement(element);
  safeElement.style.display = display;
  safeElement.hidden = false;
  return safeElement;
}

export function hide(element) {
  const safeElement = ensureElement(element);
  safeElement.style.display = 'none';
  safeElement.hidden = true;
  return safeElement;
}

export function toggleVisibility(element, isVisible, display = '') {
  return isVisible ? show(element, display) : hide(element);
}

export function addClass(element, className) {
  const safeElement = ensureElement(element);
  if (className) {
    safeElement.classList.add(className);
  }
  return safeElement;
}

export function removeClass(element, className) {
  const safeElement = ensureElement(element);
  if (className) {
    safeElement.classList.remove(className);
  }
  return safeElement;
}

export function toggleClass(element, className, force) {
  const safeElement = ensureElement(element);
  if (!className) {
    return safeElement;
  }

  if (typeof force === 'boolean') {
    safeElement.classList.toggle(className, force);
  } else {
    safeElement.classList.toggle(className);
  }

  return safeElement;
}

export function setText(element, value) {
  const safeElement = ensureElement(element);
  safeElement.textContent = typeof value === 'string' ? value : '';
  return safeElement;
}

export function setHtml(element, value) {
  const safeElement = ensureElement(element);
  safeElement.innerHTML = typeof value === 'string' ? value : '';
  return safeElement;
}

export function setAttr(element, name, value) {
  const safeElement = ensureElement(element);

  if (!name) {
    return safeElement;
  }

  if (value === null || value === undefined || value === false) {
    safeElement.removeAttribute(name);
    return safeElement;
  }

  safeElement.setAttribute(name, String(value));
  return safeElement;
}

export function on(element, eventName, handler, options) {
  const safeElement = ensureElement(element);

  if (typeof handler !== 'function') {
    throw new Error(`El handler para ${eventName} no es válido`);
  }

  safeElement.addEventListener(eventName, handler, options);

  return () => {
    safeElement.removeEventListener(eventName, handler, options);
  };
}

export function off(element, eventName, handler, options) {
  const safeElement = ensureElement(element);

  if (typeof handler === 'function') {
    safeElement.removeEventListener(eventName, handler, options);
  }

  return safeElement;
}

export function createElement(tagName, options = {}) {
  if (typeof tagName !== 'string' || !tagName.trim()) {
    throw new Error('El tagName no es válido');
  }

  const element = document.createElement(tagName.trim());

  if (options.className) {
    element.className = options.className;
  }

  if (options.text) {
    element.textContent = options.text;
  }

  if (options.html) {
    element.innerHTML = options.html;
  }

  if (options.attributes && typeof options.attributes === 'object') {
    Object.entries(options.attributes).forEach(([name, value]) => {
      if (value !== null && value !== undefined && value !== false) {
        element.setAttribute(name, String(value));
      }
    });
  }

  return element;
}
