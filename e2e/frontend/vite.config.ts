import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Relative Clerk proxy path → forwarded to the local emulator over http.
      // Clerk's SDK forces https on ABSOLUTE proxy URLs, so we use a relative
      // path (the supported production-proxy pattern) and let Vite forward it.
      '/__clerk': {
        target: 'http://localhost:4900',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/__clerk/, ''),
      },
    },
  },
})
