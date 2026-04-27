import Dexie, { Table } from 'dexie';
export interface LocalData {
    id?: number;
    key: string;
    value: any;
    updatedAt: number;
}
export declare class SharedDatabase extends Dexie {
    settings: Table<LocalData>;
    constructor(dbName: string);
    set(key: string, value: any): Promise<any>;
    get(key: string, fallback?: any): Promise<any>;
}
