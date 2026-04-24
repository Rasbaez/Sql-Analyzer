import { useState, useEffect } from 'react';

const parseValue = (value) => {
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
};

export const useLocalStorageState = (key, defaultValue) => {
  const [storedValue, setStoredValue] = useState(() => {
    if (typeof window === 'undefined') return defaultValue;

    const item = window.localStorage.getItem(key);
    return item !== null ? parseValue(item) : defaultValue;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(key, JSON.stringify(storedValue));
  }, [key, storedValue]);

  return [storedValue, setStoredValue];
};
