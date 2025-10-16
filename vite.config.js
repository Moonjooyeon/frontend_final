import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
    plugins: [react()],
    esbuild: {
        loader: 'jsx',
        include: /src\/.*\.js$/, // src 이하의 .js를 JSX로 처리
    },

    // 👇 여기가 핵심: 백엔드(Spring Boot)로 프록시 설정
    server: {
        proxy: {
            '/api': { target: 'http://localhost:8080', changeOrigin: true },

        },
        port: 5173,
    },
})
