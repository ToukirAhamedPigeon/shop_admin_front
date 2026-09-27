// Full-screen Three.js human brain for the login page (desktop only).
//
// The brain is a real surface (not a point cloud) so it reads as a brain:
//   - two cerebral hemispheres with a narrow longitudinal fissure,
//   - temporal lobes whose overlap forms the Sylvian fissure,
//   - a striped cerebellum and a brainstem.
// Gyri bulge and sulci are carved into the mesh from domain-warped noise
// contours (which give the winding, worm-like fold pattern), plus explicit
// central and lateral sulci. A holographic shader lights the sulci as glowing
// lines, adds a rim glow and simple shading so the folds read in 3D.
//
// Neurons sit on the cortex; multicolour signals hop neuron to neuron and
// the cortex itself lights up wherever a signal passes or a neuron fires.
// Hover near a neuron to fire it; click the brand side for a burst.
//
// Geometry is built in a Web Worker (brainGeometry.ts) so the page stays
// responsive; the brain fades in once it arrives. Loaded lazily from
// LoginPage so three.js never reaches the main bundle.
import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { PerformanceMonitor } from "@react-three/drei";
import * as THREE from "three";
import type { BrainData } from "./brainGeometry";

/* ------------------------------------------------------------------ */
/* Tunables                                                            */
/* ------------------------------------------------------------------ */
const SIGNAL_COUNT = 56;
const TRAIL = 4;
const HOT_SPOTS = 24; // surface glow sources passed to the shader
const SIGNAL_COLORS = ["#38bdf8", "#e879f9", "#fb923c", "#a3e635", "#818cf8", "#f472b6"].map(
  (c) => new THREE.Color(c)
);
const FIRE_COLOR = new THREE.Color("#ff9d5c");

/* ------------------------------------------------------------------ */
/* Shaders                                                             */
/* ------------------------------------------------------------------ */
const cortexVertex = /* glsl */ `
  attribute float aF1;
  attribute float aF2;
  attribute float aLand;
  attribute float aTone;
  varying vec3 vN;
  varying vec3 vV;
  varying vec3 vObj;
  varying float vF1;
  varying float vF2;
  varying float vLand;
  varying float vTone;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vN = normalize(normalMatrix * normal);
    vV = -mv.xyz;
    vObj = position;
    vF1 = aF1;
    vF2 = aF2;
    vLand = aLand;
    vTone = aTone;
    gl_Position = projectionMatrix * mv;
  }
`;

const cortexFragment = /* glsl */ `
  #define HOT ${HOT_SPOTS}
  uniform float uTime;
  uniform float uFade;
  uniform vec4 uHot[HOT];
  uniform vec3 uHotColor[HOT];
  varying vec3 vN;
  varying vec3 vV;
  varying vec3 vObj;
  varying float vF1;
  varying float vF2;
  varying float vLand;
  varying float vTone;

  // Screen-space distance (in pixels) to the zero set of a smooth field, so
  // every sulcus draws at the same crisp width however steep the field is.
  float pxDist(float f) {
    return abs(f) / max(fwidth(f), 1e-5);
  }
  float isoLine(float f, float widthPx) {
    return 1.0 - smoothstep(widthPx * 0.5, widthPx * 0.5 + 1.0, pxDist(f));
  }

  void main() {
    vec3 N = normalize(vN);
    vec3 V = normalize(vV);
    float ndv = clamp(dot(N, V), 0.0, 1.0);
    float fres = pow(1.0 - ndv, 2.4);
    float diff = clamp(dot(N, normalize(vec3(-0.35, 0.6, 0.75))), 0.0, 1.0);

    // Holographic palette: magenta/violet at the back to electric blue in front.
    vec3 back = vec3(0.86, 0.24, 0.78);
    vec3 mid = vec3(0.48, 0.27, 0.98);
    vec3 front = vec3(0.18, 0.42, 1.0);
    vec3 base = vTone < 0.5 ? mix(back, mid, vTone * 2.0) : mix(mid, front, vTone * 2.0 - 1.0);

    vec3 col = base * (0.12 + 0.5 * diff);

    // Sulci as glowing lines (the "edges" of each gyrus).
    float shimmer = 0.78 + 0.22 * sin(uTime * 1.2 - vObj.x * 2.2 + vObj.y * 1.4);
    float major = isoLine(vF1, 1.8);
    float minor = isoLine(vF2, 1.0) * 0.55;
    float land = smoothstep(0.6, 0.97, vLand);
    float line = max(max(major, land), minor);
    // Soft glow a few pixels around each major sulcus, crisp core on top.
    float halo = (1.0 - smoothstep(1.0, 7.0, pxDist(vF1))) * 0.35;
    vec3 lineColor = mix(vec3(0.62, 0.8, 1.0), vec3(1.0), 0.35);
    col += lineColor * (line * 1.3 + halo * 0.6) * shimmer;

    // Rim glow for the holographic silhouette.
    col += mix(base, vec3(0.95, 0.8, 1.0), 0.35) * fres * 1.4;

    // Surface lights up where signals pass and neurons fire.
    vec3 heat = vec3(0.0);
    for (int i = 0; i < HOT; i++) {
      vec3 d = vObj - uHot[i].xyz;
      heat += uHotColor[i] * uHot[i].w * exp(-dot(d, d) * 38.0);
    }
    col += heat * (0.55 + line * 1.6);

    float alpha = clamp(0.62 + 0.3 * fres + 0.35 * line + length(heat) * 0.4, 0.0, 1.0);
    gl_FragColor = vec4(col * uFade, alpha * uFade);
  }
`;

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
    gl_PointSize = aSize * (1.0 + aGlow * 2.0) * uPixelRatio * (6.0 / -mv.z);
    vColor = aColor;
    vGlow = aGlow;
  }
