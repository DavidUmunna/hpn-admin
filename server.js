import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createProxyMiddleware } from 'http-proxy-middleware';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// 🔁 PROXY API → backend service
app.use(
  '/api',
  createProxyMiddleware({
    target: 'https://hpnmobilebackend-production.up.railway.app',
    changeOrigin: true,
    secure: true,
  })
);

// 📦 Serve Vite build
app.use(express.static(path.join(__dirname, 'dist')));

app.get('*', (_, res) => {
  res.sendFile(path.join(__dirname, 'dist/index.html'));
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Frontend running on port ${port}`);
});
