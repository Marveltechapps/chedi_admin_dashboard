import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const proxyTarget = process.env.VITE_PROXY_TARGET || 'http://127.0.0.1:4000'

const proxy = {
  '/api': {
    target: proxyTarget,
    changeOrigin: true,
    timeout: 30000,
    proxyTimeout: 30000,
    configure(proxyServer) {
      proxyServer.on('error', (err, _req, res) => {
        console.error('[vite proxy]', err.code || err.message)
        if (res && !res.headersSent && typeof res.writeHead === 'function') {
          res.writeHead(502, { 'Content-Type': 'application/json' })
          res.end(
            JSON.stringify({
              success: false,
              message: 'API unavailable. Please try again.',
              error: {
                code: 'BAD_GATEWAY',
                message: 'API unavailable. Please try again.',
                details: [],
              },
            })
          )
        }
      })
    },
  },
  '/health': { target: proxyTarget, changeOrigin: true },
  '/socket.io': { target: proxyTarget, changeOrigin: true, ws: true },
}

export default defineConfig({
  plugins: [react()],
  server: {
    port: Number(process.env.PORT) || 5173,
    proxy,
  },
  preview: {
    port: Number(process.env.PORT) || 4173,
    proxy,
  },
})
