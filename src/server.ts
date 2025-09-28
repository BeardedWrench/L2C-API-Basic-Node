import express from 'express';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import { timeStamp } from 'console';
import { userRoutes } from './routes/userRoutes';
import { errorHandler } from './middleware/errorHandler';
import { DatabaseConnection } from './config/database';
import { logger } from './utils/logger';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const limiter = rateLimit({
  windowMs: parseInt(process.env.API_RATE_LIMIT_WINDOW_MS || '900000'),
  max: parseInt(process.env.API_RATE_LIMIT_MAX_REQUESTS || '100'),
  message: {
    error: 'Too many requests from this IP, please try again later',
    retryAfter: '15 minutes',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

app.use('/api/v1/users', userRoutes);

app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: `The requests route ${req.originalUrl} does not exist`,
    availableRoutes: [
      'GET /health',
      'GET /api/v1/users',
      'POST /api/v1/users',
      'GET /api/v1/users/:id',
      'PUT /api/v1/users/:id',
      'DELETE /api/v1/users/:id',
    ],
  });
});

app.use(errorHandler);

async function startServer() {
  try {
    await DatabaseConnection.initialize();
    logger.info('Data connection established successfully');

    app.listen(PORT, () => {
      logger.info(`🚀Server is running on port ${PORT}`);
      logger.info(`📊Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`⛑️Health Check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    logger.error('Failed to start server: ', error);
    process.exit(1);
  }
}

process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  await DatabaseConnection.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  await DatabaseConnection.close();
  process.exit(0);
});

startServer();
