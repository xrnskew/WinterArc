/// <reference types="vitest/config" />
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // PWA: приложение ставится на главный экран и работает без интернета.
    // Данные живут в localStorage и обновлением приложения не затрагиваются.
    VitePWA({
      // Новая версия скачивается в фоне и включается при следующем открытии,
      // поэтому посреди отметки привычки страница не перезагрузится.
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['favicon.svg', 'icons/apple-touch-icon.png'],
      manifest: {
        name: 'Winter Arc',
        short_name: 'Winter Arc',
        description: 'Трекер дисциплины для зимней арки: привычки, цели, отсчёт дней.',
        lang: 'ru',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#0a0a0a',
        theme_color: '#0a0a0a',
        icons: [
          { src: '/icons/pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/pwa-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: '/icons/maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // Всё приложение — в кэше сразу, включая шрифты и графики: без сети работают все экраны.
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        navigateFallback: '/index.html',
      },
    }),
  ],
  test: {
    include: ['src/**/*.test.ts'],
    // Часовой пояс с переходом на зимнее время (25 октября 2026):
    // так тесты дат ловят ошибки «23-часовых» суток.
    env: { TZ: 'Europe/Berlin' },
  },
});
