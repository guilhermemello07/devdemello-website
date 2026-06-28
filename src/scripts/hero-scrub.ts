/**
 * hero-scrub.ts
 * Drives the hero code→app morph with a hero-scoped scroll-progress variable.
 *
 * Why JS instead of `animation-timeline: scroll(root)`: scroll(root) maps the
 * animation-range over the ENTIRE document height, so once more sections are
 * added below the hero, the morph would fire in the first few pixels of scroll.
 * Computing progress over the hero-track's own pinnable distance is robust to
 * page length and verifiable by logic.
 *
 * Sets `--p` (0→1) on `.hero-track`; the CSS keyframes (paused, negative
 * animation-delay) key off it. Bails on reduced-motion — the CSS default
 * (formed app) handles that case.
 */

function initHeroScrub(): void {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const track = document.querySelector<HTMLElement>('.hero-track');
  if (!track) return;

  function update(): void {
    const rect = track!.getBoundingClientRect();
    // Pinnable distance: track height minus one viewport (~100vh for a 200vh track)
    const dist = track!.offsetHeight - window.innerHeight;
    // -rect.top = how far we've scrolled into the track (hero is the first element)
    const p = dist > 0 ? Math.min(1, Math.max(0, -rect.top / dist)) : 0;
    track!.style.setProperty('--p', String(p));
  }

  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update, { passive: true });

  // Set the initial value before first paint of motion
  requestAnimationFrame(update);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initHeroScrub);
} else {
  initHeroScrub();
}
