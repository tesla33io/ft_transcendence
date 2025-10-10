import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createProxyMiddleware } from 'http-proxy-middleware';

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());
app.use(cors());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    services: {
      gateway: 'running',
      auth: 'checking...',
      user: 'checking...',
      game: 'checking...',
      tournament: 'checking...'
    }
  });
});

// API Gateway routes
app.use('/api/v1/auth', createProxyMiddleware({
  target: 'http://auth-service:3001',
  changeOrigin: true,
  pathRewrite: {
    '^/api/v1/auth': '/api/v1/auth'
  }
}));

app.use('/api/v1/users', createProxyMiddleware({
  target: 'http://user-service:3002',
  changeOrigin: true,
  pathRewrite: {
    '^/api/v1/users': '/api/v1/users'
  }
}));

app.use('/api/v1/games', createProxyMiddleware({
  target: 'http://game-service:3003',
  changeOrigin: true,
  pathRewrite: {
    '^/api/v1/games': '/api/v1/games'
  }
}));

app.use('/api/v1/tournaments', createProxyMiddleware({
  target: 'http://tournament-service:3004',
  changeOrigin: true,
  pathRewrite: {
    '^/api/v1/tournaments': '/api/v1/tournaments'
  }
}));

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'ft_transcendence API Gateway',
    version: '1.0.0',
    endpoints: {
      auth: '/api/v1/auth',
      users: '/api/v1/users',
      games: '/api/v1/games',
      tournaments: '/api/v1/tournaments'
    }
  });
});

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Gateway Error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Not found',
    message: `Route ${req.originalUrl} not found`
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Gateway service running on port ${PORT}`);
  console.log(`📡 Proxying requests to microservices`);
});
