import * as XLSX from 'xlsx';
import { BLACK_COLS, BRANCH_MAP } from '../config';
import { DataRow } from '../types';

export function processData(data: any[]): DataRow[] {
    return data.map(row => {
        const clean: DataRow = {};
        let wt = 0;
        let isKgs = false;

        for (let k in row) {
            let key = k.trim();
            if (BLACK_COLS.includes(key)) continue;
            let val = row[k];
            
            if (val instanceof Date) { }
            else if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}/.test(val)) {
                const d = new Date(val);
                if(!isNaN(d.getTime())) val = d;
            }
            
            if (key === "Branch") val = BRANCH_MAP[val] || val;
            
            let keyUpper = key.toUpperCase();
            if (keyUpper.includes('WEIGHT')) {
                let valNum = Number(val) || 0;
                if (keyUpper.includes('KG')) { wt = valNum; isKgs = true; }
                else if (keyUpper.includes('TON')) { wt = valNum; isKgs = false; }
                else { wt = valNum; }
            }

            clean[key] = val;
        }
        
        let gr = row['Grammage (GM)'] || row['Grammage'];
        let dia = row['Diameter (CM)'] || row['Diameter'];
        let wid = row['Roll Width (CM)'] || row['Roll Width'];
        if (gr && dia && wid) {
            clean['Calidad'] = `${gr}g x ${dia}cm x ${wid}cm`;
        }

        clean['Weight (Tons)'] = isKgs ? wt / 1000 : wt;
        
        ['Payables', 'Receivables', 'Revenue Ops.', 'Expenses Ops.', 'GP Ops.', 'TEU', 'Total Rate', 'Local Amount', 'Quantity', 'Pending', 'Total'].forEach(col => {
            if (clean[col] !== undefined) clean[col] = Number(clean[col]) || 0;
        });

        return clean;
    });
}

export async function parseExcelFile(file: File): Promise<Record<string, DataRow[]>> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array', cellDates: true });
                const db: Record<string, DataRow[]> = {};
                
                let listData: any[] = [], contentData: any[] = [];

                workbook.SheetNames.forEach(name => {
                    const json = XLSX.utils.sheet_to_json(workbook.Sheets[name], { defval: "" });
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

                resolve(db);
            } catch (err) {
                reject(err);
            }
        };
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
    });
}
