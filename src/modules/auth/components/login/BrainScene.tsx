// Full-screen Three.js human brain for the login page (desktop only).
//
// The brain is procedural: two cerebral hemispheres, temporal lobes, a
// cerebellum and a brainstem, with folds (gyri/sulci) carved by ridged noise
// so it reads as a brain in profile. Inside it, multicolour signals travel
// neuron to neuron in chains; neurons flash when a signal arrives. Hovering
// near a neuron fires it, and clicking over the brand side sends a burst.
//
// Loaded lazily from LoginPage so three.js never reaches the main bundle.
import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

/* ------------------------------------------------------------------ */
/* Tunables                                                            */
/* ------------------------------------------------------------------ */
const CORTEX_POINTS = 5200;
const NEURON_COUNT = 240;
const LINKS_PER_NEURON = 3;
const MAX_LINK_DIST = 0.75;
const SIGNAL_COUNT = 70;
const TRAIL = 4; // points per signal (head + trail)
const SIGNAL_COLORS = ["#22d3ee", "#e879f9", "#fbbf24", "#a3e635", "#818cf8", "#fb7185"].map(
  (c) => new THREE.Color(c)
);

/* ------------------------------------------------------------------ */
/* Deterministic randomness + ridged value noise for the folds         */
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

function valueNoise(x: number, y: number, z: number) {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
  const xf = x - xi, yf = y - yi, zf = z - zi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf), w = zf * zf * (3 - 2 * zf);
  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
  const c = (dx: number, dy: number, dz: number) => hash3(xi + dx, yi + dy, zi + dz);
  return lerp(
    lerp(lerp(c(0, 0, 0), c(1, 0, 0), u), lerp(c(0, 1, 0), c(1, 1, 0), u), v),
    lerp(lerp(c(0, 0, 1), c(1, 0, 1), u), lerp(c(0, 1, 1), c(1, 1, 1), u), v),
    w
  );
}

/** 1 on fold crests (gyri), 0 in the grooves (sulci). */
function ridge(p: THREE.Vector3, freq: number) {
  let sum = 0, amp = 0.65, f = freq;
  for (let o = 0; o < 2; o++) {
    const n = valueNoise(p.x * f + 11.3, p.y * f + 4.1, p.z * f + 7.7);
    sum += amp * (1 - Math.abs(2 * n - 1));
    amp *= 0.35;
    f *= 2.1;
  }
  return Math.min(1, sum / 0.88);
}

/* ------------------------------------------------------------------ */
/* Brain anatomy (X = front, Y = up, Z = left/right)                   */
/* ------------------------------------------------------------------ */
type Ellipsoid = { c: THREE.Vector3; r: THREE.Vector3 };
const HEMI_L: Ellipsoid = { c: new THREE.Vector3(0, 0.05, 0.5), r: new THREE.Vector3(1.5, 1.02, 0.66) };
const HEMI_R: Ellipsoid = { c: new THREE.Vector3(0, 0.05, -0.5), r: new THREE.Vector3(1.5, 1.02, 0.66) };
const TEMP_L: Ellipsoid = { c: new THREE.Vector3(0.2, -0.55, 0.62), r: new THREE.Vector3(0.95, 0.42, 0.44) };
const TEMP_R: Ellipsoid = { c: new THREE.Vector3(0.2, -0.55, -0.62), r: new THREE.Vector3(0.95, 0.42, 0.44) };
const CEREBELLUM: Ellipsoid = { c: new THREE.Vector3(-1.1, -0.78, 0), r: new THREE.Vector3(0.62, 0.38, 0.98) };

const inside = (p: THREE.Vector3, e: Ellipsoid, pad = 1) =>
  ((p.x - e.c.x) / e.r.x) ** 2 + ((p.y - e.c.y) / e.r.y) ** 2 + ((p.z - e.c.z) / e.r.z) ** 2 < pad;

/** Flatten the underside of the cerebrum a little, like a real brain. */
function shapeCerebrum(p: THREE.Vector3) {
  if (p.y < -0.25) p.y = -0.25 + (p.y + 0.25) * 0.55;
  // Frontal lobe slightly lower and rounder, occipital a touch pointed.
  if (p.x > 0.6) p.y -= (p.x - 0.6) * 0.12;
  if (p.x < -1.0) p.y += (p.x + 1.0) * 0.1;
  return p;
}

