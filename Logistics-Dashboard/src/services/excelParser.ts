import * as XLSX from 'xlsx';
import { z } from 'zod';
import { BLACK_COLS, BRANCH_MAP } from '../config';
import { DataRow } from '../types';

const TASA_USD_EUR = 0.93;

const CATEGORIAS = {
    ORIGEN: ['THCO', 'PORTO', 'SFEE', 'CDF', 'AFTD', 'VGM', 'CSF', 'CCC', 'PTAXO', 'SEAL', 'HAND', 'FOB'],
    TRANSITO: ['EBC', 'CO2', 'EOS', 'SECA', 'WAR', 'ERS', 'PSS', 'LSS', 'CAC', 'EES', 'PCS', 'SCS', 'CGN', 'EQBA', 'ETS', 'BAF', 'EMAIN', 'VPS', 'FUELO'],
    DESTINO: ['THCD', 'COER', 'PORTD', 'CHAIM', 'HBD', 'FOC', 'NYPAS', 'CONIN', 'EIRD', 'CLEAN', 'ONCT', 'ONCR', 'OWD', 'ISPD', 'LOCHD', 'WHARF'],
    DOCS: ['SCMAN', 'BL', 'ADMID', 'CUSER', 'DOCC', 'CONLF', 'ADMIO']
};

// Esquema Zod para validación básica de fila
const DataRowSchema = z.record(z.string(), z.unknown());

export function processData(data: Record<string, unknown>[]): DataRow[] {
    const finalData = data.map(row => {
        // Validación en tiempo de ejecución
        const parsed = DataRowSchema.safeParse(row);
        if (!parsed.success) return {};

        const clean: DataRow = {};
        let wt = 0;
        let isKgs = false;
        
        let sumaOrigen = 0, sumaTransito = 0, sumaDestino = 0, sumaDocs = 0;

        for (const k in row) {
            const key = k.trim();
            if (BLACK_COLS.includes(key)) continue;
            let val = row[k];
            
            if (key.startsWith('CON:')) {
                const root = key.replace('CON: ', '');
                const numVal = parseFloat(String(val)) || 0;
                const divisa = String(row[`DIVISA ${root}`] || row['Divisa flete'] || 'USD');
                const valEUR = (divisa === 'USD') ? numVal * TASA_USD_EUR : numVal;

                if (CATEGORIAS.ORIGEN.includes(root)) sumaOrigen += valEUR;
                else if (CATEGORIAS.TRANSITO.includes(root)) sumaTransito += valEUR;
                else if (CATEGORIAS.DESTINO.includes(root)) sumaDestino += valEUR;
                else if (CATEGORIAS.DOCS.includes(root)) sumaDocs += valEUR;
            }

            if (key.startsWith('DOC:')) {
                const numVal = parseFloat(String(val)) || 0;
                sumaDocs += (row['Divisa flete'] === 'USD') ? numVal * TASA_USD_EUR : numVal;
            }

            if (key === "Branch") val = BRANCH_MAP[String(val)] || val;
            const keyUpper = key.toUpperCase();
            if (keyUpper.includes('WEIGHT')) {
                const valNum = Number(val) || 0;
                if (keyUpper.includes('KG')) { wt = valNum; isKgs = true; }
                else if (keyUpper.includes('TON')) { wt = valNum; isKgs = false; }
                else { wt = valNum; }
            }
            clean[key] = val as string | number | boolean | Date | undefined;
        }

        const divisaFlete = String(row['Divisa flete'] || row['Divisa Flete'] || 'EUR');
        const fletePrincipalEUR = (divisaFlete === 'USD') ? (Number(row['Flete Principal']) || 0) * TASA_USD_EUR : (Number(row['Flete Principal']) || 0);

        clean['TOTAL ORIGEN EUR'] = Math.round(sumaOrigen * 100) / 100;
        clean['TOTAL TRANSITO EUR'] = Math.round((fletePrincipalEUR + sumaTransito) * 100) / 100;
        clean['TOTAL DESTINO EUR'] = Math.round(sumaDestino * 100) / 100;
        clean['TOTAL GASTOS DOCS EUR'] = Math.round(sumaDocs * 100) / 100;
        
        const granTotal = fletePrincipalEUR + sumaOrigen + sumaTransito + sumaDestino + sumaDocs;
        clean['GRAN TOTAL ESTIMADO EUR'] = Math.round(granTotal * 100) / 100;
        clean['RIESGO DEMORAS'] = (Number(row['Días Libres Destino']) < 14) ? 'ALTO' : 'NORMAL';

        clean['Weight (Tons)'] = isKgs ? wt / 1000 : wt;
        return clean;
    });

    // Análisis de Variación (2026 vs 2025)
    finalData.forEach(row => {
        if (String(row['Año']) === '2026') {
            const match2025 = finalData.find(r => 
                String(r['Año']) === '2025' && 
                r['Puerto de Carga'] === row['Puerto de Carga'] && 
                r['Puerto de Descarga'] === row['Puerto de Descarga'] && 
                r['Naviera'] === row['Naviera']
            );

            if (match2025) {
                const varAbs = (Number(row['GRAN TOTAL ESTIMADO EUR']) || 0) - (Number(match2025['GRAN TOTAL ESTIMADO EUR']) || 0);
                const base2025 = Number(match2025['GRAN TOTAL ESTIMADO EUR']) || 1;
                const varPct = (varAbs / base2025) * 100;
                row['VARIACION VS 2025 (EUR)'] = Math.round(varAbs * 100) / 100;
                row['VARIACION %'] = Math.round(varPct * 10) / 10 + '%';
                row['TENDENCIA'] = varAbs > 0 ? 'SUBE ▲' : 'BAJA ▼';
            } else {
                row['VARIACION VS 2025 (EUR)'] = 'NUEVA RUTA';
            }
        }
    });

    return finalData;
}

export async function parseExcelFile(file: File): Promise<Record<string, DataRow[]>> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array', cellDates: true });
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

                resolve(db);
            } catch (err) {
                reject(err);
            }
        };
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
    });
}
