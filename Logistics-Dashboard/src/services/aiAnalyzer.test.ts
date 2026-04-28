import { describe, it, expect } from 'vitest';
import { generateAIInsights } from './aiAnalyzer';
import { DataRow } from '../types';

describe('AI Analyzer', () => {
  it('should return insufficient data message for empty array', () => {
    const result = generateAIInsights([]);
    expect(result).toContain('Insuficiencia de datos');
  });

  it('should generate financial insights for relevant data', () => {
    const data = [
      { 'Payables': 100, 'Receivables': 200, 'Customer Name': 'Test Client' }
    ];
    const result = generateAIInsights(data as unknown as DataRow[]);
    expect(result).toContain('transacciones');
    expect(result).toContain('Socio Comercial Frecuente');
  });
});