function colorFor(p: THREE.Vector3, region: "cerebrum" | "temporal" | "cerebellum" | "stem") {
  const c = new THREE.Color();
  if (region === "cerebellum") return c.setHSL(0.08 + p.z * 0.02, 0.9, 0.6); // amber
  if (region === "stem") return c.setHSL(0.13, 0.7, 0.55);
  if (region === "temporal") return c.setHSL(0.5 + p.x * 0.03, 0.85, 0.58); // cyan-teal
  // Cerebrum: violet at the back sweeping to magenta/pink at the front, lighter on top.
  const hue = 0.72 + (p.x + 1.5) * 0.075 + p.y * 0.02;
  return c.setHSL(hue % 1, 0.85, 0.58 + p.y * 0.05);
}

function sampleSurface(e: Ellipsoid, rand: () => number, out: THREE.Vector3) {
  const u = rand() * 2 - 1;
  const th = rand() * Math.PI * 2;
  const s = Math.sqrt(1 - u * u);
  out.set(s * Math.cos(th), u, s * Math.sin(th));
  const dir = out.clone();
  out.set(e.c.x + dir.x * e.r.x, e.c.y + dir.y * e.r.y, e.c.z + dir.z * e.r.z);
  return dir;
}

function buildBrain() {
  const rand = mulberry32(42);
  const cortexPos: number[] = [];
  const cortexCol: number[] = [];
  const cortexSize: number[] = [];
  const p = new THREE.Vector3();

  const push = (v: THREE.Vector3, col: THREE.Color, size: number) => {
    cortexPos.push(v.x, v.y, v.z);
    cortexCol.push(col.r, col.g, col.b);
    cortexSize.push(size);
  };

  let guard = 0;
  while (cortexPos.length / 3 < CORTEX_POINTS && guard++ < CORTEX_POINTS * 40) {
    const roll = rand();
    if (roll < 0.74) {
      // Cerebral hemispheres; skip the medial wall so the fissure stays open.
      const hemi = rand() < 0.5 ? HEMI_L : HEMI_R;
      const dir = sampleSurface(hemi, rand, p);
      if (Math.abs(dir.z) > 0.78 && Math.sign(dir.z) !== Math.sign(hemi.c.z)) continue;
      shapeCerebrum(p);
      const r = ridge(p, 2.4);
      if (rand() > 0.12 + 0.88 * r * r) continue; // dense on gyri, sparse in sulci
      p.addScaledVector(dir, (r - 0.5) * 0.09);
      push(p, colorFor(p, "cerebrum"), 5 + r * 5);
    } else if (roll < 0.86) {
      const temp = rand() < 0.5 ? TEMP_L : TEMP_R;
      const dir = sampleSurface(temp, rand, p);
      if (inside(p, HEMI_L, 0.97) || inside(p, HEMI_R, 0.97)) continue;
      const r = ridge(p, 2.6);
      if (rand() > 0.15 + 0.85 * r * r) continue;
      p.addScaledVector(dir, (r - 0.5) * 0.07);
      push(p, colorFor(p, "temporal"), 5 + r * 4);
    } else if (roll < 0.97) {
      // Cerebellum: tight horizontal folia.
      const dir = sampleSurface(CEREBELLUM, rand, p);
      if (inside(p, HEMI_L, 0.95) || inside(p, HEMI_R, 0.95)) continue;
      const folia = 0.5 + 0.5 * Math.sin(p.y * 46 + dir.x * 3);
      if (rand() > 0.2 + 0.8 * folia) continue;
      push(p, colorFor(p, "cerebellum"), 4 + folia * 3);
    } else {
      // Brainstem: a tapered tube angling down and back.
      const t = rand();
      const a = rand() * Math.PI * 2;
      const rad = 0.24 - t * 0.08;
      p.set(-0.45 - t * 0.25 + Math.cos(a) * rad * 0.6, -0.72 - t * 0.95, Math.sin(a) * rad);
      push(p, colorFor(p, "stem"), 4.5);
    }
  }

  // Neurons sit just under the cortex (and some in the cerebellum).
  const neurons: THREE.Vector3[] = [];
  const neuronCol: THREE.Color[] = [];
  guard = 0;
  while (neurons.length < NEURON_COUNT && guard++ < NEURON_COUNT * 50) {
    const inCb = rand() < 0.12;
    const e = inCb ? CEREBELLUM : rand() < 0.5 ? HEMI_L : HEMI_R;
    const dir = sampleSurface(e, rand, p);
    const depth = 0.55 + rand() * 0.38;
    p.set(e.c.x + dir.x * e.r.x * depth, e.c.y + dir.y * e.r.y * depth, e.c.z + dir.z * e.r.z * depth);
    if (!inCb) {
      shapeCerebrum(p);
      if (inside(p, CEREBELLUM)) continue;
    }
    neurons.push(p.clone());
    neuronCol.push(colorFor(p, inCb ? "cerebellum" : "cerebrum").offsetHSL(0, 0, 0.08));
  }

  // Synapses: nearest neighbours within reach.
  const adjacency: number[][] = neurons.map(() => []);
  const edges: [number, number][] = [];
  const seen = new Set<string>();
  neurons.forEach((a, i) => {
    neurons
      .map((b, j) => ({ j, d: a.distanceTo(b) }))
      .filter(({ j, d }) => j !== i && d < MAX_LINK_DIST)
      .sort((x, y) => x.d - y.d)
      .slice(0, LINKS_PER_NEURON)
      .forEach(({ j }) => {
        const key = i < j ? `${i}-${j}` : `${j}-${i}`;
        if (seen.has(key)) return;
        seen.add(key);
        edges.push([i, j]);
        adjacency[i].push(j);
        adjacency[j].push(i);
      });
  });

  return {
    cortex: {
      pos: new Float32Array(cortexPos),
      col: new Float32Array(cortexCol),
      size: new Float32Array(cortexSize),
    },
    neurons,
    neuronCol,
    edges,
    adjacency,
  };
}

