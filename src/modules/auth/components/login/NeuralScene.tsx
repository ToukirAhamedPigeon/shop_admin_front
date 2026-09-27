// Three.js "neural network" for the login brand panel: nodes on a sphere,
// linked to their nearest neighbours, with light pulses travelling along the
// links. The whole graph drifts slowly and tilts toward the pointer.
// Loaded lazily (see BrandPanel) so three.js never reaches the main bundle.
import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

const NODE_COUNT = 150;
const LINKS_PER_NODE = 3;
const PULSE_COUNT = 28;
const DUST_COUNT = 450;
const RADIUS = 2.3;

const COLORS = {
  node: new THREE.Color("#a5b4fc"),
  link: new THREE.Color("#6366f1"),
  pulse: new THREE.Color("#e0e7ff"),
  dust: new THREE.Color("#818cf8"),
};

// Deterministic PRNG so the graph looks the same on every visit.
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function buildGraph() {
  const rand = mulberry32(7);
  const nodes: THREE.Vector3[] = [];
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < NODE_COUNT; i++) {
    const y = 1 - (i / (NODE_COUNT - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const theta = golden * i;
    const jitter = 1 + (rand() - 0.5) * 0.22;
    nodes.push(new THREE.Vector3(Math.cos(theta) * r, y, Math.sin(theta) * r).multiplyScalar(RADIUS * jitter));
  }

  const edgeSet = new Set<string>();
  const edges: [number, number][] = [];
  nodes.forEach((a, i) => {
    nodes
      .map((b, j) => ({ j, d: a.distanceToSquared(b) }))
      .filter(({ j }) => j !== i)
      .sort((p, q) => p.d - q.d)
      .slice(0, LINKS_PER_NODE)
      .forEach(({ j }) => {
        const key = i < j ? `${i}-${j}` : `${j}-${i}`;
        if (!edgeSet.has(key)) {
          edgeSet.add(key);
          edges.push([i, j]);
        }
      });
  });

  const dust = new Float32Array(DUST_COUNT * 3);
  for (let i = 0; i < DUST_COUNT; i++) {
    const v = new THREE.Vector3(rand() - 0.5, rand() - 0.5, rand() - 0.5)
      .normalize()
      .multiplyScalar(3.4 + rand() * 3);
    dust.set([v.x, v.y, v.z], i * 3);
  }

  return { nodes, edges, dust, rand };
}

function Network({ animate }: { animate: boolean }) {
  const group = useRef<THREE.Group>(null);
  const dustRef = useRef<THREE.Points>(null);
  const pulseGeo = useRef<THREE.BufferGeometry>(null);

  const { nodePositions, linkPositions, dust, edges, nodes, pulses } = useMemo(() => {
    const { nodes, edges, dust, rand } = buildGraph();
    const nodePositions = new Float32Array(nodes.flatMap((v) => [v.x, v.y, v.z]));
    const linkPositions = new Float32Array(
      edges.flatMap(([a, b]) => [nodes[a].x, nodes[a].y, nodes[a].z, nodes[b].x, nodes[b].y, nodes[b].z])
    );
    const pulses = Array.from({ length: PULSE_COUNT }, () => ({
      edge: Math.floor(rand() * edges.length),
      t: rand(),
      speed: 0.25 + rand() * 0.45,
    }));
    return { nodePositions, linkPositions, dust, edges, nodes, pulses };
  }, []);

  const pulsePositions = useMemo(() => new Float32Array(PULSE_COUNT * 3), []);

  useFrame((state, delta) => {
    const g = group.current;
    if (!g) return;
    const dt = Math.min(delta, 0.05);

    if (animate) {
      g.rotation.y += dt * 0.07;
      if (dustRef.current) dustRef.current.rotation.y -= dt * 0.02;
    }

    // Ease the tilt toward the pointer (state.pointer is -1..1).
    const targetX = state.pointer.y * 0.25;
    const targetZ = -state.pointer.x * 0.12;
    g.rotation.x += (targetX - g.rotation.x) * 0.04;
    g.rotation.z += (targetZ - g.rotation.z) * 0.04;

    // Advance pulses along their edges, hopping to a random linked edge at the end.
    const tmp = new THREE.Vector3();
    pulses.forEach((p, i) => {
      if (animate) {
        p.t += dt * p.speed;
        if (p.t >= 1) {
          p.t = 0;
          p.edge = Math.floor(Math.random() * edges.length);
        }
      }
      const [a, b] = edges[p.edge];
      tmp.lerpVectors(nodes[a], nodes[b], p.t);
      pulsePositions.set([tmp.x, tmp.y, tmp.z], i * 3);
    });
    const attr = pulseGeo.current?.getAttribute("position");
    if (attr) attr.needsUpdate = true;
  });

  return (
    <>
      <group ref={group}>
        <lineSegments>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[linkPositions, 3]} />
          </bufferGeometry>
          <lineBasicMaterial color={COLORS.link} transparent opacity={0.28} depthWrite={false} />
        </lineSegments>

        <points>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[nodePositions, 3]} />
          </bufferGeometry>
          <pointsMaterial
            color={COLORS.node}
            size={0.07}
            sizeAttenuation
            transparent
            opacity={0.95}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </points>

        <points>
          <bufferGeometry ref={pulseGeo}>
            <bufferAttribute attach="attributes-position" args={[pulsePositions, 3]} />
          </bufferGeometry>
          <pointsMaterial
            color={COLORS.pulse}
            size={0.13}
            sizeAttenuation
            transparent
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </points>
      </group>

      <points ref={dustRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[dust, 3]} />
        </bufferGeometry>
        <pointsMaterial color={COLORS.dust} size={0.025} sizeAttenuation transparent opacity={0.5} depthWrite={false} />
      </points>
    </>
  );
}

export default function NeuralScene({ animate = true }: { animate?: boolean }) {
  return (
    <Canvas
      camera={{ position: [0, 0, 7], fov: 45 }}
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: true, powerPreference: "low-power" }}
      frameloop={animate ? "always" : "demand"}
      eventSource={typeof document !== "undefined" ? document.body : undefined}
      eventPrefix="client"
    >
      <Network animate={animate} />
    </Canvas>
  );
}
