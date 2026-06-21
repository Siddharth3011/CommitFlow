import React, { createContext, useContext, useState, useEffect } from 'react';

// =============================================================================
// Theme Context & Hook
// =============================================================================

const ThemeContext = createContext();

/**
 * Manages the color scheme (light vs. dark) of the application.
 * Persists the user's choice in localStorage and applies the 'dark' CSS
 * class to the document's root element.
 */
export const ThemeProvider = ({ children }) => {
  // Read saved preference from localStorage, defaulting to 'dark'
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme || 'dark';
  });

  useEffect(() => {
    const root = window.document.documentElement;

    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    localStorage.setItem('theme', theme);
  }, [theme]);

  /**
   * Toggles the application between light and dark themes.
   */
  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

/**
 * Hook to access the theme state and toggle handler within components.
 * @returns {{ theme: 'light' | 'dark', toggleTheme: () => void }}
 */
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
export default ThemeContext;
