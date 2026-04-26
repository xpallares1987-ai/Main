import { getDiagramXml as getModelerDiagramXml } from './modeler-service.js';
import { readFileAsText, downloadFile, openTextFile, resetFileInput } from './file-service.js';

function ensureText(value, errorMessage) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(errorMessage);
  }

  return value;
}

function normalizeXml(xml) {
  return ensureText(xml, 'El contenido XML está vacío').replace(/\r\n/g, '\n').trim();
}

function parseXml(xml) {
  const parser = new DOMParser();
  const documentXml = parser.parseFromString(xml, 'application/xml');
  const parserError = documentXml.querySelector('parsererror');

  if (parserError) {
    throw new Error('El archivo no contiene un XML válido');
  }

  return documentXml;
}

function isBpmnDefinitions(documentXml, xml) {
  const root = documentXml.documentElement;

  if (!root) {
    return false;
  }

  const localName = String(root.localName || root.nodeName || '').toLowerCase();
  const namespace = String(root.namespaceURI || '');

  if (localName === 'definitions') {
    return true;
  }

  if (namespace.includes('BPMN/20100524/MODEL')) {
    return true;
  }

  if (xml.includes('<bpmn:definitions') || xml.includes('<definitions')) {
    return true;
  }

  return false;
}

function ensureBpmnXml(xml) {
  const safeXml = normalizeXml(xml);
  const documentXml = parseXml(safeXml);

  if (!isBpmnDefinitions(documentXml, safeXml)) {
    throw new Error('El archivo no parece un BPMN válido');
  }

  return safeXml;
}

function ensureFileName(fileName) {
  const safeName = ensureText(fileName, 'El nombre del archivo es obligatorio').trim();

  if (safeName.endsWith('.bpmn') || safeName.endsWith('.xml')) {
    return safeName;
  }

  return `${safeName}.bpmn`;
}

export async function loadXmlFromUrl(url) {
  ensureText(url, 'La ruta del archivo es obligatoria');

  const response = await fetch(url, {
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`No se pudo cargar el archivo: ${url}`);
  }

  const xml = await response.text();
  return ensureBpmnXml(xml);
}

export async function openLocalXmlFile(file) {
  if (!file) {
    throw new Error('No se recibió ningún archivo');
  }

  const xml = await readFileAsText(file);

  return {
    name: ensureFileName(file.name || 'diagram.bpmn'),
    xml: ensureBpmnXml(xml),
  };
}

export async function openLocalXmlFromInput(fileInput) {
  const result = await openTextFile(fileInput);

  if (!result) {
    return null;
  }

  try {
    return {
      name: ensureFileName(result.name || 'diagram.bpmn'),
      xml: ensureBpmnXml(result.text),
    };
  } finally {
    resetFileInput(fileInput);
  }
}

export async function getDiagramXml(modeler, format = true) {
  const xml = await getModelerDiagramXml(modeler, format);
  return ensureBpmnXml(xml);
}

export async function downloadXmlFile(fileName, xml, mimeType = 'application/xml;charset=utf-8') {
  const safeFileName = ensureFileName(fileName);
  const safeXml = ensureBpmnXml(xml);

  return downloadFile(safeFileName, safeXml, mimeType);
}

export function validateXml(xml) {
  return parseXml(normalizeXml(xml));
}

export function validateBpmnXml(xml) {
  return ensureBpmnXml(xml);
}
