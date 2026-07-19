/* The observatory sky: a fixed canvas behind the whole workshop page.
   Three star layers scroll at different speeds (true parallax), two nebulae
   drift, and the brand cube — assembled on arrival — comes apart as you
   scroll through the shelves, then reassembles at the coda. Monochrome bone
   wire on neutral night — no color anywhere. */

const VERTS = [];
for (let i = 0; i < 8; i++) VERTS.push([i & 1 ? 1 : -1, i & 2 ? 1 : -1, i & 4 ? 1 : -1]);
const EDGES = [
  [0, 1], [2, 3], [4, 5], [6, 7],
  [0, 2], [1, 3], [4, 6], [5, 7],
  [0, 4], [1, 5], [2, 6], [3, 7],
];

/* deterministic pseudo-random (no Math.random — stable frames, resumable) */
const rnd = (i, k) => {
  const x = Math.sin((i + 1) * (k + 1) * 91.7) * 47453.3;
  return (x - Math.floor(x)) * 2 - 1;
};
const SCATTER = VERTS.map((v, i) => [
  v[0] + rnd(i, 1) * 3.2,
  v[1] + rnd(i, 2) * 2.4,
  v[2] + rnd(i, 3) * 2.8,
]);

const lerp = (a, b, t) => a + (b - a) * t;
const clamp01 = (v) => Math.min(1, Math.max(0, v));
const smooth = (a, b, v) => {
  const t = clamp01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};

const BONE = [237, 237, 237];

export function mountObservatory(canvas, onProgress) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  let w = 0;
  let h = 0;
  const measure = () => {
    w = innerWidth;
    h = innerHeight;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  /* star layers: [count, size, parallax speed, base alpha] */
  const LAYERS = [
    [70, 1.0, 0.04, 0.30],
    [46, 1.4, 0.10, 0.42],
    [26, 1.8, 0.20, 0.55],
  ];

  const draw = (t) => {
    const doc = document.documentElement;
    const p = clamp01(scrollY / Math.max(1, doc.scrollHeight - h));
    ctx.clearRect(0, 0, w, h);

    /* nebulae drift against the scroll — two depths of bone haze */
    const g1x = w * (0.78 - p * 0.3);
    const g1 = ctx.createRadialGradient(g1x, h * 0.28, 0, g1x, h * 0.28, w * 0.5);
    g1.addColorStop(0, "rgba(237, 237, 237, 0.055)");
    g1.addColorStop(1, "transparent");
    ctx.fillStyle = g1;
    ctx.fillRect(0, 0, w, h);
    const g2x = w * (0.18 + p * 0.3);
    const g2y = h * (0.8 - p * 0.35);
    const g2 = ctx.createRadialGradient(g2x, g2y, 0, g2x, g2y, w * 0.42);
    g2.addColorStop(0, "rgba(237, 237, 237, 0.04)");
    g2.addColorStop(1, "transparent");
    ctx.fillStyle = g2;
    ctx.fillRect(0, 0, w, h);

    /* stars, three depths */
    LAYERS.forEach(([count, size, speed, base], li) => {
      for (let i = 0; i < count; i++) {
        const sx = ((Math.sin((i + li * 97) * 78.233) * 43758.5453) % 1 + 1) % 1;
        const sy = ((Math.sin((i + li * 57) * 12.9898) * 24634.6345) % 1 + 1) % 1;
        const y = ((sy - (scrollY * speed) / h) % 1 + 1) % 1;
        const tw = reduced ? 0.5 : 0.5 + 0.5 * Math.sin(t * 0.0011 + i * 1.7 + li * 9);
        ctx.globalAlpha = base * (0.35 + 0.65 * tw);
        ctx.fillStyle = "rgba(237, 237, 237, 1)";
        ctx.fillRect(sx * w, y * h, size, size);
      }
    });
    ctx.globalAlpha = 1;

    /* the cube: assembled → apart on the bench → assembled */
    const apart = smooth(0.06, 0.38, p) * (1 - smooth(0.6, 0.94, p));
    const asm = reduced ? 1 : 1 - apart * 0.85;

    const yaw = reduced ? 0.7 : t * 0.00014 + p * 3.6;
    const pitch = 0.42 + (reduced ? 0 : Math.sin(t * 0.00011) * 0.08);
    const cy = Math.cos(yaw);
    const sy = Math.sin(yaw);
    const cp = Math.cos(pitch);
    const sp = Math.sin(pitch);
    const scale = Math.min(w, h) * (0.15 + 0.06 * asm);
    const cx = w * (0.66 - 0.26 * Math.sin(p * Math.PI));
    const cyc = h * (0.5 + 0.05 * Math.sin(p * Math.PI * 2));

    const proj = VERTS.map((v, i) => {
      const x0 = lerp(SCATTER[i][0], v[0], asm);
      const y0 = lerp(SCATTER[i][1], v[1], asm);
      const z0 = lerp(SCATTER[i][2], v[2], asm);
      const x1 = x0 * cy + z0 * sy;
      const z1 = -x0 * sy + z0 * cy;
      const y2 = y0 * cp - z1 * sp;
      const z2 = y0 * sp + z1 * cp;
      const d = 1 / (1 + z2 * 0.14);
      return [cx + x1 * scale * d, cyc + y2 * scale * d, z2];
    });

    const col = BONE;
    EDGES.forEach(([a, b], i) => {
      const dr = clamp01(asm * 6 - i * 0.42);
      if (dr <= 0) return;
      const za = (proj[a][2] + proj[b][2]) / 2;
      const alpha = (0.1 + 0.42 * asm) * (0.62 - za * 0.25);
      ctx.strokeStyle = `rgba(${col[0]}, ${col[1]}, ${col[2]}, ${Math.max(0.04, alpha)})`;
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.moveTo(proj[a][0], proj[a][1]);
      ctx.lineTo(lerp(proj[a][0], proj[b][0], dr), lerp(proj[a][1], proj[b][1], dr));
      ctx.stroke();
    });
    proj.forEach((pt) => {
      ctx.fillStyle = `rgba(${BONE[0]}, ${BONE[1]}, ${BONE[2]}, ${0.4 + 0.4 * asm})`;
      ctx.beginPath();
      ctx.arc(pt[0], pt[1], 1.5 + asm, 0, 7);
      ctx.fill();
    });

    return p;
  };

  measure();

  if (reduced) {
    /* static sky: no animation loop, redraw only when layout or scroll changes */
    const still = () => {
      const p = draw(0);
      if (onProgress) onProgress(p);
    };
    still();
    addEventListener("resize", () => {
      measure();
      still();
    }, { passive: true });
    addEventListener("scroll", still, { passive: true });
    return;
  }

  let running = true;
  const frame = (t) => {
    if (!running) return;
    const p = draw(t);
    if (onProgress) onProgress(p);
    requestAnimationFrame(frame);
  };
  addEventListener("resize", measure, { passive: true });
  document.addEventListener("visibilitychange", () => {
    const wasRunning = running;
    running = !document.hidden;
    if (running && !wasRunning) requestAnimationFrame(frame);
  });
  requestAnimationFrame(frame);
}