/* ------------------------------------------------------------------ */
/* Glow point shader (round, soft, additive)                           */
/* ------------------------------------------------------------------ */
const pointVertex = /* glsl */ `
  attribute vec3 aColor;
  attribute float aSize;
  attribute float aGlow;
  uniform float uPixelRatio;
  varying vec3 vColor;
  varying float vGlow;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = aSize * (1.0 + aGlow * 2.2) * uPixelRatio * (6.0 / -mv.z);
    vColor = aColor;
    vGlow = aGlow;
  }
`;
const pointFragment = /* glsl */ `
  uniform float uOpacity;
  varying vec3 vColor;
  varying float vGlow;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float core = smoothstep(0.5, 0.0, d);
    float a = pow(core, 1.8);
    vec3 c = mix(vColor, vec3(1.0), clamp(vGlow, 0.0, 1.0) * 0.55 * core);
    gl_FragColor = vec4(c, a * uOpacity * (0.6 + vGlow * 1.4));
  }
`;

function useGlowMaterial(opacity: number) {
  const dpr = useThree((s) => s.viewport.dpr);
  return useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: pointVertex,
        fragmentShader: pointFragment,
        uniforms: { uPixelRatio: { value: dpr }, uOpacity: { value: opacity } },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [dpr, opacity]
  );
}

/* ------------------------------------------------------------------ */
/* Scene                                                               */
/* ------------------------------------------------------------------ */
type Signal = { from: number; to: number; t: number; speed: number; color: THREE.Color; hops: number };

