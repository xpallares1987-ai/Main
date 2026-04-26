import BpmnModeler from 'https://esm.sh/bpmn-js@18.13.1/lib/Modeler?bundle';
import {
  BpmnPropertiesPanelModule,
  BpmnPropertiesProviderModule,
  ZeebePropertiesProviderModule,
} from 'https://esm.sh/bpmn-js-properties-panel@5.50.1?bundle';
import zeebeModdle from 'https://esm.sh/zeebe-bpmn-moddle@1.12.0/resources/zeebe?bundle';
import ZeebeBehaviorsModule from 'https://esm.sh/camunda-bpmn-js-behaviors@1.14.1/lib/camunda-cloud?bundle';
import MinimapModule from 'https://esm.sh/diagram-js-minimap@5.2.2?bundle';
import LintModule from 'https://esm.sh/bpmn-js-bpmnlint@1.0.1?bundle';

function resolveTarget(target) {
  if (!target) {
    throw new Error('Falta el contenedor requerido para inicializar el modelador');
  }

  if (typeof target === 'string') {
    const element = document.querySelector(target);

    if (!element) {
      throw new Error(`No se encontró el contenedor: ${target}`);
    }

    return element;
  }

  return target;
}

function buildAdditionalModules({
  propertiesPanel = true,
  camunda8 = true,
  zeebeSupport = true,
} = {}) {
  const modules = [MinimapModule, LintModule];

  if (propertiesPanel) {
    modules.push(BpmnPropertiesPanelModule, BpmnPropertiesProviderModule);
  }

  if (camunda8 && zeebeSupport) {
    modules.push(ZeebePropertiesProviderModule, ZeebeBehaviorsModule);
  }

  return modules;
}

function buildModdleExtensions({ camunda8 = true, zeebeSupport = true } = {}) {
  const extensions = {};

  if (camunda8 && zeebeSupport) {
    extensions.zeebe = zeebeModdle;
  }

  return extensions;
}

export function createModeler({
  container,
  properties,
  keyboardBindToWindow = true,
  camunda8 = true,
  propertiesPanel = true,
  zeebeSupport = true,
} = {}) {
  const containerNode = resolveTarget(container);
  const propertiesNode = propertiesPanel ? resolveTarget(properties) : null;

  return new BpmnModeler({
    container: containerNode,
    propertiesPanel: propertiesNode ? { parent: propertiesNode } : undefined,
    linting: {
      active: true,
    },
    additionalModules: buildAdditionalModules({
      propertiesPanel,
      camunda8,
      zeebeSupport,
    }),
    moddleExtensions: buildModdleExtensions({
      camunda8,
      zeebeSupport,
    }),
    keyboard: {
      bindTo: keyboardBindToWindow ? window : document,
    },
    exporter: {
      name: 'mi-aplicacion-bpmn',
      version: '1.0.0',
    },
  });
}

export async function importDiagram(modeler, xml) {
  if (!modeler) {
    throw new Error('El modelador BPMN no está inicializado');
  }

  if (!xml || typeof xml !== 'string') {
    throw new Error('No se recibió un XML BPMN válido');
  }

  const result = await modeler.importXML(xml);
  fitViewport(modeler);
  return result;
}

export async function getDiagramXml(modeler, format = true) {
  if (!modeler) {
    throw new Error('El modelador BPMN no está inicializado');
  }

  const { xml } = await modeler.saveXML({ format });
  return xml;
}

export function fitViewport(modeler) {
  if (!modeler) {
    return;
  }

  const canvas = modeler.get('canvas');
  canvas.zoom('fit-viewport', 'auto');
}

export function zoomByStep(modeler, delta = 0.1, zoomConfig = {}) {
  if (!modeler) {
    return;
  }

  const { min = 0.2, max = 4 } = zoomConfig;
  const canvas = modeler.get('canvas');
  const currentZoom = Number(canvas.zoom()) || 1;
  const nextZoom = Math.max(min, Math.min(max, currentZoom + delta));

  canvas.zoom(nextZoom);
}

export function attachPropertiesPanel(modeler, container) {
  if (!modeler) {
    return;
  }

  const target = resolveTarget(container);
  const propertiesPanel = modeler.get('propertiesPanel');

  if (propertiesPanel && typeof propertiesPanel.attachTo === 'function') {
    propertiesPanel.attachTo(target);
  }
}

export function detachPropertiesPanel(modeler) {
  if (!modeler) {
    return;
  }

  const propertiesPanel = modeler.get('propertiesPanel');

  if (propertiesPanel && typeof propertiesPanel.detach === 'function') {
    propertiesPanel.detach();
  }
}

export function destroyModeler(modeler) {
  if (!modeler) {
    return;
  }

  modeler.destroy();
}
