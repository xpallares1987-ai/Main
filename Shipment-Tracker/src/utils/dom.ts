export const DOMUtils = {
  get<T extends HTMLElement>(id: string): T | null {
    return document.getElementById(id) as T;
  },

  escapeHTML(str: string): string {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  },

  debounce(fn: Function, delay: number) {
    let timeoutId: any;
    return (...args: any[]) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => fn(...args), delay);
    };
  },

  on<K extends keyof HTMLElementEventMap>(
    element: HTMLElement | null,
    event: K,
    handler: (ev: HTMLElementEventMap[K]) => void
  ) {
    if (element) {
      element.addEventListener(event, handler);
    }
  }
};
