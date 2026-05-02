import Modeler from "bpmn-js/lib/Modeler";

function resolveTarget(target: string | HTMLElement): HTMLElement {
  if (!target)
    throw new Error(
      "Falta el contenedor requerido para inicializar el modelador",
    );
  if (typeof target === "string") {
    const element = document.querySelector(target) as HTMLElement;
    if (!element) throw new Error(`No se encontró el contenedor: ${target}`);
    return element;
  }
  return target;
}

export interface CreateModelerOptions {
  container: string | HTMLElement;
  properties: string | HTMLElement;
  keyboardBindToWindow?: boolean;
  camunda8?: boolean;
  propertiesPanel?: boolean;
  zeebeSupport?: boolean;
}

export async function createModeler({
  container,
  properties,
  keyboardBindToWindow = true,
  camunda8 = true,
  propertiesPanel = true,
  zeebeSupport = true,
}: CreateModelerOptions) {
  try {
    // Lazy load core BPMN dependencies
    const [
      { default: BpmnModeler },
      { default: zeebeModdle },
      { default: ZeebeBehaviorsModule },
      { default: MinimapModule },
      { default: LintModule },
    ] = await Promise.all([
      import("bpmn-js/lib/Modeler"),
      import("zeebe-bpmn-moddle/resources/zeebe.json"),
      import("camunda-bpmn-js-behaviors/lib/camunda-cloud"),
      import("diagram-js-minimap"),
      import("bpmn-js-bpmnlint"),
    ]);

    const containerNode = resolveTarget(container);
    const additionalModules = [MinimapModule, LintModule];
    let moddleExtensions = {};

    if (camunda8 && zeebeSupport) {
      additionalModules.push(ZeebeBehaviorsModule);
      moddleExtensions = { zeebe: zeebeModdle };
    }

    if (propertiesPanel) {
      const {
        BpmnPropertiesPanelModule,
        BpmnPropertiesProviderModule,
        ZeebePropertiesProviderModule,
      } = await import("bpmn-js-properties-panel");

      additionalModules.push(
        BpmnPropertiesPanelModule,
        BpmnPropertiesProviderModule,
      );
      if (camunda8 && zeebeSupport) {
        additionalModules.push(ZeebePropertiesProviderModule);
      }
    }

    const propertiesNode = propertiesPanel ? resolveTarget(properties) : null;

    return new BpmnModeler({
      container: containerNode,
      propertiesPanel: propertiesNode ? { parent: propertiesNode } : undefined,
      linting: { active: true },
      additionalModules,
      moddleExtensions,
      keyboard: {
        bindTo: keyboardBindToWindow ? window : document,
      },
    });
  } catch (error) {
    console.error("Fallo crítico al cargar el motor de modelado BPMN:", error);
    throw new Error(
      "No se pudo iniciar el modelador. Verifique su conexión a internet.",
    );
  }
}

export async function importDiagram(modeler: Modeler, xml: string) {
  if (!modeler) throw new Error("El modelador BPMN no está inicializado");
  const result = await modeler.importXML(xml);
  fitViewport(modeler);
  return result;
}

export async function getDiagramXml(
  modeler: Modeler,
  format = true,
): Promise<string> {
  if (!modeler) throw new Error("El modelador BPMN no está inicializado");
  const { xml } = await modeler.saveXML({ format });
  return xml || "";
}

export function fitViewport(modeler: Modeler) {
  if (!modeler) return;
  const canvas = modeler.get("canvas") as unknown as {
    zoom: (step: string, center: string) => void;
  };
  if (canvas) canvas.zoom("fit-viewport", "auto");
}

export function zoomByStep(modeler: Modeler, delta = 0.1) {
  if (!modeler) return;
  const canvas = modeler.get("canvas") as unknown as {
    zoom: (level?: number) => number;
  };
  const currentZoom = canvas.zoom();
  canvas.zoom(Math.min(Math.max(0.2, currentZoom + delta), 4));
}

export function attachPropertiesPanel(
  modeler: Modeler,
  container: string | HTMLElement,
) {
  if (!modeler) return;
  const target = resolveTarget(container);
  const panel = modeler.get("propertiesPanel") as unknown as {
    attachTo: (el: HTMLElement) => void;
  };
  panel.attachTo(target);
}

export function cleanupModeler(modeler: Modeler) {
  if (!modeler) return;
  try {
    modeler.destroy();
  } catch (error) {
    console.error("Error al destruir el modelador:", error);
  }
}

export function detachPropertiesPanel(modeler: Modeler) {
  if (!modeler) return;
  const panel = modeler.get("propertiesPanel") as unknown as {
    detach: () => void;
  };
  if (panel) panel.detach();
}

interface BpmnElement {
  id: string;
  type: string;
  businessObject: {
    name?: string;
    [key: string]: unknown;
  };
}

interface ElementRegistry {
  filter(cb: (element: BpmnElement) => boolean): BpmnElement[];
  get(id: string): BpmnElement | undefined;
}

interface BpmnCanvas {
  zoom(level: string | number, center?: BpmnElement | { x: number; y: number } | "auto"): void;
}

interface BpmnSelection {
  select(element: BpmnElement | BpmnElement[]): void;
}

export function searchElements(modeler: Modeler, term: string): BpmnElement[] {
  if (!modeler || !term) return [];
  const elementRegistry = modeler.get("elementRegistry") as unknown as ElementRegistry;
  const termLower = term.toLowerCase();

  return elementRegistry.filter((element) => {
    const businessObject = element.businessObject;
    const nameMatch = businessObject && businessObject.name && businessObject.name.toLowerCase().includes(termLower);
    const idMatch = element.id && element.id.toLowerCase().includes(termLower);
    return Boolean(nameMatch || idMatch);
  });
}

export function highlightElement(modeler: Modeler, element: BpmnElement) {
  if (!modeler || !element) return;
  const canvas = modeler.get("canvas") as unknown as BpmnCanvas;
  const selection = modeler.get("selection") as unknown as BpmnSelection;

  selection.select(element);
  canvas.zoom(1.0, element);
}
