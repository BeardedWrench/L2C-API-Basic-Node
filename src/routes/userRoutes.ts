import { Request, Response, Router } from 'express';
import { UserService } from '../services/UserService';
import { logger } from '../utils/logger';
import {
  CreateUserRequest,
  UpdateUserRequest,
  UserQueryParams,
} from '../models/User';

const router = Router();
const userService = new UserService();

router.get('/', async (req: Request, res: Response) => {
  try {
    logger.info('GET /users request received', { query: req.query });

    const queryParams: UserQueryParams = {
      page: req.query.page ? parseInt(req.query.page as string) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      name: req.query.name as string,
      email: req.query.email as string,
      minAge: req.query.minAge
        ? parseInt(req.query.minAge as string)
        : undefined,
      maxAge: req.query.maxAge
        ? parseInt(req.query.maxAge as string)
        : undefined,
      sortBy: req.query.sortBy as any,
      sortOrder: req.query.sortOrder as 'ASC' | 'DESC',
    };

    const result = await userService.getUsers(queryParams);

    res.status(200).json({
      success: true,
      message: 'Users retrieved successfully',
      data: result,
    });
  } catch (error) {
    logger.error('Error in GET /users:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    logger.info('POST /users request received', { body: req.body });

    const userData: CreateUserRequest = req.body;

    if (!userData.name || !userData.email) {
      return res.status(400).json({
        success: false,
        message: 'Name and email are required',
        errors: ['name', 'email'].filter(
          (field) => !userData[field as keyof CreateUserRequest]
        ),
      });
    }

    const newUser = await userService.createUser(userData);

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: newUser,
    });
  } catch (error) {
    logger.error('Error in POST /users:', error);

    if (error instanceof Error && error.message.includes('Validation failed')) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        error: error.message,
      });
    }

    if (error instanceof Error && error.message.includes('already exists')) {
      return res.status(409).json({
        success: false,
        message: 'User with this email already exists',
        error: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.id);
    logger.info('GET /users/:id request received', { userId });

    if (isNaN(userId) || userId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID. Must be a positive integer.',
        error: 'INVALID_USER_ID',
      });
    }

    const user = await userService.getUserById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        error: 'USER_NOT_FOUND',
      });
    }

    res.status(200).json({
      success: true,
      message: 'User retrieved successfully',
      data: user,
    });
  } catch (error) {
    logger.error('Error in GET /users/:id:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.id);
    logger.info('PUT /users/:id request received', { userId, body: req.body });

    if (isNaN(userId) || userId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID. Must be a positive integer.',
        error: 'INVALID_USER_ID',
      });
    }

    const updateData: UpdateUserRequest = req.body;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one field must be provided for update',
        error: 'NO_UPDATE_FIELDS',
      });
    }

    const updatedUser = await userService.updateUser(userId, updateData);

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        error: 'USER_NOT_FOUND',
      });
    }

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: updatedUser,
    });
  } catch (error) {
    logger.error('Error in PUT /users/:id:', error);

    if (error instanceof Error && error.message.includes('Validation failed')) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        error: error.message,
      });
    }

    if (error instanceof Error && error.message.includes('already exists')) {
      return res.status(409).json({
        success: false,
        message: 'User with this email already exists',
        error: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.id);
    logger.info('DELETE /users/:id request received', { userId });

    if (isNaN(userId) || userId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID. Must be a positive integer.',
        error: 'INVALID_USER_ID',
      });
    }

    const deleted = await userService.deleteUser(userId);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        error: 'USER_NOT_FOUND',
      });
    }

    res.status(200).json({
      success: true,
      message: 'User deleted successfully',
      data: { id: userId },
    });
  } catch (error) {
    logger.error('Error in DELETE /users/:id:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export { router as userRoutes };
