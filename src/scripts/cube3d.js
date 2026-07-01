// Minimal 3D cube renderer for SVG: vertices rotated in 3D, projected
// orthographically, faces lit and backface-culled per frame. Edges are drawn
// in a separate wireframe pass on top of all fills so shared edges keep their
// full stroke width (a face fill painted later would otherwise cover half of
// its neighbour's stroke).

const NS = "http://www.w3.org/2000/svg";

export const el = (name, attrs = {}, parent) => {
  const n = document.createElementNS(NS, name);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
  if (parent) parent.appendChild(n);
  return n;
};

const rotX = (a) => {
  const c = Math.cos(a), s = Math.sin(a);
  return [[1, 0, 0], [0, c, -s], [0, s, c]];
};
const rotY = (a) => {
  const c = Math.cos(a), s = Math.sin(a);
  return [[c, 0, s], [0, 1, 0], [-s, 0, c]];
};
const mul = (A, B) => A.map((r, i) => r.map((_, j) => A[i][0] * B[0][j] + A[i][1] * B[1][j] + A[i][2] * B[2][j]));
const apply = (M, v) => [
  M[0][0] * v[0] + M[0][1] * v[1] + M[0][2] * v[2],
  M[1][0] * v[0] + M[1][1] * v[1] + M[1][2] * v[2],
  M[2][0] * v[0] + M[2][1] * v[1] + M[2][2] * v[2],
];

const VERTS = Array.from({ length: 8 }, (_, i) => [i & 1 ? 1 : -1, i & 2 ? 1 : -1, i & 4 ? 1 : -1]);
// outward-wound faces: +z -z +x -x +y(top) -y
const FACES = [[4, 5, 7, 6], [1, 0, 2, 3], [5, 1, 3, 7], [0, 4, 6, 2], [6, 7, 3, 2], [0, 1, 5, 4]];
export const TOP_FACE = 4;
const LIGHT = (() => {
  const l = [-0.45, 0.75, 0.55], m = Math.hypot(...l);
  return l.map((v) => v / m);
})();
const CAM_PITCH = 0.6155; // 35.26° — classic isometric

export function makeCube(parent, half, strokeW, palette) {
  const g = el("g", {}, parent);
  const facesG = el("g", {}, g);
  const linesG = el("g", {}, g);
  const faces = FACES.map((idx, f) => ({
    idx,
    poly: el("polygon", { class: "cube-face", fill: `var(${palette[f]})` }, facesG),
    shade: el("polygon", { "pointer-events": "none" }, facesG),
    line: el("polygon", {
      fill: "none", stroke: "var(--art-stroke)", "stroke-width": strokeW,
      "stroke-linejoin": "round", "pointer-events": "none",
    }, linesG),
  }));
  return {
    g,
    setFace(i, cssVar) { faces[i].poly.setAttribute("fill", `var(${cssVar})`); },
    render(cx, cy, yaw, nod = 0, scale = 1) {
      const R = mul(rotX(CAM_PITCH + nod), rotY(yaw));
      const pts = VERTS.map((v) => apply(R, v.map((c) => c * half * scale)));
      for (const f of faces) {
        const [a, b, , d] = f.idx.map((i) => pts[i]);
        const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
        const w = [d[0] - a[0], d[1] - a[1], d[2] - a[2]];
        const n = [u[1] * w[2] - u[2] * w[1], u[2] * w[0] - u[0] * w[2], u[0] * w[1] - u[1] * w[0]];
        if (n[2] <= 0) {
          f.poly.setAttribute("points", "");
          f.shade.setAttribute("points", "");
          f.line.setAttribute("points", "");
          continue;
        }
        const m = Math.hypot(...n);
        const lam = Math.max(0, (n[0] * LIGHT[0] + n[1] * LIGHT[1] + n[2] * LIGHT[2]) / m);
        const P = f.idx.map((i) => `${(cx + pts[i][0]).toFixed(3)},${(cy - pts[i][1]).toFixed(3)}`).join(" ");
        f.poly.setAttribute("points", P);
        f.shade.setAttribute("points", P);
        f.shade.setAttribute("fill", `rgba(0, 0, 0, ${(0.16 * (1 - lam)).toFixed(3)})`);
        f.line.setAttribute("points", P);
      }
    },
  };
}

export const easeOutElastic = (t) =>
  t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -9 * t) * Math.sin((t * 10 - 0.75) * (2 * Math.PI / 3)) + 1;

export const prefersReducedMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
