import { AppState } from "./types";
import APP_CONFIG from "./config";

export const state:
  AppState = {
    modeler: null,
    tabs: [],
    activeTabId: "",
    propertiesPanelOpen: APP_CONFIG.ui.propertiesPanelOpen,
    theme: localStorage.getItem("theme") || "light",
    toolbar: null,
    sidebar: null,
    cleanups: [],
  };

export function getActiveTab() {
  return state.tabs.find(t => t.id === state.activeTabId);
  }

export function
  updateTheme(theme: string) {
    state.theme = theme;
    document.body.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }


