# BibleVerse

Immersive biblically-inspired WebXR experiences for [bibleverse.eth](https://bibleverse.eth.limo).

## Phase 1 — Walking Beside Jesus on a Beach

A quiet golden-hour shoreline walk. Jesus walks beside you at your pace; scripture moments appear at waypoints along the shore.

Built with Vite, React, TypeScript, React Three Fiber, `@react-three/xr`, and `@react-three/rapier`. Runs in desktop/mobile browsers today and supports WebXR VR (Quest browsers) via Enter VR.

## Develop

```bash
pnpm install
pnpm dev
```

Open the local URL. On a phone, use your machine’s LAN address from `pnpm dev --host`.

- **Desktop:** click the canvas to look, WASD to walk
- **Mobile:** on-screen joystick
- **VR:** Enter VR (WebXR-capable browser / headset)

## Build

```bash
pnpm build
pnpm preview
```

`vite.config.ts` uses `base: './'` so the static build works on IPFS gateways.

## Deploy to IPFS + ENS

GitHub Actions (`.github/workflows/deploy-ipfs.yml`) builds on push to `main` and pins `dist/` to [Pinata](https://pinata.cloud).

1. Add repository secret `PINATA_JWT` (Pinata API JWT with pin permission).
2. Push to `main` (or run the workflow manually).
3. Copy the CID from the Actions summary.
4. Set the contenthash for `vr.bibleverse.eth` (or your chosen name) at [app.ens.domains](https://app.ens.domains) to `ipfs://<CID>`.

## Visual fidelity stack

- **Landing:** cinematic AI hero still
- **World:** photographic beach plate + shore-cropped sand + Spark Gaussian splat grain overlay (`@sparkjsdev/spark`)
- **Characters:** photoreal greenscreen plates with chroma-key billboards

### Optional: Meshy rigged GLBs

When you have a [Meshy](https://www.meshy.ai) API key:

```bash
MESHY_API_KEY=... pnpm generate:characters
```

This writes `public/models/jesus.glb` (+ disciples). Drop those into the experience when you’re ready to swap plates for true 3D meshes.

## Project notes

Creative direction, storyboard, platform decisions, and asset licenses live in the Obsidian vault at `~/obsidian-vault/projects/BibleVerse/`.
