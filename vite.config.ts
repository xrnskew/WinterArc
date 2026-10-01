/// <reference types="vitest/config" />
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    include: ['src/**/*.test.ts'],
    // Часовой пояс с переходом на зимнее время (25 октября 2026):
    // так тесты дат ловят ошибки «23-часовых» суток.
    env: { TZ: 'Europe/Berlin' },
  },
});
