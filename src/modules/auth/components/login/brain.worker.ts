// Builds the login brain geometry off the main thread (see brainGeometry.ts).
import { buildBrainData } from "./brainGeometry";

self.onmessage = () => {
  const data = buildBrainData();
  const transfer: Transferable[] = [data.neurons.buffer, data.edges.buffer];
  for (const m of data.meshes) {
    transfer.push(m.position.buffer, m.normal.buffer, m.f1.buffer, m.f2.buffer, m.land.buffer, m.tone.buffer);
    if (m.index) transfer.push(m.index.buffer);
  }
  (self as unknown as Worker).postMessage(data, transfer);
};
