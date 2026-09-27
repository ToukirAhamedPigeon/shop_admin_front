// Procedural human-brain geometry for the login BrainScene.
//
// Runs inside a Web Worker (brain.worker.ts) so building ~270k triangles never
// blocks the page; the result is plain typed arrays the scene wraps in
// BufferGeometries. See BrainScene.tsx for how it is shaded.
//
// Anatomy: two cerebral hemispheres with a thin longitudinal fissure, temporal
// lobes (their overlap forms the Sylvian fissure), a foliated cerebellum and a
// brainstem. Sulci are the zero sets of smooth fields (f1 major, f2 minor);
// the fragment shader draws them as crisp lines, and the mesh is carved with a
// shallow valley under each so gyri read as rounded bulges.
import * as THREE from "three";
import { mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";

export const NEURON_COUNT = 190;
const MAX_LINK_DIST = 0.5;

/* ------------------------------------------------------------------ */
/* Noise                                                               */
/* ------------------------------------------------------------------ */
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hash3(x: number, y: number, z: number) {
  let h = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ Math.imul(z, 1440662683);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

function noise3(x: number, y: number, z: number) {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
  const xf = x - xi, yf = y - yi, zf = z - zi;
  const u = xf * xf * xf * (xf * (xf * 6 - 15) + 10);
  const v = yf * yf * yf * (yf * (yf * 6 - 15) + 10);
  const w = zf * zf * zf * (zf * (zf * 6 - 15) + 10);
  const c = (dx: number, dy: number, dz: number) => hash3(xi + dx, yi + dy, zi + dz);
  const l = (a: number, b: number, t: number) => a + (b - a) * t;
  return l(
    l(l(c(0, 0, 0), c(1, 0, 0), u), l(c(0, 1, 0), c(1, 1, 0), u), v),
    l(l(c(0, 0, 1), c(1, 0, 1), u), l(c(0, 1, 1), c(1, 1, 1), u), v),
    w
  );
}

/** Domain-warped noise; its 0.5 contour traces winding, gyrus-like curves. */
function foldField(x: number, y: number, z: number, f: number, seed: number) {
  const qx = x * f + seed, qy = y * f + seed * 0.7, qz = z * f + seed * 1.3;
  const wx = noise3(qx * 0.6 + 5.2, qy * 0.6, qz * 0.6) - 0.5;
  const wy = noise3(qx * 0.6, qy * 0.6 + 9.1, qz * 0.6) - 0.5;
  const wz = noise3(qx * 0.6, qy * 0.6, qz * 0.6 + 3.7) - 0.5;
  const px = qx + wx * 1.6, py = qy + wy * 1.6, pz = qz + wz * 1.6;
  return 0.72 * noise3(px, py, pz) + 0.28 * noise3(px * 2.1 + 1.3, py * 2.1, pz * 2.1);
}

const band = (v: number, width: number) => Math.exp(-((v / width) ** 2));

/* ------------------------------------------------------------------ */
/* Anatomy (X = front, Y = up, Z = left/right)                         */
/* ------------------------------------------------------------------ */
type Ellipsoid = { c: THREE.Vector3; r: THREE.Vector3 };
const HEMI_X = 1.5, HEMI_Y = 1.02, HEMI_Z = 0.72, HEMI_OFFSET = 0.37;
const temporal = (side: number): Ellipsoid => ({
  c: new THREE.Vector3(0.28, -0.46, side * 0.6),
  r: new THREE.Vector3(0.82, 0.36, 0.4),
});
const CEREBELLUM: Ellipsoid = { c: new THREE.Vector3(-0.95, -0.7, 0), r: new THREE.Vector3(0.52, 0.3, 0.78) };
const ellipsoidValue = (p: THREE.Vector3, e: Ellipsoid) =>
  ((p.x - e.c.x) / e.r.x) ** 2 + ((p.y - e.c.y) / e.r.y) ** 2 + ((p.z - e.c.z) / e.r.z) ** 2;

type Lobe = { geometry: THREE.BufferGeometry; surface: { p: THREE.Vector3; n: THREE.Vector3 }[] };

/** Builds a displaced, smooth-shaded lobe from a subdivided icosahedron. */
function buildLobe(
  detail: number,
  shape: (
    v: THREE.Vector3,
    out: THREE.Vector3,
    nrm: THREE.Vector3
  ) => { f1: number; f2: number; land: number; disp: number }
): Lobe {
  let geo: THREE.BufferGeometry = new THREE.IcosahedronGeometry(1, detail);
  geo.deleteAttribute("normal");
  geo.deleteAttribute("uv");
  geo = mergeVertices(geo, 1e-5);

  const pos = geo.getAttribute("position") as THREE.BufferAttribute;
  const n = pos.count;
  // f1/f2 are smooth fields whose zero set is a sulcus; the fragment shader
  // draws crisp lines there (per-vertex bands alias into dashes).
  const f1Arr = new Float32Array(n);
  const f2Arr = new Float32Array(n);
  const landArr = new Float32Array(n);
  const toneArr = new Float32Array(n);
  const v = new THREE.Vector3(), out = new THREE.Vector3(), nrm = new THREE.Vector3();

  for (let i = 0; i < n; i++) {
    v.fromBufferAttribute(pos, i).normalize();
    const { f1, f2, land, disp } = shape(v, out, nrm);
    out.addScaledVector(nrm, disp);
    pos.setXYZ(i, out.x, out.y, out.z);
    f1Arr[i] = f1;
    f2Arr[i] = f2;
    landArr[i] = land;
    toneArr[i] = THREE.MathUtils.clamp((out.x + 1.7) / 3.3 + out.y * 0.08, 0, 1);
  }
  geo.setAttribute("aF1", new THREE.BufferAttribute(f1Arr, 1));
  geo.setAttribute("aF2", new THREE.BufferAttribute(f2Arr, 1));
  geo.setAttribute("aLand", new THREE.BufferAttribute(landArr, 1));
  geo.setAttribute("aTone", new THREE.BufferAttribute(toneArr, 1));
  geo.computeVertexNormals();

  const normals = geo.getAttribute("normal") as THREE.BufferAttribute;
  const surface: Lobe["surface"] = [];
  for (let i = 0; i < n; i += 7) {
    surface.push({
      p: new THREE.Vector3().fromBufferAttribute(pos, i),
      n: new THREE.Vector3().fromBufferAttribute(normals, i),
    });
  }
  return { geometry: geo, surface };
}

function ellipsoidNormal(v: THREE.Vector3, rx: number, ry: number, rz: number, out: THREE.Vector3) {
  return out.set(v.x / rx, v.y / ry, v.z / rz).normalize();
}

function hemisphere(side: number): Lobe {
  const temp = temporal(side);
  return buildLobe(64, (v, p, nrm) => {
    // Medial face is flattened so the two hemispheres meet at a thin fissure.
    const medial = v.z * side < 0;
    const rz = HEMI_Z * (medial ? 0.5 : 1);
    p.set(v.x * HEMI_X, 0.05 + v.y * HEMI_Y, side * HEMI_OFFSET + v.z * rz);
    // Gently flattened underside, lower rounded frontal lobe, pointed occipital.
    if (p.y < -0.3) p.y = -0.3 + (p.y + 0.3) * 0.7;
    if (p.x > 0.55) p.y -= (p.x - 0.55) * 0.14;
    if (p.x < -1.0) p.y += (p.x + 1.0) * 0.12;
    ellipsoidNormal(v, HEMI_X, HEMI_Y, rz, nrm);

    // Winding gyri: contours of two warped noise fields (major and minor sulci).
    const f1 = foldField(p.x, p.y, p.z, 2.5, side > 0 ? 3.1 : 17.9) - 0.5;
    const f2 = foldField(p.x, p.y, p.z, 4.6, side > 0 ? 41.7 : 63.3) - 0.5;

    // Central sulcus: slanted groove across the top of the lateral surface.
    const cs = band(p.x - (0.12 - 0.32 * p.y), 0.03) * THREE.MathUtils.smoothstep(p.y, -0.05, 0.35);
    // Lateral (Sylvian) fissure: only the upper rim where the temporal lobe
    // tucks under, fading out toward its front and back ends.
    const aboveTemporal = THREE.MathUtils.smoothstep(p.y, temp.c.y - 0.02, temp.c.y + 0.12);
    const alongTemporal = band((p.x - temp.c.x) / temp.r.x, 0.75);
    const sylvian =
      band(ellipsoidValue(p, temp) - 1.05, 0.08) * aboveTemporal * alongTemporal * (medial ? 0 : 1);
    const land = Math.max(cs, sylvian);

    // Wide, shallow valleys under each line so gyri read as rounded bulges.
    const valley = Math.max(band(f1, 0.06), band(f2, 0.05) * 0.45, land);
    return { f1, f2, land, disp: 0.03 - 0.06 * valley };
  });
}

function temporalLobe(side: number): Lobe {
  const e = temporal(side);
  return buildLobe(40, (v, p, nrm) => {
    p.set(e.c.x + v.x * e.r.x, e.c.y + v.y * e.r.y, e.c.z + v.z * e.r.z);
    // Tip bends forward and down like the temporal pole.
    if (p.x > 0.6) p.y -= (p.x - 0.6) * 0.18;
    ellipsoidNormal(v, e.r.x, e.r.y, e.r.z, nrm);
    const f1 = foldField(p.x, p.y, p.z, 2.8, side > 0 ? 88.1 : 95.4) - 0.5;
    // Temporal gyri run roughly front-to-back: horizontal wavy sulci.
    const f2 = Math.sin(p.y * 16 + f1 * 6) * 0.25;
    const valley = Math.max(band(f1, 0.06), band(f2, 0.08) * 0.6);
    return { f1, f2, land: 0, disp: 0.025 - 0.05 * valley };
  });
}

function cerebellum(): Lobe {
  const e = CEREBELLUM;
  return buildLobe(44, (v, p, nrm) => {
    p.set(e.c.x + v.x * e.r.x, e.c.y + v.y * e.r.y, e.c.z + v.z * e.r.z);
    // Two lobes either side of the vermis.
    p.y -= band(p.z, 0.12) * 0.04;
    ellipsoidNormal(v, e.r.x, e.r.y, e.r.z, nrm);
    // Dense, parallel folia: zero crossings of a gently warped sine.
    const f2 = Math.sin(p.y * 34 + noise3(p.x * 3, p.y * 3, p.z * 3) * 3 + p.x * 5) * 0.3;
    const land = band(p.z, 0.035);
    return { f1: 1, f2, land, disp: 0.015 - 0.025 * band(f2, 0.12) };
  });
}

function brainstem(): THREE.BufferGeometry {
  const geo = new THREE.CylinderGeometry(0.1, 0.19, 1.05, 48, 24, true);
  const top = new THREE.Vector3(-0.3, -0.5, 0);
  const bottom = new THREE.Vector3(-0.46, -1.5, 0);
  const dir = new THREE.Vector3().subVectors(top, bottom).normalize();
  geo.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir));
  geo.translate((top.x + bottom.x) / 2, (top.y + bottom.y) / 2, 0);
  const n = geo.getAttribute("position").count;
  const pos = geo.getAttribute("position") as THREE.BufferAttribute;
  const f1 = new Float32Array(n).fill(1), f2 = new Float32Array(n), land = new Float32Array(n), tone = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const y = pos.getY(i), z = pos.getZ(i), x = pos.getX(i);
    f2[i] = Math.sin(Math.atan2(z, x + 0.4) * 5) * 0.3; // faint fibre tracts
    tone[i] = THREE.MathUtils.clamp((x + 1.7) / 3.3 + y * 0.08, 0, 1);
  }
  geo.setAttribute("aF1", new THREE.BufferAttribute(f1, 1));
  geo.setAttribute("aF2", new THREE.BufferAttribute(f2, 1));
  geo.setAttribute("aLand", new THREE.BufferAttribute(land, 1));
  geo.setAttribute("aTone", new THREE.BufferAttribute(tone, 1));
  return geo;
}


