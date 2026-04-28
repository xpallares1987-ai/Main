import * as XLSX from 'xlsx';
import { processData } from './excelParser';
import { DataRow } from '../types';

self.onmessage = async (e: MessageEvent) => {
    const { data: fileBuffer } = e;
    
    try {
        const workbook = XLSX.read(fileBuffer, { type: 'array', cellDates: true });
        const db: Record<string, DataRow[]> = {};
        
        let listData: Record<string, unknown>[] = [], contentData: Record<string, unknown>[] = [];

        workbook.SheetNames.forEach(name => {
            const json = XLSX.utils.sheet_to_json(workbook.Sheets[name], { defval: "" }) as Record<string, unknown>[];
            if (json.length === 0) return;

            if (name.includes('Pending Receptions List')) listData = json;
            else if (name.includes('Pending Receptions Content')) contentData = json;
            else db[name] = processData(json);
        });

        if (listData.length > 0 && contentData.length > 0) {
            const aList = processData(listData);
            const aContent = processData(contentData);
            aList.forEach(parent => {
                parent._children = aContent.filter(c => c['Load Code'] === parent['Load Code']);
            });
            db['Pending Receptions Unificado'] = aList;
        } else {
            if (listData.length > 0) db['Pending Receptions List'] = processData(listData);
            if (contentData.length > 0) db['Pending Receptions Content'] = processData(contentData);
        }

        self.postMessage({ success: true, db });
    } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
        self.postMessage({ success: false, error: errorMessage });
    }
};


