import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Configuracion de Vite para ArcadeVS (frontend React con estetica CRT).
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
  test: {
    environment: 'jsdom',
    globals: true,
  },
});
