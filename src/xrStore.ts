import { createXRStore } from '@react-three/xr'

export const xrStore = createXRStore({
  // Prefer the WebXR emulator browser extension over the built-in room packs
  // so production bundles stay lean for IPFS / mobile.
  emulate: false,
  offerSession: false,
})
