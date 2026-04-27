/**
 * Common DOM and String Utilities
 */
export declare function qs<T extends HTMLElement>(selector: string, context?: HTMLElement | Document): T | null;
export declare function qsa(selector: string, context?: HTMLElement | Document): NodeListOf<HTMLElement>;
export declare function on(element: HTMLElement | Window | Document | null, event: string, handler: any, options?: any): Function;
export declare function escapeHTML(str: string): string;
export declare function debounce(fn: Function, delay?: number): (...args: any[]) => void;
export declare function throttle(fn: Function, delay?: number): (...args: any[]) => void;
export declare function ensureExtension(fileName: string, ext?: string): string;
export declare function formatError(error: any, prefix?: string): string;
export declare function safeTrim(str: any, fallback: string): string;
export declare function ensureElement<T extends HTMLElement>(element: T | null, name?: string): T;
export declare function getFileNameFromPath(path: string, fallback?: string): string;
export declare function hexToRgbA(hex: string, alpha?: number): string;


