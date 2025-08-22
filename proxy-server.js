const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = 3001;

// Enable CORS for all routes
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true
}));

// Proxy middleware for Pollinations AI
const pollinationsProxy = createProxyMiddleware({
  target: 'https://pollinations.ai',
  changeOrigin: true,
  pathRewrite: {
    '^/api/pollinations': '', // Remove /api/pollinations prefix
  },
  onProxyReq: (proxyReq, req, res) => {
    console.log(`Proxying request to: https://pollinations.ai${req.url}`);
  },
  onError: (err, req, res) => {
    console.error('Proxy error:', err);
    res.status(500).json({ error: 'Proxy error' });
  }
});

// Use the proxy for /api/pollinations routes
app.use('/api/pollinations', pollinationsProxy);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🚀 CORS Proxy server running on http://localhost:${PORT}`);
  console.log(`📡 Proxying Pollinations AI requests`);
  console.log(`🔍 Health check: http://localhost:${PORT}/health`);
});
