export const cleanConnectionValue = (value) => {
  return String(value || '')
    .trim()
    .replace(/^['\"]+|['\"]+$/g, '');
};

export const getSavedConnectionValue = (key, fallback = '') => {
  if (typeof window === 'undefined') return fallback;
  return cleanConnectionValue(window.localStorage.getItem(key) || fallback);
};
