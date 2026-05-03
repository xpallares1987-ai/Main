import { parseStringPromise } from 'xml2js';
import { z } from 'zod';

/**
 * Zod Schemas for data validation
 */
export const BoardingSchema = z.object({
  Origin: z.string(),
  'Customer Order': z.string(),
  Warehouse: z.string(),
  POL: z.string(),
  'Final Destination': z.string(),
  'Fecha Lim. Carga': z.string(),
  'Delivery Date': z.string(),
  'Forecast Arrival': z.string(),
  Bultos: z.string(),
  'Weight (Tons)': z.string(),
  'Ext. Addr. Number': z.string(),
});

export const ReceptionSchema = z.object({
  Origin: z.string(),
  Warehouse: z.string(),
  Status: z.string(),
  'Load Code': z.string(),
  'Plate Number': z.string(),
  'Estimated Arrival at WH': z.string(),
  'Ext. Addr. Number': z.string(),
  'Final Destination': z.string(),
  'Customer Order': z.string(),
  'Item Number': z.string(),
  'Reel Year': z.string(),
  'Paper Code': z.string(),
  'Product Description': z.string(),
  'Grammage (GM)': z.string(),
  'Diameter (CM)': z.string(),
  'Roll Width (CM)': z.string(),
  'Roll Length (CM)': z.string(),
  'Weight (Kgs)': z.string(),
});

export const StockSchema = z.object({
  Origin: z.string(),
  Warehouse: z.string(),
  'Ext. Addr. Number': z.string(),
  'Product Code': z.string(),
  'Item Number': z.string(),
  Description: z.string(),
  Grammage: z.string(),
  Diameter: z.string(),
  'Roll Width': z.string(),
  Weight: z.string(),
  'Load Code': z.string(),
  'Customer Name': z.string(),
});

/**
 * Utility to flatten complex XML structures.
 */
export function flattenXmlValue(val: any): string {
  if (val === null || val === undefined) return '';
  if (typeof val === 'string') return val.trim();
  if (typeof val === 'object') {
    if (Array.isArray(val)) return val.map(flattenXmlValue).join(', ');
    const inner = val._ || val.Value || val['Element:Text'] || '';
    return typeof inner === 'object' ? flattenXmlValue(inner) : String(inner).trim();
  }
  return String(val).trim();
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
