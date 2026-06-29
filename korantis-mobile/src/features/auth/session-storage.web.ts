export const sessionStorage = {
  getItem: async (key: string) => globalThis.sessionStorage?.getItem(key) ?? null,
  setItem: async (key: string, value: string) => { globalThis.sessionStorage?.setItem(key, value); },
  removeItem: async (key: string) => { globalThis.sessionStorage?.removeItem(key); },
};
