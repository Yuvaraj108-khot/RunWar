import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import path from 'path';
import { env } from './config/env.js';
import authRoutes from './routes/authRoutes.js';
import sessionRoutes from './routes/sessionRoutes.js';
import territoryRoutes from './routes/territoryRoutes.js';
import leaderboardRoutes from './routes/leaderboardRoutes.js';

export function createApp() {
  const app = express();

  app.use(cors({ origin: env.CORS_ORIGIN }));
  app.use(express.json());
  app.use(morgan('dev'));

  // Prevent caching of HTML and JSON
  app.use((req, res, next) => {
    if (req.path.endsWith('.html') || req.path === '/' || req.accepts('application/json')) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    }
    next();
  });

  app.get('/health', (_req, res) => res.json({ status: 'ok' }));

  app.get('/test', (_req, res) => res.json({ status: 'backend is working' }));

  app.use('/auth', authRoutes);
  app.use('/sessions', sessionRoutes);
  app.use('/territories', territoryRoutes);
  app.use('/leaderboards', leaderboardRoutes);

  // Serve frontend static files from project /frontend
  const frontendDir = path.resolve(process.cwd(), 'frontend');
  app.use(express.static(frontendDir));

  // SPA fallback — serve index.html for HTML-accepting requests
  app.get('*', (req, res) => {
    if (req.accepts('html')) {
      return res.sendFile(path.join(frontendDir, 'index.html'));
    }
    return res.status(404).json({ message: 'Not found' });
  });

  app.use((err, _req, res, _next) => {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  });

  return app;
}
