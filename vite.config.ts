import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// WebContainers require the browser tab to be "cross-origin isolated".
// Without these two headers, WebContainer.boot() will reject/hang.
export default defineConfig({
  plugins: [react()],
  server: {
    headers: {
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin',
    },
  },
  preview: {
    headers: {
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin',
    },
  },
  optimizeDeps: {
    exclude: ['@webcontainer/api'],
  },
});
