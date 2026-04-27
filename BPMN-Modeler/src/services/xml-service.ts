import { getDiagramXml as getModelerDiagramXml } from "./modeler-service";
import { downloadFile, openTextFile, resetFileInput } from "./file-service";

function sanitizeXml(xml: string): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, "application/xml");
  
  // Basic XSS prevention: remove <script> tags and on* attributes
  const scripts = doc.getElementsByTagName("script");
  for (let i = scripts.length - 1; i >= 0; i--) {
    scripts[i].parentNode?.removeChild(scripts[i]);
  }

  const allElements = doc.getElementsByTagName("*");
  for (let i = 0; i < allElements.length; i++) {
    const el = allElements[i];
    const attrs = el.attributes;
    for (let j = attrs.length - 1; j >= 0; j--) {
      const attrName = attrs[j].name.toLowerCase();
      if (attrName.startsWith("on")) {
        el.removeAttribute(attrs[j].name);
      }
    }
  }

  return new XMLSerializer().serializeToString(doc);
}

export async function loadXmlFromUrl(url: string) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`No se pudo cargar: ${url}`);
  const xml = await response.text();
  return sanitizeXml(xml);
}

export async function openLocalXmlFromInput(fileInput: HTMLInputElement) {
  const result = await openTextFile(fileInput);
  if (!result) return null;
  try {
    return {
      name: result.name || "diagram.bpmn",
      xml: sanitizeXml(result.text),
    };
  } finally {
    resetFileInput(fileInput);
  }
}

export async function getDiagramXml(modeler: any, format = true) {
  return await getModelerDiagramXml(modeler, format);
}

export async function downloadXmlFile(fileName: string, xml: string) {
  return downloadFile(fileName, xml, "application/xml;charset=utf-8");
}


