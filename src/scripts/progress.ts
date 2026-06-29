// progress.ts
// Updates the scroll-progress bar width as the user scrolls through a page.
// Uses passive event listeners for performance. No CSS transition on the bar
// so the width update is immediate (no scroll-lag).

function updateProgress(): void {
  const bar = document.getElementById('progress-bar');
  if (!bar) return;

  const scrollTop = window.scrollY || document.documentElement.scrollTop;
  const scrollHeight =
    document.documentElement.scrollHeight - window.innerHeight;

  const ratio = scrollHeight > 0 ? scrollTop / scrollHeight : 0;
  const pct = Math.min(1, Math.max(0, ratio)) * 100;

  bar.style.width = `${pct}%`;
}

// Run once on load to set initial state
updateProgress();

window.addEventListener('scroll', updateProgress, { passive: true });
window.addEventListener('resize', updateProgress, { passive: true });
