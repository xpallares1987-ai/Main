import { parseStringPromise } from 'xml2js';
import { z } from 'zod';

/**
 * 🔒 SECURITY: Data Masking Dictionary
 * This dictionary contains patterns and their generic replacements to ensure brand anonymity.
 */
const MASKING_RULES: Array<{ pattern: RegExp; replacement: string }> = [
  { pattern: /SAICA/gi, replacement: 'Almacén Externo' },
  { pattern: /NATUR/gi, replacement: 'Suministro Genérico' },
  { pattern: /EL BURGO/gi, replacement: 'Nodo Regional' },
  { pattern: /VENIZEL/gi, replacement: 'Centro Logístico FR' },
];

/**
 * Applies masking rules to a string to sanitize sensitive data.
 */
export function applyDataMasking(text: string): string {
  if (!text) return '';
  let sanitized = text;
  MASKING_RULES.forEach(({ pattern, replacement }) => {
    sanitized = sanitized.replace(pattern, replacement);
  });
  return sanitized;
}

/**
 * Deeply traverses an object or array to apply masking to all string values.
 */
export function maskSensitiveData<T>(data: T): T {
  if (typeof data === 'string') {
    return applyDataMasking(data) as unknown as T;
  }
  if (Array.isArray(data)) {
    return data.map(item => maskSensitiveData(item)) as unknown as T;
  }
  if (data !== null && typeof data === 'object') {
    const maskedObj: any = {};
    for (const [key, value] of Object.entries(data)) {
      maskedObj[key] = maskSensitiveData(value);
    }
    return maskedObj as T;
  }
  return data;
}

/**
 * Zod Schemas for data validation
 */
export const BoardingSchema = z.object({
  Origin: z.string().transform(applyDataMasking),
  'Customer Order': z.string().transform(applyDataMasking),
  Warehouse: z.string().transform(applyDataMasking),
  POL: z.string().transform(applyDataMasking),
  'Final Destination': z.string().transform(applyDataMasking),
  'Fecha Lim. Carga': z.string(),
  'Delivery Date': z.string(),
  'Forecast Arrival': z.string(),
  Bultos: z.string(),
  'Weight (Tons)': z.string(),
  'Ext. Addr. Number': z.string().transform(applyDataMasking),
});

export const ReceptionSchema = z.object({
  Origin: z.string().transform(applyDataMasking),
  Warehouse: z.string().transform(applyDataMasking),
  Status: z.string().transform(applyDataMasking),
  'Load Code': z.string().transform(applyDataMasking),
  'Plate Number': z.string().transform(applyDataMasking),
  'Estimated Arrival at WH': z.string(),
  'Ext. Addr. Number': z.string().transform(applyDataMasking),
  'Final Destination': z.string().transform(applyDataMasking),
  'Customer Order': z.string().transform(applyDataMasking),
  'Item Number': z.string().transform(applyDataMasking),
  'Reel Year': z.string(),
  'Paper Code': z.string().transform(applyDataMasking),
  'Product Description': z.string().transform(applyDataMasking),
  'Grammage (GM)': z.string(),
  'Diameter (CM)': z.string(),
  'Roll Width (CM)': z.string(),
  'Roll Length (CM)': z.string(),
  'Weight (Kgs)': z.string(),
});

export const StockSchema = z.object({
  Origin: z.string().transform(applyDataMasking),
  Warehouse: z.string().transform(applyDataMasking),
  'Ext. Addr. Number': z.string().transform(applyDataMasking),
  'Product Code': z.string().transform(applyDataMasking),
  'Item Number': z.string().transform(applyDataMasking),
  Description: z.string().transform(applyDataMasking),
  Grammage: z.string(),
  Diameter: z.string(),
  'Roll Width': z.string(),
  Weight: z.string(),
  'Load Code': z.string().transform(applyDataMasking),
  'Customer Name': z.string().transform(applyDataMasking),
});

/**
 * Utility to flatten complex XML structures.
 */
export function flattenXmlValue(val: any): string {
  if (val === null || val === undefined) return '';
  if (typeof val === 'string') return applyDataMasking(val.trim());
  if (typeof val === 'object') {
    if (Array.isArray(val)) return val.map(flattenXmlValue).join(', ');
    const inner = val._ || val.Value || val['Element:Text'] || '';
    return typeof inner === 'object' ? flattenXmlValue(inner) : applyDataMasking(String(inner).trim());
  }
  return applyDataMasking(String(val).trim());
}

/**
 * Formats date objects from XML into DD/MM/YYYY.
 */
export function formatXmlDate(dateObj: any): string {
  if (!dateObj || typeof dateObj !== 'object') return flattenXmlValue(dateObj);
  const day = flattenXmlValue(dateObj.Day || dateObj.Date?.Day);
  const month = flattenXmlValue(dateObj.Month || dateObj.Date?.Month);
  const year = flattenXmlValue(dateObj.Year || dateObj.Date?.Year);
  if (day && month && year) {
    return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
  }
  return '';
}

/**
 * Rounds numbers to specified decimals and uses European format (comma).
 */
export function formatXmlNumber(val: any, decimals: number = 3): string {
  const s = flattenXmlValue(val).replace(',', '.');
  const n = parseFloat(s);
  return isNaN(n) ? '' : n.toFixed(decimals).replace('.', ',');
}

/**
 * Base configuration for XML parsing.
 * Note: Disable entities to prevent XXE.
 */
export const xmlParserOptions = { 
  explicitArray: false, 
  mergeAttrs: true,
  tagNameProcessors: [(name: string) => name.replace(/.*:/, '')],
  // Security: Prevent XXE (handled by xml2js default but good to be explicit if using lower level sax)
};

/**
 * Parses XML string using standard repository options.
 */
export async function parseExternalXml(content: string) {
  // Simple check for external entities as an extra layer
  if (content.includes('<!ENTITY')) {
    throw new Error('Insecure XML content detected (External Entities).');
  }
  return await parseStringPromise(content, xmlParserOptions);
}
