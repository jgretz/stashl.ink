// vite.config.ts
import {defineConfig} from 'vite';
import tsConfigPaths from 'vite-tsconfig-paths';
import {tanstackStart} from '@tanstack/react-start/plugin/vite';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  server: {
    port: 3000,
    host: process.env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost',
  },
  plugins: [
    tsConfigPaths(),
    tanstackStart({target: 'bun', customViteReactPlugin: true}),
    tailwindcss(),
    react(),
  ],
});
