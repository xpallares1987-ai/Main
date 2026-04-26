const APP_CONFIG = {
  app: {
    name: 'BPMN 2.0 Interactive Modeler',
    version: '1.0.0',
    engine: 'camunda 8',
    language: 'es',
  },

  paths: {
    defaultDiagram: './xml/diagrams/blank-process.bpmn',
    mainDiagram: './xml/diagrams/process-main.bpmn',
    logisticsSeaExport: './xml/templates/sea-export.bpmn', logisticsSeaImport: './xml/templates/sea-import.bpmn',
    appConfig: './xml/config/app-config.xml',
    elementTemplates: './.camunda/element-templates/',
  },

  selectors: {
    canvas: '#canvas',
    properties: '#properties',
    propertiesSidebar: '#propertiesSidebar',
    statusText: '#statusText',
    selectionText: '#selectionText',
    diagramName: '#diagramName',
    fileInput: '#fileInput',
    btnNew: '#btnNew',
    btnOpen: '#btnOpen',
    btnSave: '#btnSave',
    btnExport: '#btnExport',
    btnTheme: '#btnTheme',
    btnShortcuts: '#btnShortcuts',
    btnCloud: '#btnCloud',
    btnLogistics: '#btnLogistics',
    btnFit: '#btnFit',
    btnZoomIn: '#btnZoomIn',
    btnZoomOut: '#btnZoomOut',
    btnToggleProperties: '#btnToggleProperties',
    shortcutsModal: '#shortcutsModal',
    btnCloseModal: '#btnCloseModal',
    cloudModal: '#cloudModal',
    btnCloseCloudModal: '#btnCloseCloudModal',
    githubTokenInput: '#githubToken',
    btnCloudSync: '#btnCloudSync',
  },

  storage: {
    enabled: true,
    keys: {
      diagramXml: 'bpmn.diagram-xml',
      diagramName: 'bpmn.diagram-name',
      uiState: 'bpmn.ui-state',
      appConfig: 'bpmn.app-config',
      elementTemplates: 'bpmn.element-templates',
      githubToken: 'bpmn.github-token',
      gistId: 'bpmn.gist-id',
    },
  },

  ui: {
    propertiesPanelOpen: true,
    fitViewportOnLoad: true,
    autoSave: true,
    statusReady: 'Listo',
    statusLoading: 'Cargando diagrama...',
    statusImported: 'Diagrama cargado',
    statusSaved: 'Diagrama guardado',
    statusUnsaved: 'Cambios sin guardar',
    statusNoSelection: 'Sin selección',
  },

  zoom: {
    min: 0.2,
    max: 4,
    step: 0.1,
  },

  download: {
    defaultFileName: 'diagram.bpmn',
    mimeType: 'application/xml;charset=utf-8',
  },

  modeler: {
    keyboardBindToWindow: true,
    camunda8: true,
    propertiesPanel: true,
    zeebeSupport: true,
  },
};

export default APP_CONFIG;
