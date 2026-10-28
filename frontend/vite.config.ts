import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { resolveApiBaseUrl } from './src/api/config.ts'

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => {
  if (command === 'build' && mode === 'production') {
    // Fail the build (e.g. on Vercel) rather than ship a bundle with a missing or
    // unreachable API URL baked in. Reads .env files and the process environment.
    const env = loadEnv(mode, process.cwd(), 'VITE_')
    resolveApiBaseUrl(env.VITE_API_URL, { production: true })
  }

  return {
    plugins: [react()],
    server: {
      port: 3000,
      proxy: {
        '/api': {
          target: 'http://localhost:8080',
          changeOrigin: true,
        },
      },
    },
  }
})
