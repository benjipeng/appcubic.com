import { mountKinetic } from './kinetic.js';
// Shared progressive enhancement. Content and links are already in the HTML.
const root = document.documentElement;
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const color = matchMedia('(prefers-color-scheme: dark)');
const desktop = matchMedia('(min-width: 900px) and (min-height: 700px)');
const fine = matchMedia('(hover:hover) and (pointer:fine)');
const theme = document.querySelector('[data-theme-toggle]');
const motion = document.querySelector('[data-motion-toggle]');
const header = document.querySelector('.site-header');
const hero = document.querySelector('[data-hero]');
const feature = document.querySelector('.feature-track');
const studies = [...document.querySelectorAll('.study-art')];
const darkScenes = [...document.querySelectorAll('[data-dark-scene]')];
const read = (key) => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};
const save = (key, value) => {
  try {
    localStorage.setItem(key, value);
  } catch {}
};
const clamp = (n, min = 0, max = 1) => Math.max(min, Math.min(max, n));
const ease = (n) => {
  const p = clamp(n);
  return p * p * (3 - 2 * p);
};
let paused = read('appcubic-motion') === 'off';
let pinned = false,
  frame = 0,
  aimX = 0,
  aimY = 0,
  x = 0,
  y = 0;
let metrics = {
  height: innerHeight,
  featureTop: Infinity,
  featureEnd: Infinity,
  dark: [],
  studies: [],
};
let transition;
let updateKinetic = () => {};
const moving = () => !paused && !reduced.matches && !document.hidden;
function reflectTheme() {
  const dark = root.dataset.theme === 'dark';
  theme.setAttribute('aria-label', `Switch to ${dark ? 'light' : 'dark'} theme`);
  theme.querySelector('.theme-label').textContent = dark ? 'Day' : 'Night';
  document.querySelector('meta[name=theme-color]').content = dark ? '#171719' : '#f5f5f5';
  updateKinetic();
}
function measure() {
  const rect = (element) => {
    const r = element.getBoundingClientRect();
    return { top: r.top + scrollY, bottom: r.bottom + scrollY, height: r.height };
  };
  const f = feature ? rect(feature) : null;
  metrics = {
    height: innerHeight,
    featureTop: f?.top ?? Infinity,
    featureEnd: f?.bottom ?? Infinity,
    dark: darkScenes.map((e) => rect(e.classList.contains('feature-stage') ? e.parentElement : e)),
    studies: studies.map((element) => ({ element, ...rect(element) })),
  };
  schedule();
}
function schedule() {
  if (!frame && !document.hidden) frame = requestAnimationFrame(update);
}
function stop() {
  cancelAnimationFrame(frame);
  frame = 0;
  aimX = aimY = x = y = 0;
}
function update() {
  frame = 0;
  if (document.hidden) return;
  const offset = scrollY,
    h = metrics.height;
  const lightHeader = metrics.dark.some((r) => offset + 65 >= r.top && offset + 65 < r.bottom);
  header.dataset.tone = lightHeader ? 'light' : 'normal';
  header.dataset.scrolled = String(offset > 40);
  updateKinetic();
  if (!moving()) return;
  if (hero && offset < metrics.featureTop + h) {
    x += (aimX - x) * 0.12;
    y += (aimY - y) * 0.12;
    const unfold = pinned ? ease(offset / (h * 0.55)) : 0;
    hero.style.setProperty('--pointer-x', `${(x * 14).toFixed(2)}px`);
    hero.style.setProperty('--object-y', `${(-unfold * 45 + y * 8).toFixed(2)}px`);
    hero.style.setProperty('--object-rotate', `${(-unfold * 6 + x * 0.8).toFixed(2)}deg`);
    hero.style.setProperty('--monument-y', `${(32 * (1 - unfold)).toFixed(2)}%`);
    hero.style.setProperty('--monument-x', `${(-unfold * 18).toFixed(2)}px`);
    hero.style.setProperty('--hero-progress', String(0.1 + unfold * 0.9));
    if (Math.abs(aimX - x) + Math.abs(aimY - y) > 0.002) schedule();
  }
  if (feature && offset > metrics.featureTop - h && offset < metrics.featureEnd) {
    const entering = clamp((offset + h - metrics.featureTop) / h);
    const passage = clamp((offset - metrics.featureTop) / h);
    feature.style.setProperty('--feature-inset', `${(7 * (1 - ease(entering))).toFixed(2)}%`);
    feature.style.setProperty('--feature-image-y', `${(-passage * 30).toFixed(2)}px`);
    feature.style.setProperty('--feature-copy-y', `${(-passage * 17).toFixed(2)}px`);
    feature.style.setProperty('--feature-progress', String(clamp(passage / 0.78)));
  }
  metrics.studies.forEach((r) => {
    if (offset + h < r.top || offset > r.bottom) return;
    const p = clamp((offset + h - r.top) / (h + r.height));
    r.element.style.setProperty('--study-y', `${(24 - p * 48).toFixed(2)}px`);
    r.element.style.setProperty('--study-turn', `${(-8 + p * 16).toFixed(2)}deg`);
  });
}
function configurePin(preserve = false) {
  const next = Boolean(hero && feature && desktop.matches && !paused && !reduced.matches);
  if (next === pinned) {
    measure();
    return;
  }
  const insideFeature = feature && scrollY >= metrics.featureTop && scrollY < metrics.featureEnd;
  const anchor = preserve
    ? document
        .elementFromPoint(innerWidth / 2, Math.min(innerHeight * 0.4, 400))
        ?.closest('section')
    : null;
  const before = anchor?.getBoundingClientRect().top;
  pinned = next;
  root.dataset.pin = String(next);
  if (!next) {
    hero?.removeAttribute('style');
    feature?.removeAttribute('style');
  }
  measure();
  if (preserve && insideFeature) scrollTo({ top: metrics.featureTop, behavior: 'instant' });
  else if (preserve && anchor && before !== undefined)
    scrollTo({ top: scrollY + anchor.getBoundingClientRect().top - before, behavior: 'instant' });
  schedule();
}
function reflectMotion(preserve = true) {
  const enabled = !paused && !reduced.matches;
  root.dataset.motion = enabled ? 'on' : 'off';
  root.dataset.awake = String(!document.hidden);
  motion.setAttribute('aria-pressed', String(enabled));
  motion.disabled = reduced.matches;
  motion.setAttribute(
    'aria-label',
    reduced.matches ? 'Motion off, following device preference' : 'Motion',
  );
  motion.title = enabled ? 'Pause motion' : 'Resume motion';
  if (!moving()) {
    stop();
    transition?.skipTransition();
  }
  configurePin(preserve);
  updateKinetic();
}
theme.hidden = false;
motion.hidden = false;
reflectTheme();
theme.addEventListener('click', () => {
  const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
  const apply = () => {
    root.dataset.theme = next;
    save('theme', next);
    reflectTheme();
  };
  transition?.skipTransition();
  if (moving() && document.startViewTransition) {
    transition = document.startViewTransition(apply);
    transition.finished.catch(() => {});
    transition.ready.catch(() => {});
  } else apply();
});
motion.addEventListener('click', () => {
  paused = !paused;
  save('appcubic-motion', paused ? 'off' : 'on');
  reflectMotion();
});
color.addEventListener('change', (event) => {
  if (
    !read('theme') &&
    !['light', 'dark'].includes(new URLSearchParams(location.search).get('theme'))
  ) {
    root.dataset.theme = event.matches ? 'dark' : 'light';
    reflectTheme();
  }
});
reduced.addEventListener('change', () => reflectMotion());
hero?.addEventListener(
  'pointermove',
  (event) => {
    if (!fine.matches || !moving()) return;
    aimX = clamp((event.clientX / innerWidth) * 2 - 1, -1, 1);
    aimY = clamp((event.clientY / innerHeight) * 2 - 1, -1, 1);
    schedule();
  },
  { passive: true },
);
hero?.addEventListener('pointerleave', () => {
  aimX = aimY = 0;
  schedule();
});
hero?.addEventListener('focusin', () => {
  if (pinned && scrollY > innerHeight * 0.2) scrollTo({ top: 0, behavior: 'instant' });
});
addEventListener('scroll', schedule, { passive: true });
addEventListener('resize', () => configurePin(true), { passive: true });
document.addEventListener('visibilitychange', () => reflectMotion(false));
addEventListener('pagehide', stop);
addEventListener('pageshow', () => reflectMotion(false));
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(
    (entries) =>
      entries.forEach(({ target, isIntersecting }) => {
        if (isIntersecting) {
          target.dataset.reveal = 'ready';
          observer.unobserve(target);
        }
      }),
    { threshold: 0.08 },
  );
  document.querySelectorAll('[data-reveal]').forEach((element) => {
    if (element.getBoundingClientRect().top > innerHeight) {
      element.dataset.reveal = 'pending';
      observer.observe(element);
    }
  });
}
updateKinetic = mountKinetic({
  root,
  moving,
  isExposed: (element) => !hero?.contains(element) || scrollY < metrics.featureTop,
});
root.dataset.enhanced = 'true';
measure();
reflectMotion(false);
if ('ResizeObserver' in window) new ResizeObserver(measure).observe(document.querySelector('main'));
