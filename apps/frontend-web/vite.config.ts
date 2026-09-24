import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@salary-mgmt/shared-types': path.resolve(__dirname, '../../libs/shared-types/src/index.ts'),
      '@salary-mgmt/shared-auth': path.resolve(__dirname, '../../libs/shared-auth/src/index.ts'),
    },
  },
  server: {
    port: 3000,
    host: 'localhost',
    proxy: {
      '/api': {
        target: 'http://localhost:3333',
        changeOrigin: true,
      }
    }
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    server: {
      deps: {
        inline: ['@mui/icons-material', '@mui/material']
      }
    }
  },
});
