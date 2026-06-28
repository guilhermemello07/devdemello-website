/**
 * theme.ts
 * Handles theme toggling: flips data-theme on <html> between light/dark
 * and persists the choice in localStorage.
 *
 * Called by ThemeToggle.astro — import this module from a <script> tag.
 */

export function initThemeToggle(button: HTMLButtonElement): void {
  const sunIcon = button.querySelector<SVGElement>('.icon-sun');
  const moonIcon = button.querySelector<SVGElement>('.icon-moon');

  function getTheme(): 'light' | 'dark' {
    return (document.documentElement.dataset.theme as 'light' | 'dark') ?? 'light';
  }

  function updateIcons(theme: 'light' | 'dark'): void {
    if (sunIcon && moonIcon) {
      sunIcon.style.display = theme === 'dark' ? 'block' : 'none';
      moonIcon.style.display = theme === 'light' ? 'block' : 'none';
    }
    button.setAttribute(
      'aria-label',
      theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'
    );
  }

  // Set initial icon state
  updateIcons(getTheme());

  button.addEventListener('click', () => {
    const current = getTheme();
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    localStorage.setItem('theme', next);
    updateIcons(next);
  });
}
