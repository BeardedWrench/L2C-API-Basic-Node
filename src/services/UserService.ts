import { DatabaseConnection } from '../config/database';
import {
  CreateUserRequest,
  PaginatedUsersResponse,
  sanitizeUserData,
  User,
  USER_VALIDATION,
  UserQueryParams,
  UserResponse,
  userToResponse,
  validateUserData,
} from '../models/User';
import { logger } from '../utils/logger';

export class UserService {
  private db = DatabaseConnection.getInstance();

  async createUser(userData: CreateUserRequest): Promise<UserResponse> {
    logger.info('Creating new user: ', { email: userData.email });

    const sanitizedData = sanitizeUserData(userData) as CreateUserRequest;

    const validationErrors = validateUserData(sanitizeUserData);

    if (validationErrors.length > 0) {
      throw new Error(`Validation failed: ${validationErrors.join(', ')}`);
    }

    const existingUser = await this.findUserByEmail(sanitizedData.email);
    if (existingUser) {
      throw new Error(`User with this email already exists`);
    }

    try {
      const query = `
        INSERT INTO users (name, email, age, created_at, updated_at)
        VALUES ($1, $2, $3, NOW(), NOW())
        RETURNING *
        `;

      const values = [
        sanitizedData.name,
        sanitizedData.email,
        sanitizedData.age || null,
      ];

      const result = await this.db.query(query, values);
      const newUser = result.rows[0] as User;

      logger.info('User created successfully:', {
        userId: newUser.id,
        email: newUser.email,
      });

      return userToResponse(newUser);
    } catch (error) {
      logger.error(`Error creating user: ${error}`);
      throw new Error('Failed to create user');
    }
  }

  async getUsers(
    queryParams: UserQueryParams = {}
  ): Promise<PaginatedUsersResponse> {
    logger.info('Fetching users with params: ', queryParams);

    const page = Math.max(1, queryParams.page || USER_VALIDATION.DEFAULT_LIMIT);
    const limit = Math.min(
      USER_VALIDATION.MAX_LIMIT,
      Math.max(1, queryParams.limit || USER_VALIDATION.DEFAULT_LIMIT)
    );
    const offset = (page - 1) * limit;

    const whereConditions: string[] = [];
    const queryValues: any[] = [];
    let paramIndex = 1;

    if (queryParams.name) {
      whereConditions.push(`name ILIKE $${paramIndex}`);
      queryValues.push(`%${queryParams.name}%`);
      paramIndex++;
    }

    if (queryParams.email) {
      whereConditions.push(`email ILIKE $${paramIndex}`);
      queryValues.push(`%${queryParams.email}%`);
      paramIndex++;
    }

    if (queryParams.minAge !== undefined) {
      whereConditions.push(`age >= $${paramIndex}`);
      queryValues.push(`%${queryParams.minAge}%`);
      paramIndex++;
    }

    if (queryParams.maxAge !== undefined) {
      whereConditions.push(`age <= $${paramIndex}`);
      queryValues.push(`%${queryParams.maxAge}%`);
      paramIndex++;
    }

    const whereClause =
      whereConditions.length > 0
        ? `WHERE ${whereConditions.join(' AND ')}`
        : '';

    const sortBy = queryParams.sortBy || 'created_at';
    const sortOrder = queryParams.sortOrder || 'DESC';
    const orderByClause = `ORDER BY ${sortBy} ${sortOrder}`;

    try {
      const countQuery = `SELECT COUNT(*) FROM users ${whereClause}`;
      const countResult = await this.db.query(countQuery, queryValues);
      const total = parseInt(countResult.rows[0].count);

      const usersQuery = `
        SELECT * FROM users
        ${whereClause}
        ${orderByClause}
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
        `;

      const usersValues = [...queryValues, limit, offset];
      const usersResult = await this.db.query(usersQuery, usersValues);

      const users = usersResult.rows as User[];

      const totalPages = Math.ceil(total / limit);
      const hasNext = page < totalPages;
      const hasPrev = page > 1;

      logger.info(
        `Retrieved ${users.length} users (page ${page}/${totalPages})`
      );

      return {
        users: users.map(userToResponse),
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext,
          hasPrev,
        },
      };
    } catch (error) {
      logger.error(`Error fetching users: ${error}`);
      throw new Error('Failed to fetch users');
    }
  }
}
