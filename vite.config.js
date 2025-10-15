import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  esbuild: {
  loader: 'jsx',
      include: /src\/.*\.js$/,     // src 이하의 .js를 JSX로 처리
},
})
