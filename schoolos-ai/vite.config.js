import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { host: '127.0.0.1', port: 4173 },
  // Bound to localhost only: Tailscale (serve/funnel) proxies to it. The leading dot also
  // allows *.ts.net names, which Vite would otherwise reject with HTTP 403.
  preview: { host: '127.0.0.1', port: 4173, allowedHosts: ['.ts.net', 'localhost', '127.0.0.1'] },
});