export type MeshData = {
  position: Float32Array;
  normal: Float32Array;
  index: Uint32Array | null;
  f1: Float32Array;
  f2: Float32Array;
  land: Float32Array;
  tone: Float32Array;
};

export type BrainData = {
  meshes: MeshData[];
  neurons: Float32Array; // xyz per neuron
  edges: Uint16Array; // pairs of neuron indices
};

function toMeshData(geo: THREE.BufferGeometry): MeshData {
  const attr = (name: string) => (geo.getAttribute(name) as THREE.BufferAttribute).array as Float32Array;
  const index = geo.getIndex();
  return {
    position: attr("position"),
    normal: attr("normal"),
    index: index ? Uint32Array.from(index.array as ArrayLike<number>) : null,
    f1: attr("aF1"),
    f2: attr("aF2"),
    land: attr("aLand"),
    tone: attr("aTone"),
  };
}

export function buildBrainData(): BrainData {
  const lobes = [hemisphere(1), hemisphere(-1), temporalLobe(1), temporalLobe(-1), cerebellum()];
  const stem = brainstem();

  // Neurons on the cortex, nudged outward so they sit on the surface.
  const rand = mulberry32(9);
  const pool = lobes.flatMap((l) => l.surface);
  const neurons: THREE.Vector3[] = [];
  let guard = 0;
  while (neurons.length < NEURON_COUNT && guard++ < NEURON_COUNT * 200) {
    const s = pool[Math.floor(rand() * pool.length)];
    const candidate = s.p.clone().addScaledVector(s.n, 0.035);
    if (neurons.some((q) => q.distanceToSquared(candidate) < 0.03)) continue;
    neurons.push(candidate);
  }

  const edges: number[] = [];
  neurons.forEach((a, i) => {
    neurons
      .map((b, j) => ({ j, d: a.distanceTo(b) }))
      .filter(({ j, d }) => j > i && d < MAX_LINK_DIST)
      .sort((x, y) => x.d - y.d)
      .slice(0, 3)
      .forEach(({ j }) => edges.push(i, j));
  });

  return {
    meshes: [...lobes.map((l) => toMeshData(l.geometry)), toMeshData(stem)],
    neurons: new Float32Array(neurons.flatMap((v) => [v.x, v.y, v.z])),
    edges: Uint16Array.from(edges),
  };
}
