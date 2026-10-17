import { defineConfig, loadEnv, type ProxyOptions } from 'vite'
import react from '@vitejs/plugin-react'

function resolveProxyTarget(env: Record<string, string>) {
  const explicit = env.VITE_PROXY_TARGET?.trim()
  if (explicit) return explicit.replace(/\/$/, '')
  const api = env.VITE_API_URL?.trim() || ''
  if (/^https?:\/\//i.test(api)) {
    try {
      return new URL(api).origin
    } catch {
      /* ignore invalid URL */
    }
  }
  return 'http://127.0.0.1:4000'
}

function jsonProxyError(): NonNullable<ProxyOptions['configure']> {
  return (proxy) => {
    proxy.on('error', (err, _req, res) => {
      const error = err as Error & { code?: string }
      console.error('[vite proxy]', error.code || error.message)
      if (res && 'writeHead' in res && !res.headersSent) {
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
  }
}

function createProxy(proxyTarget: string): Record<string, ProxyOptions> {
  const common: ProxyOptions = {
    target: proxyTarget,
    changeOrigin: true,
    secure: proxyTarget.startsWith('https://'),
  }

  return {
    '/api': {
      ...common,
      timeout: 30000,
      proxyTimeout: 30000,
      configure: jsonProxyError(),
    },
    '/health': common,
    '/uploads': common,
    '/socket.io': { ...common, ws: true },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const proxyTarget = resolveProxyTarget(env)
  const proxy = createProxy(proxyTarget)
  console.log(`[vite] proxy /api → ${proxyTarget}`)

  return {
    plugins: [react()],
    server: {
      port: Number(process.env.PORT) || 5173,
      proxy,
    },
    preview: {
      port: Number(process.env.PORT) || 4173,
      proxy,
    },
  }
})
