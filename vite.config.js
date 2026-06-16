import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // 외부 접속(터널링) 허용
    port: 5173,
    strictPort: true,
    hmr: {
      clientPort: 5173 // Live Share 터널을 통과할 수 있도록 HMR 포트 강제 고정
    }
  }
})