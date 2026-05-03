import { parseStringPromise } from 'xml2js';

/**
 * Utility to flatten complex XML structures and handle common Power Query logic.
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