function Brain({ animate, offsetX }: { animate: boolean; offsetX: number }) {
  const group = useRef<THREE.Group>(null);
  const neuronGeo = useRef<THREE.BufferGeometry>(null);
  const signalGeo = useRef<THREE.BufferGeometry>(null);
  const { viewport, camera, size } = useThree();

  const brain = useMemo(buildBrain, []);
  const cortexMat = useGlowMaterial(0.55);
  const neuronMat = useGlowMaterial(1);
  const signalMat = useGlowMaterial(1);

  const neuronData = useMemo(() => {
    const pos = new Float32Array(brain.neurons.flatMap((v) => [v.x, v.y, v.z]));
    const col = new Float32Array(brain.neuronCol.flatMap((c) => [c.r, c.g, c.b]));
    const size = new Float32Array(brain.neurons.length).fill(9);
    const glow = new Float32Array(brain.neurons.length);
    return { pos, col, size, glow };
  }, [brain]);

  const linkData = useMemo(() => {
    const pos = new Float32Array(brain.edges.length * 6);
    const col = new Float32Array(brain.edges.length * 6);
    brain.edges.forEach(([a, b], i) => {
      const A = brain.neurons[a], B = brain.neurons[b];
      pos.set([A.x, A.y, A.z, B.x, B.y, B.z], i * 6);
      const ca = brain.neuronCol[a], cb = brain.neuronCol[b];
      col.set([ca.r, ca.g, ca.b, cb.r, cb.g, cb.b], i * 6);
    });
    return { pos, col };
  }, [brain]);

  const signalData = useMemo(() => {
    const n = SIGNAL_COUNT * TRAIL;
    const size = new Float32Array(n);
    for (let i = 0; i < SIGNAL_COUNT; i++)
      for (let k = 0; k < TRAIL; k++) size[i * TRAIL + k] = 13 * (1 - k / TRAIL) + 2;
    return { pos: new Float32Array(n * 3), col: new Float32Array(n * 3), size, glow: new Float32Array(n).fill(0.35) };
  }, []);

  const signals = useRef<Signal[]>([]);
  const lastHover = useRef({ node: -1, at: 0 });
  const screen = useMemo(() => brain.neurons.map(() => new THREE.Vector3()), [brain]);

  const pickColor = () => SIGNAL_COLORS[Math.floor(Math.random() * SIGNAL_COLORS.length)];
  const neighbourOf = (n: number, avoid = -1) => {
    const adj = brain.adjacency[n];
    if (!adj.length) return -1;
    const options = adj.length > 1 ? adj.filter((m) => m !== avoid) : adj;
    return options[Math.floor(Math.random() * options.length)];
  };
  const spawn = (from: number, color = pickColor()) => {
    const to = neighbourOf(from);
    if (to < 0) return null;
    return { from, to, t: 0, speed: 0.9 + Math.random() * 0.9, color, hops: 0 } satisfies Signal;
  };
  const fire = (node: number, count: number) => {
    neuronData.glow[node] = 1;
    for (let i = 0; i < count; i++) {
      const s = spawn(node);
      if (!s) continue;
      // Replace the oldest signal so the pool size stays bounded.
      if (signals.current.length >= SIGNAL_COUNT) signals.current.shift();
      signals.current.push(s);
    }
  };

  // Seed the network with signals.
  useEffect(() => {
    signals.current = [];
    for (let i = 0; i < SIGNAL_COUNT; i++) {
      const s = spawn(Math.floor(Math.random() * brain.neurons.length));
      if (s) {
        s.t = Math.random();
        signals.current.push(s);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brain]);

  const nearestNeuron = (ndcX: number, ndcY: number, maxDist: number) => {
    const g = group.current;
    if (!g) return -1;
    let best = -1, bestD = maxDist;
    const aspect = size.width / size.height;
    brain.neurons.forEach((v, i) => {
      const s = screen[i].copy(v).applyMatrix4(g.matrixWorld).project(camera);
      const d = Math.hypot((s.x - ndcX) * aspect, s.y - ndcY);
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    });
    return best;
  };

  // Click over the brand side of the page sends a burst from the nearest neuron.
  useEffect(() => {
    if (!animate) return;
    const onDown = (e: PointerEvent) => {
      if (e.clientX > window.innerWidth * 0.55) return;
      const ndcX = (e.clientX / window.innerWidth) * 2 - 1;
      const ndcY = -(e.clientY / window.innerHeight) * 2 + 1;
      const n = nearestNeuron(ndcX, ndcY, 0.35);
      if (n < 0) return;
      fire(n, 8);
      brain.adjacency[n].forEach((m) => fire(m, 2));
    };
    window.addEventListener("pointerdown", onDown);
    return () => window.removeEventListener("pointerdown", onDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animate, brain]);

  useFrame((state, delta) => {
    const g = group.current;
    if (!g) return;
    const dt = Math.min(delta, 0.05);
    const time = state.clock.elapsedTime;

    // Fit: brain ~58% of the viewport height, centred slightly below the
    // headline and straddling the seam so part of it sits behind the glass.
    const scale = (viewport.height * 0.58) / 2.7;
    g.scale.setScalar(scale);
    g.position.set(offsetX * viewport.width, 0.12 * scale, 0);

    // Gentle sway so it reads as 3D, plus pointer tilt.
    const swayY = animate ? Math.sin(time * 0.22) * 0.42 : 0;
    g.rotation.y += (swayY + state.pointer.x * 0.25 - g.rotation.y) * 0.05;
    g.rotation.x += (-state.pointer.y * 0.15 - g.rotation.x) * 0.05;

    const glow = neuronData.glow;
    if (animate) {
      // Neuron flash decay plus a faint idle shimmer.
      for (let i = 0; i < glow.length; i++) {
        glow[i] = Math.max(glow[i] * Math.exp(-dt * 2.4), 0.06 + 0.06 * Math.sin(time * 1.3 + i * 1.7));
      }

      // Hovering near a neuron fires it (throttled per neuron).
      if (state.pointer.x < 0.1) {
        const n = nearestNeuron(state.pointer.x, state.pointer.y, 0.06);
        if (n >= 0 && (n !== lastHover.current.node || time - lastHover.current.at > 0.6)) {
          lastHover.current = { node: n, at: time };
          fire(n, 3);
        }
      }

      // Advance signals; on arrival flash the neuron and hop onward.
      const list = signals.current;
      for (let i = list.length - 1; i >= 0; i--) {
        const s = list[i];
        s.t += dt * s.speed;
        if (s.t < 1) continue;
        glow[s.to] = Math.min(1.4, glow[s.to] + 0.9);
        const next = s.hops < 7 && Math.random() < 0.82 ? neighbourOf(s.to, s.from) : -1;
        if (next >= 0) {
          s.from = s.to;
          s.to = next;
          s.t = 0;
          s.hops++;
        } else {
          const fresh = spawn(Math.floor(Math.random() * brain.neurons.length));
          if (fresh) list[i] = fresh;
          else list.splice(i, 1);
        }
      }
    }

    // Write signal heads and trails.
    const tmp = new THREE.Vector3();
    const sp = signalData.pos, sc = signalData.col;
    for (let i = 0; i < SIGNAL_COUNT; i++) {
      const s = signals.current[i];
      for (let k = 0; k < TRAIL; k++) {
        const idx = (i * TRAIL + k) * 3;
        if (!s) {
          sp.set([0, 0, 0], idx);
          sc.set([0, 0, 0], idx);
          continue;
        }
        const t = Math.max(0, s.t - k * 0.045);
        tmp.lerpVectors(brain.neurons[s.from], brain.neurons[s.to], t);
        sp.set([tmp.x, tmp.y, tmp.z], idx);
        const fade = 1 - k / TRAIL;
        sc.set([s.color.r * fade, s.color.g * fade, s.color.b * fade], idx);
      }
    }

    const ng = neuronGeo.current, sg = signalGeo.current;
    if (ng) ng.getAttribute("aGlow").needsUpdate = true;
    if (sg) {
      sg.getAttribute("position").needsUpdate = true;
      sg.getAttribute("aColor").needsUpdate = true;
    }
  });

  return (
    <group ref={group}>
      {/* Cortex surface */}
      <points material={cortexMat}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[brain.cortex.pos, 3]} />
          <bufferAttribute attach="attributes-aColor" args={[brain.cortex.col, 3]} />
          <bufferAttribute attach="attributes-aSize" args={[brain.cortex.size, 1]} />
          <bufferAttribute
            attach="attributes-aGlow"
            args={[new Float32Array(brain.cortex.size.length), 1]}
          />
        </bufferGeometry>
      </points>

      {/* Synapses */}
      <lineSegments>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[linkData.pos, 3]} />
          <bufferAttribute attach="attributes-color" args={[linkData.col, 3]} />
        </bufferGeometry>
        <lineBasicMaterial vertexColors transparent opacity={0.22} depthWrite={false} blending={THREE.AdditiveBlending} />
      </lineSegments>

      {/* Neurons */}
      <points material={neuronMat}>
        <bufferGeometry ref={neuronGeo}>
          <bufferAttribute attach="attributes-position" args={[neuronData.pos, 3]} />
          <bufferAttribute attach="attributes-aColor" args={[neuronData.col, 3]} />
          <bufferAttribute attach="attributes-aSize" args={[neuronData.size, 1]} />
          <bufferAttribute attach="attributes-aGlow" args={[neuronData.glow, 1]} />
        </bufferGeometry>
      </points>

      {/* Signals */}
      <points material={signalMat} frustumCulled={false}>
        <bufferGeometry ref={signalGeo}>
          <bufferAttribute attach="attributes-position" args={[signalData.pos, 3]} />
          <bufferAttribute attach="attributes-aColor" args={[signalData.col, 3]} />
          <bufferAttribute attach="attributes-aSize" args={[signalData.size, 1]} />
          <bufferAttribute attach="attributes-aGlow" args={[signalData.glow, 1]} />
        </bufferGeometry>
      </points>
    </group>
  );
}

export default function BrainScene({ animate = true, offsetX = -0.07 }: { animate?: boolean; offsetX?: number }) {
  return (
    <Canvas
      camera={{ position: [0, 0, 7], fov: 45 }}
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      frameloop={animate ? "always" : "demand"}
      eventSource={typeof document !== "undefined" ? document.body : undefined}
      eventPrefix="client"
    >
      <Brain animate={animate} offsetX={offsetX} />
    </Canvas>
  );
}
