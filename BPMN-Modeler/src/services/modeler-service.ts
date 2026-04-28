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
    // Lazy load BPMN dependencies to optimize initial bundle size
    const [
      { default: BpmnModeler },
      {
        BpmnPropertiesPanelModule,
        BpmnPropertiesProviderModule,
        ZeebePropertiesProviderModule,
      },
      { default: zeebeModdle },
      { default: ZeebeBehaviorsModule },
      { default: MinimapModule },
      { default: LintModule },
    ] = await Promise.all([
      import("bpmn-js/lib/Modeler"),
      import("bpmn-js-properties-panel"),
      import("zeebe-bpmn-moddle/resources/zeebe.json"),
      import("camunda-bpmn-js-behaviors/lib/camunda-cloud"),
      import("diagram-js-minimap"),
      import("bpmn-js-bpmnlint"),
    ]);

    const containerNode = resolveTarget(container);
    const propertiesNode = propertiesPanel ? resolveTarget(properties) : null;

    return new BpmnModeler({
      container: containerNode,
      propertiesPanel: propertiesNode ? { parent: propertiesNode } : undefined,
      linting: { active: true },
      additionalModules: [
        MinimapModule,
        LintModule,
        ...(propertiesPanel
          ? [BpmnPropertiesPanelModule, BpmnPropertiesProviderModule]
          : []),
        ...(camunda8 && zeebeSupport
          ? [ZeebePropertiesProviderModule, ZeebeBehaviorsModule]
          : []),
      ],
      moddleExtensions: {
        ...(camunda8 && zeebeSupport ? { zeebe: zeebeModdle } : {}),
      },
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
