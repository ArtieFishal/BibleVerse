import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { jesusApiPlugin } from './server/jesusApi.ts'

// Relative base so the build works on IPFS gateways and ENS contenthash.
export default defineConfig({
  plugins: [react(), jesusApiPlugin()],
  base: './',
})
