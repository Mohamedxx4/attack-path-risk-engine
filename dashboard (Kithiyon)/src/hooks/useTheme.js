import { useEffect, useState } from 'react';

const STORAGE_KEY = 'apre-theme';

/** Current theme, read from the attribute the inline script in index.html already set. */
function readInitialTheme() {
  const attr = document.documentElement.dataset.theme;
  return attr === 'dark' ? 'dark' : 'light';
}

/**
 * Light / dark theme. The choice is written to <html data-theme> so every token
 * in index.css switches at once, and remembered in localStorage when available.
 */
export function useTheme() {
  const [theme, setTheme] = useState(readInitialTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // Storage can be blocked (private mode); the toggle still works for this visit.
    }
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));

  return { theme, toggleTheme };
}
