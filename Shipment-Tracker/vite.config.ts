import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import { getBaseViteConfig } from '../Shared-Utils/src/vite.config.shared';
import { mergeConfig } from 'vite';

const baseConfig = getBaseViteConfig(__dirname);

export default defineConfig(mergeConfig(baseConfig, {
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      manifest: {
        name: 'Shipment Tracker',
        short_name: 'ShipTracker',
        description: 'Track your shipments in real-time',
        theme_color: '#ffffff',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ]
}));
