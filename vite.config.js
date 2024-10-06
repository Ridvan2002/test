import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/test/',  // This should be the correct base path
  plugins: [react()],
});