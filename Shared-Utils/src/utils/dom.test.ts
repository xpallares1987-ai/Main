import { describe, it, expect, vi } from 'vitest';
import { qs, on, escapeHTML, ensureExtension, formatError, safeTrim, getFileNameFromPath } from './dom';

describe('DOM and String Utilities', () => {
  it('qs should return an element or null', () => {
    // Simulamos entorno DOM si es necesario, pero Vitest suele configurarse con happy-dom o jsdom
    const div = document.createElement('div');
    div.id = 'test-element';
    document.body.appendChild(div);
    expect(qs('#test-element')).toBe(div);
    document.body.removeChild(div);
  });

  it('escapeHTML should sanitize strings', () => {
    expect(escapeHTML('<script>alert(1)</script>')).toBe('&lt;script&gt;alert(1)&lt;/script&gt;');
  });

  it('ensureExtension should add extension if missing', () => {
    expect(ensureExtension('file', '.bpmn')).toBe('file.bpmn');
    expect(ensureExtension('file.BPMN', '.bpmn')).toBe('file.BPMN');
  });

  it('safeTrim should return fallback for empty strings', () => {
    expect(safeTrim('  ', 'fallback')).toBe('fallback');
    expect(safeTrim(' content ', 'fallback')).toBe('content');
  });

  it('getFileNameFromPath should extract filename', () => {
    expect(getFileNameFromPath('C:\\path\\to\\file.txt')).toBe('file.txt');
    expect(getFileNameFromPath('/unix/path/file.txt')).toBe('file.txt');
  });
});
