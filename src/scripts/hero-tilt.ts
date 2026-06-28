/**
 * hero-tilt.ts
 * Applies a subtle 3D tilt to the floating phone in the hero stage
 * on pointer move. Disabled on touch devices and reduced-motion.
 */

function initHeroTilt(): void {
  // Bail out on touch devices or reduced-motion preference
  if (matchMedia('(pointer: coarse)').matches) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const stage = document.querySelector<HTMLElement>('.hero-stage');
  // Target the tilt wrapper (not .hero-phone which has the pulse animation)
  const phone = document.querySelector<HTMLElement>('.hero-phone-tilt');

  if (!stage || !phone) return;

  const MAX_DEG = 8;

  function onPointerMove(e: PointerEvent): void {
    const rect = stage!.getBoundingClientRect();
    // Normalize -1..1 relative to stage center
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const nx = (e.clientX - cx) / (rect.width / 2);
    const ny = (e.clientY - cy) / (rect.height / 2);

    // rotateX is driven by vertical offset (positive Y = tilt top away)
    // rotateY is driven by horizontal offset (positive X = tilt right toward)
    const rotX = -ny * MAX_DEG;
    const rotY = nx * MAX_DEG;

    phone!.style.transform = `rotateX(${rotX}deg) rotateY(${rotY}deg)`;
  }

  function onPointerLeave(): void {
    phone!.style.transform = 'rotateX(0deg) rotateY(0deg)';
  }

  stage.addEventListener('pointermove', onPointerMove);
  stage.addEventListener('pointerleave', onPointerLeave);
}

// Run on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initHeroTilt);
} else {
  initHeroTilt();
}
