import { parseStringPromise } from 'xml2js';
import { z } from 'zod';

/**
 * Data Masking Dictionary for Sensitive Locations/Entities.
 */
const MASKING_MAP: Record<string, string> = {
  SAICA: 'Almacén Externo',
  NATUR: 'Suministro Genérico',
  'EL BURGO': 'Nodo Regional',
  VENIZEL: 'Centro Logístico FR'
};

/**
 * Applies data masking to a string based on the MASKING_MAP.
 */
export function applyDataMasking(val: unknown): string {
  if (val === null || val === undefined) return '';
  let str = String(val);
  Object.entries(MASKING_MAP).forEach(([key, replacement]) => {
    const regex = new RegExp(key, 'gi');
    str = str.replace(regex, replacement);
  });
  return str;
}

/**
 * Deeply masks sensitive data in objects/arrays.
 */
export function maskSensitiveData<T>(data: T): T {
  if (data === null || data === undefined) return data;
  if (typeof data === 'string') return applyDataMasking(data) as unknown as T;
  if (Array.isArray(data)) return data.map(maskSensitiveData) as unknown as T;
  if (typeof data === 'object') {
    const masked: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
      masked[key] = maskSensitiveData(value);
    }
    return masked as unknown as T;
  }
  return data;
}

/**
 * Zod Schema for Boarding entry with automatic masking and formatting.
 */
export const BoardingSchema = z
  .object({
    Origin: z.string().transform(applyDataMasking),
    'Customer Order': z.string().transform(applyDataMasking),
    Warehouse: z.string().transform(applyDataMasking),
    POL: z.string().transform(applyDataMasking),
    'Final Destination': z.string().transform(applyDataMasking),
    'Fecha Lim. Carga': z.string(),
    'Delivery Date': z.string(),
    'Forecast Arrival': z.string(),
    Bultos: z.union([z.string(), z.number()]).transform((v) => String(v)),
    'Weight (Tons)': z.union([z.string(), z.number()]).transform((v) => String(v)),
    'Ext. Addr. Number': z.string().transform(applyDataMasking)
  })
  .passthrough();

/**
 * Utility to flatten complex XML structures and handle common Power Query logic.
 */
export function flattenXmlValue(val: unknown): string {
  if (val === null || val === undefined) return '';
  if (typeof val === 'string') return applyDataMasking(val.trim());
  if (typeof val === 'object') {
    if (Array.isArray(val)) return val.map(flattenXmlValue).join(', ');
    const obj = val as Record<string, unknown>;
    const inner = obj._ || obj.Value || obj['Element:Text'] || '';
    return typeof inner === 'object' ? flattenXmlValue(inner) : applyDataMasking(String(inner).trim());
  }
  return applyDataMasking(String(val).trim());
}

/**
 * Formats date objects from XML into DD/MM/YYYY.
 */
export function formatXmlDate(dateObj: unknown): string {
  if (!dateObj || typeof dateObj !== 'object') return flattenXmlValue(dateObj);
  const obj = dateObj as Record<string, any>; // XML structures can be loose
  const day = flattenXmlValue(obj.Day || obj.Date?.Day);
  const month = flattenXmlValue(obj.Month || obj.Date?.Month);
  const year = flattenXmlValue(obj.Year || obj.Date?.Year);
  if (day && month && year) {
    return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
  }
  return '';
}

/**
 * Rounds numbers to specified decimals and uses European format (comma).
 */
export function formatXmlNumber(val: unknown, decimals: number = 3): string {
  const s = flattenXmlValue(val).replace(',', '.');
  const n = parseFloat(s);
  return isNaN(n) ? '' : n.toFixed(decimals).replace('.', ',');
}

/**
 * Base configuration for XML parsing.
 */
export const xmlParserOptions = { 
  explicitArray: false, 
  mergeAttrs: true,
  tagNameProcessors: [(name: string) => name.replace(/.*:/, '')]
};

/**
 * Parses XML string using standard repository options.
 */
export async function parseExternalXml(content: string) {
  return await parseStringPromise(content, xmlParserOptions);
}
