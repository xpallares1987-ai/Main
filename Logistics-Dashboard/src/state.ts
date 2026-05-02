import { AppState } from './types';

export const state: AppState = {
    db: {},
    currentTab: "",
    filterRes: [],
    pIndex: 1,
    sortCol: "",
    sortAsc: true,
    theme: (localStorage.getItem('theme') as 'light' | 'dark') || 'light',
};

export function resetState() {
    state.db = {};
    state.currentTab = "";
    state.filterRes = [];
    state.pIndex = 1;
    state.sortCol = "";
    state.sortAsc = true;
}


