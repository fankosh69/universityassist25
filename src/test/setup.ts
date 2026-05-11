import "@testing-library/jest-dom";

// Default: prefers-reduced-motion not set. Tests can override matchMedia per-case.
if (!window.matchMedia) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    configurable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  });
}

if (!(window as any).IntersectionObserver) {
  class IO {
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() { return []; }
  }
  (window as any).IntersectionObserver = IO;
  (globalThis as any).IntersectionObserver = IO;
}