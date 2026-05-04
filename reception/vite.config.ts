import path from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    fs: {
      // Vite restringe imports fuera del root por seguridad. Permitimos el monorepo
      // y el workspace ui-web para que `import '@utec-gym/ui-web/src/index.css'` funcione.
      allow: [
        path.resolve(__dirname, '..'),
        path.resolve(__dirname, '../packages/ui-web'),
      ],
    },
  },
});
