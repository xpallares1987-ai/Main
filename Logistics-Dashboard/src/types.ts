export interface DataRow {
    [key: string]: string | number | boolean | Date | DataRow[] | undefined;
    _children?: DataRow[];
}

export interface Database {
    [sheetName: string]: DataRow[];
}

export interface AppState {
    db: Database;
    currentTab: string;
    filterRes: DataRow[];
    pIndex: number;
    sortCol: string;
    sortAsc: boolean;
}

export interface FilterCriteria {
    [column: string]: string[];
}