`;
const pointFragment = /* glsl */ `
  uniform float uFade;
  varying vec3 vColor;
  varying float vGlow;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = pow(smoothstep(0.5, 0.0, d), 1.8);
    vec3 c = mix(vColor, vec3(1.0), clamp(vGlow, 0.0, 1.0) * 0.6 * a);
    gl_FragColor = vec4(c, a * (0.55 + vGlow * 1.2) * uFade);
  }
`;

const haloFragment = /* glsl */ `
  varying vec2 vUv;
  void main() {
    float d = length((vUv - 0.5) * vec2(1.0, 1.35));
    float a = smoothstep(0.5, 0.0, d);
    gl_FragColor = vec4(mix(vec3(0.35, 0.3, 0.95), vec3(0.75, 0.25, 0.8), vUv.x) * a, a * 0.32);
  }
`;
const haloVertex = /* glsl */ `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`;

/* ------------------------------------------------------------------ */
/* Scene                                                               */
/* ------------------------------------------------------------------ */
type Signal = { from: number; to: number; t: number; speed: number; color: THREE.Color; hops: number };

/** Wraps the worker's typed arrays into renderable data. */
function useBrain(data: BrainData) {
  return useMemo(() => {
    const geometries = data.meshes.map((m) => {
      const g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.BufferAttribute(m.position, 3));
      g.setAttribute("normal", new THREE.BufferAttribute(m.normal, 3));
      g.setAttribute("aF1", new THREE.BufferAttribute(m.f1, 1));
      g.setAttribute("aF2", new THREE.BufferAttribute(m.f2, 1));
      g.setAttribute("aLand", new THREE.BufferAttribute(m.land, 1));
      g.setAttribute("aTone", new THREE.BufferAttribute(m.tone, 1));
      if (m.index) g.setIndex(new THREE.BufferAttribute(m.index, 1));
      return g;
    });
    const neurons: THREE.Vector3[] = [];
    for (let i = 0; i < data.neurons.length; i += 3)
      neurons.push(new THREE.Vector3(data.neurons[i], data.neurons[i + 1], data.neurons[i + 2]));
    const edges: [number, number][] = [];
    const adjacency: number[][] = neurons.map(() => []);
    for (let i = 0; i < data.edges.length; i += 2) {
      const a = data.edges[i], b = data.edges[i + 1];
      edges.push([a, b]);
      adjacency[a].push(b);
      adjacency[b].push(a);
    }
    return { geometries, neurons, edges, adjacency };
  }, [data]);
}

function Brain({ data, animate, offsetX }: { data: BrainData; animate: boolean; offsetX: number }) {
  const group = useRef<THREE.Group>(null);
  const neuronGeo = useRef<THREE.BufferGeometry>(null);
  const signalGeo = useRef<THREE.BufferGeometry>(null);
  const { viewport, camera, size } = useThree();
  const dpr = viewport.dpr;

  const brain = useBrain(data);
  const fadeStart = useRef<number | null>(null);
  const linkMaterial = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color: "#9ec5ff",
        transparent: true,
        opacity: 0,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    []
  );

  const cortexMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: cortexVertex,
        fragmentShader: cortexFragment,
        uniforms: {
          uTime: { value: 0 },
          uFade: { value: 0 },
          uHot: { value: Array.from({ length: HOT_SPOTS }, () => new THREE.Vector4()) },
          uHotColor: { value: Array.from({ length: HOT_SPOTS }, () => new THREE.Color()) },
        },
        transparent: true,
        depthWrite: true,
      }),
    []
  );
  const pointMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: pointVertex,
        fragmentShader: pointFragment,
        uniforms: { uPixelRatio: { value: dpr }, uFade: { value: 0 } },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [dpr]
  );
  const haloMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: haloVertex,
        fragmentShader: haloFragment,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    []
  );

  const neuronData = useMemo(() => {
    const n = brain.neurons.length;
    const col = new Float32Array(n * 3);
    brain.neurons.forEach((_, i) => col.set([0.75, 0.85, 1.0], i * 3));
    return {
      pos: new Float32Array(brain.neurons.flatMap((v) => [v.x, v.y, v.z])),
      col,
      size: new Float32Array(n).fill(8),
      glow: new Float32Array(n),
    };
  }, [brain]);

  const linkPositions = useMemo(() => {
    const arr = new Float32Array(brain.edges.length * 6);
    brain.edges.forEach(([a, b], i) => {
      const A = brain.neurons[a], B = brain.neurons[b];
      arr.set([A.x, A.y, A.z, B.x, B.y, B.z], i * 6);
    });
    return arr;
  }, [brain]);

  const signalData = useMemo(() => {
    const n = SIGNAL_COUNT * TRAIL;
    const size = new Float32Array(n);
    for (let i = 0; i < SIGNAL_COUNT; i++)
      for (let k = 0; k < TRAIL; k++) size[i * TRAIL + k] = 12 * (1 - k / TRAIL) + 2;
    return { pos: new Float32Array(n * 3), col: new Float32Array(n * 3), size, glow: new Float32Array(n).fill(0.4) };
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
  const spawn = (from: number, color = pickColor()): Signal | null => {
    const to = neighbourOf(from);
    return to < 0 ? null : { from, to, t: 0, speed: 0.8 + Math.random() * 0.8, color, hops: 0 };
  };
  const fire = (node: number, count: number) => {
    neuronData.glow[node] = 1.3;
    for (let i = 0; i < count; i++) {
      const s = spawn(node);
      if (!s) continue;
      if (signals.current.length >= SIGNAL_COUNT) signals.current.shift();
      signals.current.push(s);
    }
  };

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

  useEffect(() => {
    if (!animate) return;
    const onDown = (e: PointerEvent) => {
      if (e.clientX > window.innerWidth * 0.55) return;
      const n = nearestNeuron((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1, 0.35);
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

    // Fade in over 1.2 s of wall-clock time once the worker's geometry arrives
    // (not per frame, so slow devices don't get a long fade).
    fadeStart.current ??= time;
    const fade = animate ? Math.min(1, (time - fadeStart.current) / 1.2) : 1;
    cortexMaterial.uniforms.uFade.value = fade;
    pointMaterial.uniforms.uFade.value = fade;
    linkMaterial.opacity = 0.16 * fade;

    // Fit: ~62% of the viewport height, straddling the seam with the form.
    const scale = (viewport.height * 0.62) / 2.9;
    g.scale.setScalar(scale);
    g.position.set(offsetX * viewport.width, 0.18 * scale, 0);

    // Mostly side-on (the recognisable profile) with a gentle sway and pointer tilt.
    const sway = animate ? Math.sin(time * 0.2) * 0.32 : 0;
    g.rotation.y += (0.22 + sway + state.pointer.x * 0.2 - g.rotation.y) * 0.05;
    g.rotation.x += (-state.pointer.y * 0.12 - g.rotation.x) * 0.05;

    const glow = neuronData.glow;
    if (animate) {
      for (let i = 0; i < glow.length; i++) {
        glow[i] = Math.max(glow[i] * Math.exp(-dt * 2.2), 0.05 + 0.05 * Math.sin(time * 1.4 + i * 1.9));
      }

      if (state.pointer.x < 0.1) {
        const n = nearestNeuron(state.pointer.x, state.pointer.y, 0.05);
        if (n >= 0 && (n !== lastHover.current.node || time - lastHover.current.at > 0.6)) {
          lastHover.current = { node: n, at: time };
          fire(n, 3);
        }
      }

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

    // Signal sprites.
    const tmp = new THREE.Vector3();
    for (let i = 0; i < SIGNAL_COUNT; i++) {
      const s = signals.current[i];
      for (let k = 0; k < TRAIL; k++) {
        const idx = (i * TRAIL + k) * 3;
        if (!s) {
          signalData.pos.set([0, 0, 0], idx);
          signalData.col.set([0, 0, 0], idx);
          continue;
        }
        tmp.lerpVectors(brain.neurons[s.from], brain.neurons[s.to], Math.max(0, s.t - k * 0.05));
        signalData.pos.set([tmp.x, tmp.y, tmp.z], idx);
        const f = 1 - k / TRAIL;
        signalData.col.set([s.color.r * f, s.color.g * f, s.color.b * f], idx);
      }
    }

    // Cortex hot spots: the brightest firing neurons plus a sample of signal heads.
    const uHot = cortexMaterial.uniforms.uHot.value as THREE.Vector4[];
    const uHotColor = cortexMaterial.uniforms.uHotColor.value as THREE.Color[];
    let h = 0;
    const firing = Array.from(glow.keys()).filter((i) => glow[i] > 0.45).sort((a, b) => glow[b] - glow[a]);
    for (const i of firing.slice(0, HOT_SPOTS / 2)) {
      const p = brain.neurons[i];
      uHot[h].set(p.x, p.y, p.z, Math.min(glow[i], 1.2));
      uHotColor[h].copy(FIRE_COLOR);
      h++;
    }
    for (let i = 0; i < signals.current.length && h < HOT_SPOTS; i += 2) {
      const s = signals.current[i];
      tmp.lerpVectors(brain.neurons[s.from], brain.neurons[s.to], s.t);
      uHot[h].set(tmp.x, tmp.y, tmp.z, 0.45);
      uHotColor[h].copy(s.color);
      h++;
    }
    for (; h < HOT_SPOTS; h++) uHot[h].w = 0;
    cortexMaterial.uniforms.uTime.value = animate ? time : 0;

    if (neuronGeo.current) neuronGeo.current.getAttribute("aGlow").needsUpdate = true;
    if (signalGeo.current) {
      signalGeo.current.getAttribute("position").needsUpdate = true;
      signalGeo.current.getAttribute("aColor").needsUpdate = true;
    }
  });

  return (
    <>
      <mesh position={[offsetX * viewport.width, 0, -3]} material={haloMaterial} renderOrder={-1}>
        <planeGeometry args={[viewport.height * 1.5, viewport.height * 1.1]} />
      </mesh>
      <group ref={group}>
        {brain.geometries.map((g, i) => (
          <mesh key={i} geometry={g} material={cortexMaterial} />
        ))}

        <lineSegments material={linkMaterial}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[linkPositions, 3]} />
          </bufferGeometry>
        </lineSegments>

        <points material={pointMaterial} renderOrder={2}>
          <bufferGeometry ref={neuronGeo}>
            <bufferAttribute attach="attributes-position" args={[neuronData.pos, 3]} />
            <bufferAttribute attach="attributes-aColor" args={[neuronData.col, 3]} />
            <bufferAttribute attach="attributes-aSize" args={[neuronData.size, 1]} />
            <bufferAttribute attach="attributes-aGlow" args={[neuronData.glow, 1]} />
          </bufferGeometry>
        </points>

        <points material={pointMaterial} frustumCulled={false} renderOrder={3}>
          <bufferGeometry ref={signalGeo}>
            <bufferAttribute attach="attributes-position" args={[signalData.pos, 3]} />
            <bufferAttribute attach="attributes-aColor" args={[signalData.col, 3]} />
            <bufferAttribute attach="attributes-aSize" args={[signalData.size, 1]} />
            <bufferAttribute attach="attributes-aGlow" args={[signalData.glow, 1]} />
          </bufferGeometry>
        </points>
      </group>
    </>
  );
}

export default function BrainScene({ animate = true, offsetX = -0.07 }: { animate?: boolean; offsetX?: number }) {
  const [data, setData] = useState<BrainData | null>(null);
  // Resolution adapts to the device: drops when frames are slow.
  const [dpr, setDpr] = useState(1.5);

  useEffect(() => {
    const worker = new Worker(new URL("./brain.worker.ts", import.meta.url), { type: "module" });
    worker.onmessage = (e: MessageEvent<BrainData>) => {
      setData(e.data);
      worker.terminate();
    };
    worker.postMessage(null);
    return () => worker.terminate();
  }, []);

  return (
    <Canvas
      camera={{ position: [0, 0, 7], fov: 45 }}
      dpr={dpr}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      frameloop={animate ? "always" : "demand"}
      eventSource={typeof document !== "undefined" ? document.body : undefined}
      eventPrefix="client"
    >
      <PerformanceMonitor
        onDecline={() => setDpr((d) => Math.max(0.75, d - 0.25))}
        onIncline={() => setDpr((d) => Math.min(1.5, d + 0.25))}
      />
      {data && <Brain data={data} animate={animate} offsetX={offsetX} />}
    </Canvas>
  );
}
