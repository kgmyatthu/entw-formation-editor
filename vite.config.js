import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/entw-formation-editor/',
  server: { port: 3000 },
});
