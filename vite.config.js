import { VitePWA } from 'vite-plugin-pwa'
import pkg from './package.json' with { type: 'json' };

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import pkg from './package.json' with { type: 'json' };


export default defineConfig({
  define: {
    'import.meta.env.VITE_APP_VERSION': JSON.stringify(pkg.version),
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
  ]
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
