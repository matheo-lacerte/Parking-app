import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'


export default defineConfig({
  define: {
    'import.meta.env.VITE_APP_VERSION': JSON.stringify(process.env.npm_package_version || '0.0.0'),
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico'],
      manifest: {
        id: "/",
        name: "Parking Copro",
        short_name: "Parking",
        description: "Application de copropriété pour signaler et vérifier les voitures sur les places visiteurs.",
        start_url: ".",
        display: "standalone",
        background_color: "#ffffff",
        theme_color: "#2c3e50",
        icons: [
          {
            src: "IconParking-192.png",
            sizes: "192x192",
            type: "image/png"
          },
          {
            src: "IconParking-512.png",
            sizes: "512x512",
            type: "image/png"
          }
        ]
      }
    })
  ],
  server: {
    port: 5173,
    // Enable proxy only when explicitly targeting local API server
    // Set VITE_API_BASE_URL to e.g. "http://localhost:4000/api" to activate
    proxy: (() => {
      const base = process.env.VITE_API_BASE_URL || ''
      const isLocal4000 = /localhost:4000|127\.0\.0\.1:4000/.test(base)
      if (!isLocal4000) return undefined
      const target = base.replace(/\/api$/, '')
      return {
        '/api': {
          target,
          changeOrigin: true,
          secure: false,
        },
      }
    })(),
  },
})
