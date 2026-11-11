import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  // EdgePanel's http profile (EdgePanel.API launchSettings.json). EdgePanel serves its routes from the root
  // (POST /sign-in), so the portal's /api prefix is stripped on the way through.
  server: { proxy: { '/api': { target: 'http://localhost:8080', rewrite: (path) => path.replace(/^\/api/, '') } } },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'BoxMesh',
        short_name: 'BoxMesh',
        description: 'Manage and reach BoxAgent devices through EdgePanel.',
        start_url: '/dashboard',
        scope: '/',
        display: 'standalone',
        // The splash draws the icon over this colour; matching the icon's tile keeps it from showing as a box.
        background_color: '#101416',
        theme_color: '#101416',
        // "any" icons are rounded with transparent corners (desktop installs show them as they are); the maskable one
        // is full-bleed, because Android cuts it to the launcher's own shape and baked-in corners would show gaps.
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // EdgePanel routes on the same origin must reach the server, not the SPA shell.
        navigateFallbackDenylist: [/^\/api\//, /^\/ws\//, /^\/web\//],
      },
    }),
  ],
})
