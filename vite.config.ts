import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  const { API_PROXY_TARGET } = loadEnv(mode, process.cwd(), 'API_PROXY_TARGET')

  return {
    plugins: [react(), tailwindcss()],
    server: {
      proxy: {
        '^/backend(?:/|$)': {
          target: API_PROXY_TARGET || 'http://127.0.0.1:8080',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/backend/, '') || '/',
        },
      },
    },
  }
})
