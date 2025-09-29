import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icon-192.png', 'icon-512.png'],
      manifest: {
        name: "Parking Copro",
        short_name: "Parking",
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
})
