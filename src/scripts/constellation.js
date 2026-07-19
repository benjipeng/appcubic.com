// Constellation coda: scattered star-shards drift in a nebula sky and, as the
// visitor scrolls the section into view, draw themselves into the AppCubic
// cube wireframe — edges tracing on one by one, the assembled figure slowly
// turning. Canvas-drawn, DPR-aware, and cheap: it only animates while the
// section is on screen. Progress is driven by how far the coda has entered
// the viewport, so the assembly is scroll-scrubbed, not time-based.

const VERTS = Array.from({ length: 8 }, (_, i) => [
  i & 1 ? 1 : -1,
  i & 2 ? 1 : -1,
  i & 4 ? 1 : -1,
]);
const EDGES = [
  [0, 1], [2, 3], [4, 5], [6, 7],
  [0, 2], [1, 3], [4, 6], [5, 7],
  [0, 4], [1, 5], [2, 6], [3, 7],
];

// deterministic per-vertex scatter so every frame (and visit) agrees
const rnd = (i, k) => {
  const x = Math.sin((i + 1) * (k + 1) * 91.7) * 47453.3;
  return (x - Math.floor(x)) * 2 - 1;
};
const SCATTER = VERTS.map((v, i) => [
  v[0] + rnd(i, 1) * 3.4,
  v[1] + rnd(i, 2) * 2.6,
  v[2] + rnd(i, 3) * 3.0,
]);

const lerp = (a, b, t) => a + (b - a) * t;
const clamp01 = (v) => Math.min(1, Math.max(0, v));
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/* monochrome sky: bone shards on neutral night — no color anywhere */
const BONE = [242, 242, 242];

export function mountConstellation(canvas, section) {
  const ctx = canvas.getContext("2d");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let w = 0, h = 0, raf = 0, visible = false;

  const resize = () => {
    const r = section.getBoundingClientRect();
    w = r.width;
    h = r.height;
    const dpr = Math.min(2, devicePixelRatio || 1);
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  const draw = (t) => {
    const r = section.getBoundingClientRect();
    // 0 when the coda's top edge enters the viewport bottom; 1 once fully risen
    const p = reduced ? 1 : clamp01((innerHeight - r.top) / Math.min(innerHeight, r.height));
    ctx.clearRect(0, 0, w, h);

    // nebulae
    const g1 = ctx.createRadialGradient(w * 0.72, h * 0.3, 0, w * 0.72, h * 0.3, w * 0.45);
    g1.addColorStop(0, "rgba(242,242,242,0.06)");
    g1.addColorStop(1, "transparent");
    ctx.fillStyle = g1;
    ctx.fillRect(0, 0, w, h);
    const g2 = ctx.createRadialGradient(w * 0.2, h * 0.72, 0, w * 0.2, h * 0.72, w * 0.4);
    g2.addColorStop(0, "rgba(242,242,242,0.04)");
    g2.addColorStop(1, "transparent");
    ctx.fillStyle = g2;
    ctx.fillRect(0, 0, w, h);

    // stars, deterministic, twinkling
    for (let i = 0; i < 70; i++) {
      const sx = ((Math.sin(i * 78.233) * 43758.5453) % 1 + 1) % 1;
      const sy = ((Math.sin(i * 12.9898) * 24634.6345) % 1 + 1) % 1;
      const tw = reduced ? 0.5 : 0.5 + 0.5 * Math.sin(t * 0.0011 + i * 1.7);
      ctx.globalAlpha = 0.1 + 0.28 * tw;
      ctx.fillStyle = "rgba(242,242,242,0.6)";
      ctx.fillRect(sx * w, sy * h, 1.3, 1.3);
    }
    ctx.globalAlpha = 1;

    // cube assembly
    const asm = easeInOut(clamp01(p * 1.35));
    const yaw = (reduced ? 0.8 : t * 0.00014) + p * 2.6;
    const pitch = 0.42 + (reduced ? 0 : Math.sin(t * 0.00011) * 0.08);
    const cy = Math.cos(yaw), sy = Math.sin(yaw);
    const cp = Math.cos(pitch), sp = Math.sin(pitch);
    const scale = Math.min(w, h) * (0.17 + 0.05 * asm);
    const cx = w * 0.68, cyc = h * 0.44;

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
      const dr = clamp01(asm * 12 - i * 0.55);
      if (dr <= 0) return;
      const za = (proj[a][2] + proj[b][2]) / 2;
      const alpha = (0.14 + 0.5 * asm) * (0.6 - za * 0.25);
      ctx.strokeStyle = `rgba(${col[0]},${col[1]},${col[2]},${Math.max(0.05, alpha)})`;
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.moveTo(proj[a][0], proj[a][1]);
      ctx.lineTo(lerp(proj[a][0], proj[b][0], dr), lerp(proj[a][1], proj[b][1], dr));
      ctx.stroke();
    });
    proj.forEach((pt) => {
      ctx.fillStyle = `rgba(${BONE[0]},${BONE[1]},${BONE[2]},${0.3 + 0.45 * asm})`;
      ctx.beginPath();
      ctx.arc(pt[0], pt[1], 1.5 + asm * 0.9, 0, 7);
      ctx.fill();
    });
  };

  const loop = (now) => {
    draw(now);
    if (visible && !reduced) raf = requestAnimationFrame(loop);
  };

  const io = new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    cancelAnimationFrame(raf);
    if (visible) raf = requestAnimationFrame(loop);
  });

  resize();
  draw(0);
  io.observe(section);
  addEventListener("resize", () => { resize(); draw(0); }, { passive: true });
}
