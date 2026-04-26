export function qs(selector: string, context: HTMLElement | Document = document): HTMLElement | null {
  return context.querySelector(selector);
}

export function qsa(selector: string, context: HTMLElement | Document = document): NodeListOf<HTMLElement> {
  return context.querySelectorAll(selector);
}

export function on(element: HTMLElement | Window | Document, event: string, handler: Function, options?: any): Function {
  element.addEventListener(event, handler as any, options);
  return () => element.removeEventListener(event, handler as any, options);
}
