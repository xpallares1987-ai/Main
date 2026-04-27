import BpmnModeler from "bpmn-js/lib/Modeler";
import {
  BpmnPropertiesPanelModule,
  BpmnPropertiesProviderModule,
  ZeebePropertiesProviderModule,
} from "bpmn-js-properties-panel";
import zeebeModdle from "zeebe-bpmn-moddle/resources/zeebe.json";
import ZeebeBehaviorsModule from "camunda-bpmn-js-behaviors/lib/camunda-cloud";
import MinimapModule from "diagram-js-minimap";
import LintModule from "bpmn-js-bpmnlint";

function resolveTarget(target: string | HTMLElement): HTMLElement {
  if (!target) throw new Error("Falta el contenedor requerido para inicializar el modelador");
  if (typeof target === "string") {
    const element = document.querySelector(target) as HTMLElement;
    if (!element) throw new Error(`No se encontró el contenedor: ${target}`);
    return element;
  }
  return target;
}

export function createModeler({
  container,
  properties,
  keyboardBindToWindow = true,
  camunda8 = true,
  propertiesPanel = true,
  zeebeSupport = true,
}: any) {
  const containerNode = resolveTarget(container);
  const propertiesNode = propertiesPanel ? resolveTarget(properties) : null;

  return new BpmnModeler({
    container: containerNode,
    propertiesPanel: propertiesNode ? { parent: propertiesNode } : undefined,
    linting: { active: true },
    additionalModules: [
      MinimapModule,
      LintModule,
      ...(propertiesPanel ? [BpmnPropertiesPanelModule, BpmnPropertiesProviderModule] : []),
      ...(camunda8 && zeebeSupport ? [ZeebePropertiesProviderModule, ZeebeBehaviorsModule] : []),
    ],
    moddleExtensions: {
      ...(camunda8 && zeebeSupport ? { zeebe: zeebeModdle } : {}),
    },
    keyboard: {
      bindTo: keyboardBindToWindow ? window : document,
    },
  });
}

export async function importDiagram(modeler: any, xml: string) {
  if (!modeler) throw new Error("El modelador BPMN no está inicializado");
  const result = await modeler.importXML(xml);
  fitViewport(modeler);
  return result;
}

export async function getDiagramXml(modeler: any, format = true) {
  if (!modeler) throw new Error("El modelador BPMN no está inicializado");
  const { xml } = await modeler.saveXML({ format });
  return xml;
}

export function fitViewport(modeler: any) {
  if (!modeler) return;
  modeler.get("canvas").zoom("fit-viewport", "auto");
}

export function zoomByStep(modeler: any, delta = 0.1) {
  if (!modeler) return;
  const canvas = modeler.get("canvas");
  const currentZoom = canvas.zoom();
  canvas.zoom(Math.min(Math.max(0.2, currentZoom + delta), 4));
}

export function attachPropertiesPanel(modeler: any, container: string | HTMLElement) {
  if (!modeler) return;
  const target = resolveTarget(container);
  modeler.get("propertiesPanel").attachTo(target);
}

export function cleanupModeler(modeler: any) {
  if (!modeler) return;
  try {
    modeler.destroy();
  } catch (error) {
    console.error("Error al destruir el modelador:", error);
  }
}

export function detachPropertiesPanel(modeler: any) {
  if (!modeler) return;
  modeler.get("propertiesPanel").detach();
}


