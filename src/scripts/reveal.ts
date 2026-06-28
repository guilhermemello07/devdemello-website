const obs = new IntersectionObserver((entries) => {
  for (const e of entries) {
    if (!e.isIntersecting) continue;
    const sibs = [...(e.target.parentElement?.querySelectorAll('.reveal') ?? [])];
    (e.target as HTMLElement).style.transitionDelay = `${sibs.indexOf(e.target) * 0.1}s`;
    e.target.classList.add('visible');
    obs.unobserve(e.target);
  }
}, { threshold: 0.15 });
document.querySelectorAll('.reveal').forEach((el) => obs.observe(el));
