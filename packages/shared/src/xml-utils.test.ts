import { describe, it, expect } from 'vitest';
import { 
  applyDataMasking, 
  maskSensitiveData, 
  flattenXmlValue, 
  formatXmlDate, 
  formatXmlNumber,
  BoardingSchema
} from './xml-utils';

describe('XML Utilities & Masking', () => {
  
  describe('applyDataMasking', () => {
    it('should replace SAICA with Almacén Externo', () => {
      expect(applyDataMasking('SAICA Logistics')).toBe('Almacén Externo Logistics');
    });

    it('should replace NATUR with Suministro Genérico', () => {
      expect(applyDataMasking('NATUR Flow')).toBe('Suministro Genérico Flow');
    });

    it('should replace EL BURGO with Nodo Regional', () => {
      expect(applyDataMasking('Welcome to EL BURGO')).toBe('Welcome to Nodo Regional');
    });

    it('should replace VENIZEL with Centro Logístico FR', () => {
      expect(applyDataMasking('VENIZEL Port')).toBe('Centro Logístico FR Port');
    });

    it('should be case-insensitive', () => {
      expect(applyDataMasking('saica site')).toBe('Almacén Externo site');
    });

    it('should return empty string for null/undefined', () => {
      expect(applyDataMasking(null as any)).toBe('');
      expect(applyDataMasking(undefined as any)).toBe('');
    });
  });

  describe('maskSensitiveData', () => {
    it('should mask strings deeply in objects', () => {
      const data = {
        name: 'SAICA Client',
        details: {
          location: 'VENIZEL area',
          tags: ['NATUR', 'EL BURGO']
        }
      };
      const expected = {
        name: 'Almacén Externo Client',
        details: {
          location: 'Centro Logístico FR area',
          tags: ['Suministro Genérico', 'Nodo Regional']
        }
      };
      expect(maskSensitiveData(data)).toEqual(expected);
    });
  });

  describe('flattenXmlValue', () => {
    it('should handle simple strings', () => {
      expect(flattenXmlValue('  SAICA  ')).toBe('Almacén Externo');
    });

    it('should handle objects with _ property', () => {
      expect(flattenXmlValue({ _: ' VENIZEL ' })).toBe('Centro Logístico FR');
    });

    it('should handle arrays', () => {
      expect(flattenXmlValue(['SAICA', 'NATUR'])).toBe('Almacén Externo, Suministro Genérico');
    });
  });

  describe('formatXmlDate', () => {
    it('should format date object correctly', () => {
      const dateObj = { Day: '01', Month: '05', Year: '2026' };
      expect(formatXmlDate(dateObj)).toBe('01/05/2026');
    });

    it('should handle nested Date property', () => {
      const dateObj = { Date: { Day: '4', Month: '5', Year: '2026' } };
      expect(formatXmlDate(dateObj)).toBe('04/05/2026');
    });
  });

  describe('formatXmlNumber', () => {
    it('should format numbers with commas and fixed decimals', () => {
      expect(formatXmlNumber('123.4567')).toBe('123,457');
      expect(formatXmlNumber('123,4567')).toBe('123,457');
    });

    it('should handle custom decimals', () => {
      expect(formatXmlNumber('10.5', 2)).toBe('10,50');
    });
  });

  describe('BoardingSchema', () => {
    it('should apply masking during validation', () => {
      const rawData = {
        Origin: 'SAICA ES',
        'Customer Order': 'NATUR-123',
        Warehouse: 'EL BURGO WH',
        POL: 'Port',
        'Final Destination': 'VENIZEL FR',
        'Fecha Lim. Carga': '2026-05-04',
        'Delivery Date': '2026-05-10',
        'Forecast Arrival': '2026-05-12',
        Bultos: '10',
        'Weight (Tons)': '20.5',
        'Ext. Addr. Number': 'SAICA-ADDR'
      };

      const result = BoardingSchema.parse(rawData);
      expect(result.Origin).toBe('Almacén Externo ES');
      expect(result['Customer Order']).toBe('Suministro Genérico-123');
      expect(result.Warehouse).toBe('Nodo Regional WH');
      expect(result['Final Destination']).toBe('Centro Logístico FR FR');
    });
  });

});
