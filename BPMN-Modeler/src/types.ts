import Modeler from "bpmn-js/lib/Modeler";

export interface DiagramTab {
  id: string;
  name: string;
  xml: string;
  isDirty: boolean;
}

export interface AppUi {
  canvas: HTMLElement;
  properties: HTMLElement;
  propertiesSidebar: HTMLElement;
  statusText: HTMLElement;
  selectionText: HTMLElement;
  diagramName: HTMLElement;
  fileInput: HTMLInputElement;
  btnNew: HTMLButtonElement;
  btnOpen: HTMLButtonElement;
  btnSave: HTMLButtonElement;
  btnExport: HTMLButtonElement;
  btnTheme: HTMLButtonElement;
  btnShortcuts: HTMLButtonElement;
  btnCloud: HTMLButtonElement;
  btnLogistics: HTMLButtonElement;
  btnFit: HTMLButtonElement;
  btnZoomIn: HTMLButtonElement;
  btnZoomOut: HTMLButtonElement;
  btnToggleProperties: HTMLButtonElement;
  shortcutsModal: HTMLDialogElement;
  btnCloseModal: HTMLButtonElement;
  cloudModal: HTMLDialogElement;
  btnCloseCloudModal: HTMLButtonElement;
  githubTokenInput: HTMLInputElement;
  btnCloudSync: HTMLButtonElement;
  tabsContainer: HTMLElement;
  btnAddTab: HTMLButtonElement;
  toastContainer: HTMLElement;
}

export interface AppState {
  modeler: Modeler | null;
  tabs: DiagramTab[];
  activeTabId: string;
  propertiesPanelOpen: boolean;
  theme: string;
  toolbar: any; // Defer specialized types if complex
  sidebar: any;
  cleanups: Function[];
}
