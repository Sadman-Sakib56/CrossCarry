import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// '/api' দিয়ে শুরু হওয়া request গুলো Express backend (5000) এ চলে যায়।
// host: true মানে একই WiFi তে ফোন থেকেও খোলা যাবে (যেমন http://192.168.x.x:5173)
// আগে frontend এ localhost:5000 hard-coded ছিল, তাই ফোনে API কাজ করত না; এখন relative '/api' ব্যবহার হয়
const proxy = {
  '/api': { target: 'http://localhost:5000', changeOrigin: true },
}

export default defineConfig({
  plugins: [react()],
  server: { port: 5173, host: true, proxy },
  preview: { host: true, proxy },
})
