import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  esbuild: {
    loader: 'jsx',
    include: /src\/.*\.(js|jsx)$/,
  },
  server: {
    host: '127.0.0.1',          // ← IPv6(::1) 꼬임 방지
    port: 5173,
    proxy: {
      '/api': {
        target: 'https://breezeless-muskier-hong.ngrok-free.dev', // ← ngrok HTTPS
        changeOrigin: true,
        secure: true,                                             // ngrok은 공인 인증서: true 권장
        headers: { 'ngrok-skip-browser-warning': 'true' },        // 배너 우회
        // 타임아웃 여유 (대기 중 끊김 방지)
        timeout: 30_000,
        proxyTimeout: 30_000,
      },
    },
  },
})
