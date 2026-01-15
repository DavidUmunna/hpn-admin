import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createProxyMiddleware } from 'http-proxy-middleware';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Proxy API calls to backend
app.use(
  '/api',
  createProxyMiddleware({
    target: 'https://hpnmobilebackend-production.up.railway.app',
    changeOrigin: true,
    secure: true,
  })
);

// Serve Vite build output
app.use(express.static(path.join(__dirname, 'dist')));

// Catch-all: return the SPA index.html (NO app.get('*'))
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Frontend running on port ${port}`);
});
