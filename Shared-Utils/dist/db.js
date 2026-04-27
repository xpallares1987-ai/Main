import Dexie from 'dexie';
export class SharedDatabase extends Dexie {
    settings;
    constructor(dbName) {
        super(dbName);
        this.version(1).stores({
            settings: '++id, key'
        });
    }
    async set(key, value) {
        const existing = await this.settings.where({ key }).first();
        if (existing) {
            return this.settings.update(existing.id, { value, updatedAt: Date.now() });
        }
        return this.settings.add({ key, value, updatedAt: Date.now() });
    }
    async get(key, fallback = null) {
        const item = await this.settings.where({ key }).first();
        return item ? item.value : fallback;
    }
}
