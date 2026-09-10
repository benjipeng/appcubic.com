// Load a single theme's loop only after the page is ready and the art is visible.
// A failed, paused, or unsupported video leaves the complete poster in place.
export function mountKinetic({ root, moving, isExposed }) {
  const items = [...document.querySelectorAll('[data-kinetic]')].map((element) => ({
    element,
    video: element.querySelector('video'),
    visible: false,
  }));
  let ready = false;
  const dataSaver = navigator.connection?.saveData;
  function update() {
    items.forEach((item) => {
      const { element, video } = item;
      if (!ready || !moving() || !item.visible || !isExposed(element) || dataSaver) {
        video.pause();
        if (!moving()) element.dataset.playing = 'false';
        return;
      }
      const src = root.dataset.theme === 'dark' ? video.dataset.night : video.dataset.day;
      if (video.getAttribute('src') !== src) {
        element.dataset.playing = 'false';
        video.src = src;
        video.muted = true;
        video.load();
      }
      if (!video.paused) return;
      video
        .play()
        .then(() => {
          if (moving() && item.visible && isExposed(element)) element.dataset.playing = 'true';
          else video.pause();
        })
        .catch(() => {
          element.dataset.playing = 'false';
        });
    });
  }
  items.forEach(({ element, video }) =>
    video.addEventListener('error', () => {
      element.dataset.playing = 'false';
    }),
  );
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          items.find((item) => item.element === entry.target).visible = entry.isIntersecting;
        }
        update();
      },
      { threshold: 0.08 },
    );
    items.forEach(({ element }) => observer.observe(element));
  } else items.forEach((item) => (item.visible = true));
  const begin = () => {
    ready = true;
    update();
  };
  const loaded = () => {
    'requestIdleCallback' in window
      ? requestIdleCallback(begin, { timeout: 1500 })
      : setTimeout(begin, 500);
  };
  if (document.readyState === 'complete') loaded();
  else addEventListener('load', loaded, { once: true });
  document.addEventListener('visibilitychange', update);
  addEventListener('pagehide', () => items.forEach(({ video }) => video.pause()));
  return update;
}
