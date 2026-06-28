/**
 * theme.ts
 * Handles theme toggling: flips data-theme on <html> between light/dark
 * and persists the choice in localStorage.
 *
 * Called by ThemeToggle.astro — import this module from a <script> tag.
 */

export function initThemeToggle(button: HTMLButtonElement): void {
  function getTheme(): 'light' | 'dark' {
    return (document.documentElement.dataset.theme as 'light' | 'dark') ?? 'light';
  }

  // Icon visibility is driven by CSS keyed off [data-theme] (set pre-paint by
  // the no-FOUC inline script), so JS only updates the accessible label.
  function updateLabel(theme: 'light' | 'dark'): void {
    button.setAttribute(
      'aria-label',
      theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'
    );
  }

  // Sync label to the theme the inline script already applied.
  updateLabel(getTheme());

  button.addEventListener('click', () => {
    const next = getTheme() === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    localStorage.setItem('theme', next);
    updateLabel(next);
  });
}
