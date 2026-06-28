document.addEventListener('click', (event) => {
  const target = event.target as HTMLElement;
  const anchor = target.closest('a');
  if (!anchor) return;

  const href = anchor.getAttribute('href');
  if (!href) return;

  // Handle pure "#id" links
  if (href.startsWith('#')) {
    const id = href.slice(1);
    if (!id) return; // bare "#" — skip
    const el = document.getElementById(id);
    if (!el) return;
    event.preventDefault();
    const top = el.getBoundingClientRect().top + window.scrollY - 80;
    window.scrollTo({ top, behavior: 'smooth' });
    return;
  }

  // Handle same-page "/#id" style links
  const url = new URL(href, window.location.href);
  if (url.pathname === window.location.pathname && url.hash) {
    const id = url.hash.slice(1);
    if (!id) return;
    const el = document.getElementById(id);
    if (!el) return;
    event.preventDefault();
    const top = el.getBoundingClientRect().top + window.scrollY - 80;
    window.scrollTo({ top, behavior: 'smooth' });
  }
});
