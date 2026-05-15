export const easings = {
  linear: (t: number) => t,
  easeInQuad: (t: number) => t * t,
  easeOutQuad: (t: number) => t * (2 - t),
  easeInOutQuad: (t: number) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
  easeInCubic: (t: number) => t * t * t,
  easeOutCubic: (t: number) => (--t) * t * t + 1,
  easeInOutCubic: (t: number) => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
  easeInQuart: (t: number) => t * t * t * t,
  easeOutQuart: (t: number) => 1 - (--t) * t * t * t,
  easeInOutQuart: (t: number) => t < 0.5 ? 8 * t * t * t * t : 1 - 8 * (--t) * t * t * t,
  easeInQuint: (t: number) => t * t * t * t * t,
  easeOutQuint: (t: number) => 1 + (--t) * t * t * t * t,
  easeInSine: (t: number) => 1 - Math.cos((t * Math.PI) / 2),
  easeOutSine: (t: number) => Math.sin((t * Math.PI) / 2),
  easeInOutSine: (t: number) => -(Math.cos(Math.PI * t) - 1) / 2,
  easeInExpo: (t: number) => t === 0 ? 0 : Math.pow(2, 10 * t - 10),
  easeOutExpo: (t: number) => t === 1 ? 1 : 1 - Math.pow(2, -10 * t),
  easeInCirc: (t: number) => 1 - Math.sqrt(1 - t * t),
  easeOutCirc: (t: number) => Math.sqrt(1 - (--t) * t),
  easeOutBack: (t: number) => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  },
  easeOutBounce: (t: number) => {
    const n1 = 7.5625;
    const d1 = 2.75;
    if (t < 1 / d1) return n1 * t * t;
    if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75;
    if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375;
    return n1 * (t -= 2.625 / d1) * t + 0.984375;
  },
};

export function animate(
  from: number,
  to: number,
  duration: number,
  easing: keyof typeof easings = 'easeOutCubic',
  onUpdate: (value: number) => void,
  onComplete?: () => void,
): () => void {
  const start = performance.now();
  const easeFn = easings[easing] || easings.easeOutCubic;
  let cancelled = false;

  function step(now: number) {
    if (cancelled) return;
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const easedProgress = easeFn(progress);
    const value = from + (to - from) * easedProgress;
    onUpdate(value);
    if (progress < 1) {
      requestAnimationFrame(step);
    } else {
      onComplete?.();
    }
  }

  requestAnimationFrame(step);

  return () => { cancelled = true; };
}

export function getEasingCSS(easing: string): string {
  const map: Record<string, string> = {
    linear: 'linear',
    easeOutCubic: 'cubic-bezier(0.33, 1, 0.68, 1)',
    easeOutQuad: 'cubic-bezier(0.25, 1, 0.5, 1)',
    easeOutBounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    easeOutBack: 'cubic-bezier(0.36, 0, 0.66, -0.56)',
    easeInCubic: 'cubic-bezier(0.32, 0, 0.67, 0)',
    easeInOutCubic: 'cubic-bezier(0.65, 0, 0.35, 1)',
  };
  return map[easing] || 'ease';
}
