function isStorageAvailable() {
  try {
    const storage = window.localStorage;
    const testKey = '__mi_aplicacion_test__';

    storage.setItem(testKey, '1');
    storage.removeItem(testKey);

    return true;
  } catch (error) {
    return false;
  }
}

function ensureKeys(keys) {
  if (!keys || typeof keys !== 'object') {
    throw new Error('Las claves de storage no son válidas');
  }

  return keys;
}

function safeParseJson(value, fallback = null) {
  if (!value || typeof value !== 'string') {
    return fallback;
  }

  try {
    return JSON.parse(value);
  } catch (error) {
    return fallback;
  }
}

function safeSetItem(key, value) {
  if (!isStorageAvailable()) {
    return false;
  }

  try {
    window.localStorage.setItem(key, value);
    return true;
  } catch (error) {
    return false;
  }
}

function safeGetItem(key) {
  if (!isStorageAvailable()) {
    return null;
  }

  try {
    return window.localStorage.getItem(key);
  } catch (error) {
    return null;
  }
}

function safeRemoveItem(key) {
  if (!isStorageAvailable()) {
    return false;
  }

  try {
    window.localStorage.removeItem(key);
    return true;
  } catch (error) {
    return false;
  }
}

function normalizeText(value) {
  if (typeof value !== 'string') {
    return '';
  }

  return value.trim();
}

export function saveDiagramSession(keys, payload = {}) {
  const safeKeys = ensureKeys(keys);
  const xml = normalizeText(payload.xml);
  const name = normalizeText(payload.name);

  if (!xml) {
    return false;
  }

  const xmlSaved = safeSetItem(safeKeys.diagramXml, xml);
  const nameSaved = safeSetItem(safeKeys.diagramName, name || 'diagram.bpmn');

  return xmlSaved && nameSaved;
}

export function loadDiagramSession(keys) {
  const safeKeys = ensureKeys(keys);

  const xml = normalizeText(safeGetItem(safeKeys.diagramXml));
  const name = normalizeText(safeGetItem(safeKeys.diagramName));

  if (!xml) {
    return null;
  }

  return {
    xml,
    name: name || 'diagram.bpmn',
  };
}

export function clearDiagramSession(keys) {
  const safeKeys = ensureKeys(keys);

  const xmlRemoved = safeRemoveItem(safeKeys.diagramXml);
  const nameRemoved = safeRemoveItem(safeKeys.diagramName);

  return xmlRemoved || nameRemoved;
}

export function saveUiSession(keys, uiState = {}) {
  const safeKeys = ensureKeys(keys);

  if (!safeKeys.uiState) {
    return false;
  }

  const payload = JSON.stringify({
    propertiesPanelOpen: Boolean(uiState.propertiesPanelOpen),
  });

  return safeSetItem(safeKeys.uiState, payload);
}

export function loadUiSession(keys) {
  const safeKeys = ensureKeys(keys);

  if (!safeKeys.uiState) {
    return null;
  }

  const raw = safeGetItem(safeKeys.uiState);
  const parsed = safeParseJson(raw, null);

  if (!parsed || typeof parsed !== 'object') {
    return null;
  }

  return {
    propertiesPanelOpen: Boolean(parsed.propertiesPanelOpen),
  };
}

export function clearUiSession(keys) {
  const safeKeys = ensureKeys(keys);

  if (!safeKeys.uiState) {
    return false;
  }

  return safeRemoveItem(safeKeys.uiState);
}

export function clearAllSession(keys) {
  const diagramCleared = clearDiagramSession(keys);
  const uiCleared = clearUiSession(keys);

  return diagramCleared || uiCleared;
}
