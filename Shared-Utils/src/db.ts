import Dexie, { Table } from 'dexie';

export interface LocalData {
  id?: number;
  key: string;
  value: any;
  updatedAt: number;
}

export class SharedDatabase extends Dexie {
  settings!: Table<LocalData>;

  constructor(dbName: string) {
    super(dbName);
    this.version(1).stores({
      settings: '++id, key'
    });
  }

  async set(key: string, value: any) {
    const existing = await this.settings.where({ key }).first();
    if (existing) {
      return this.settings.update(existing.id!, { value, updatedAt: Date.now() });
    }
    return this.settings.add({ key, value, updatedAt: Date.now() });
  }

  async get<T>(key: string, fallback: T): Promise<T> {
    const item = await this.settings.where({ key }).first();
    return item ? (item.value as T) : fallback;
  }
}
