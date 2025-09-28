import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export function errorHandler(
  error: AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  logger.error('Error occurred:', {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
  });

  const statusCode = error.statusCode || 500;
  const isOperational = error.isOperational || false;

  const errorResponse: any = {
    success: false,
    message: error.message || 'Internal Server Error',
    timeStamp: new Date().toISOString(),
    path: req.url,
    method: req.method,
  };

  if (process.env.NODE_ENV === 'development') {
    errorResponse.stack = error.stack;
    errorResponse.error = error;
  }

  if (process.env.NODE_ENV === 'production') {
    if (isOperational) {
      errorResponse.message = error.message;
    } else {
      errorResponse.message = 'Something went wrong';
    }
  }

  res.status(statusCode).json(errorResponse);
}

export function asyncHandler(fn: Function) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

export function createError(
  message: string,
  statusCode: number = 500
): AppError {
  const error: AppError = new Error(message);
  error.statusCode = statusCode;
  error.isOperational = true;
  return error;
}

export function handleDatabaseError(error: any): AppError {
  if (error.code === '23505') {
    return createError('Resource already exists', 409);
  }
  if (error.code === '23503') {
    return createError('Resource does not exists', 400);
  }
  if (error.code === '23514') {
    return createError('Invalid data provided', 400);
  }
  if (error.code === '23502') {
    return createError('Required field is missing', 400);
  }
  if (error.code === 'ECONNREFUSED') {
    return createError('Database connection failed', 400);
  }

  return createError('Database operation failed', 500);
}

export function handleValidationError(errors: string[]): AppError {
  const error = createError('Validation failed', 400);
  error.message = errors.join(', ');
  return error;
}

export function notFoundHandler(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const error = createError(`Route ${req.originalUrl} not found`, 404);
  next(error);
}
