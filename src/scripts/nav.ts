/**
 * nav.ts
 * Adds/removes `.scrolled` class on the nav element when scrollY > 60px.
 * Also handles the mobile hamburger toggle.
 */

export function initNav(nav: HTMLElement): void {
  // --- Scroll: toggle .scrolled class ---
  const SCROLL_THRESHOLD = 60;

  function handleScroll(): void {
    if (window.scrollY > SCROLL_THRESHOLD) {
      nav.classList.add('scrolled');
    } else {
      nav.classList.remove('scrolled');
    }
  }

  // Run once on init (in case page is loaded mid-scroll)
  handleScroll();

  window.addEventListener('scroll', handleScroll, { passive: true });
}

export function initMobileMenu(
  hamburger: HTMLButtonElement,
  mobileMenu: HTMLElement
): void {
  hamburger.addEventListener('click', () => {
    const isExpanded = hamburger.getAttribute('aria-expanded') === 'true';
    const next = !isExpanded;
    hamburger.setAttribute('aria-expanded', String(next));
    mobileMenu.setAttribute('aria-hidden', String(!next));

    if (next) {
      mobileMenu.classList.add('open');
    } else {
      mobileMenu.classList.remove('open');
    }
  });

  // Close menu when a link inside is clicked
  const links = mobileMenu.querySelectorAll('a');
  links.forEach((link) => {
    link.addEventListener('click', () => {
      hamburger.setAttribute('aria-expanded', 'false');
      mobileMenu.setAttribute('aria-hidden', 'true');
      mobileMenu.classList.remove('open');
    });
  });
}
