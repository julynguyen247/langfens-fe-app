// =============================================
// LOCALSTORAGE HELPERS
// =============================================
export const LS_HISTORY = "lf_dict_history";

export const LS_SAVED = "lf_dict_saved";

export const saveJSON = (k: string, v: any) =>
  typeof window !== 'undefined' && localStorage.setItem(k, JSON.stringify(v));

export const readJSON = <T,>(k: string, fallback: T): T => {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(k);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};
