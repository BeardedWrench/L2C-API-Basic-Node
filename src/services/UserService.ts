import { DatabaseConnection } from '../config/database';
import {
  CreateUserRequest,
  PaginatedUsersResponse,
  sanitizeUserData,
  UpdateUserRequest,
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

    const validationErrors = validateUserData(sanitizedData);

    if (validationErrors.length > 0) {
      throw new Error(`Validation failed: ${validationErrors.join(', ')}`);
    }

    const existingUser = await this.findUserByEmail(sanitizedData.email || '');
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

    const page = Math.max(1, queryParams.page || USER_VALIDATION.DEFAULT_PAGE);
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

  async getUserById(id: number): Promise<UserResponse | null> {
    logger.info('Fetching user by ID: ', { userId: id });

    if (!id || id <= 0) {
      logger.error('No user ID supplied. Or invalid');
      throw new Error('Invalid user ID');
    }

    try {
      const query = 'SELECT * FROM users WHERE id = $1';
      const result = await this.db.query(query, [id]);

      if (result.rows.length === 0) {
        logger.info('User not found:', { userId: id });
        return null;
      }

      const user = result.rows[0] as User;
      logger.info('User found:', { userId: user.id, email: user.email });
      return userToResponse(user);
    } catch (error) {
      logger.error('Error fetching user by ID:', error);
      throw new Error('Failed to fetch user');
    }
  }

  async updateUser(
    id: number,
    updateData: UpdateUserRequest
  ): Promise<UserResponse | null> {
    logger.info('Updating user: ', { userId: id, updateData });

    if (!id || id <= 0) {
      logger.error('No user ID supplied. Or invalid');
      throw new Error('Invalid user ID');
    }

    const sanitizedData = sanitizeUserData(updateData) as CreateUserRequest;

    const validationErrors = validateUserData(sanitizedData, true);

    if (validationErrors.length > 0) {
      throw new Error(`Validation failed: ${validationErrors.join(', ')}`);
    }

    const existingUser = await this.getUserById(id);
    if (!existingUser) {
      return null;
    }

    if (sanitizedData.email && sanitizedData.email !== existingUser.email) {
      const emailExists = await this.findUserByEmail(sanitizedData.email);
      if (emailExists) {
        logger.error('User with this email already exists');
        throw new Error('User with this email already exists');
      }
    }

    try {
      const updateFields: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (sanitizedData.name !== undefined) {
        updateFields.push(`name = $${paramIndex}`);
        values.push(sanitizedData.name);
        paramIndex++;
      }

      if (sanitizedData.email !== undefined) {
        updateFields.push(`email = $${paramIndex}`);
        values.push(sanitizedData.email);
        paramIndex++;
      }

      if (sanitizedData.age !== undefined) {
        updateFields.push(`age = $${paramIndex}`);
        values.push(sanitizedData.age);
        paramIndex++;
      }

      updateFields.push(`updated_at = NOW()`);

      values.push(id);

      const query = `
        UPDATE users
        SET ${updateFields.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING *
      `;

      const result = await this.db.query(query, values);

      if (result.rows.length === 0) {
        return null;
      }

      const updatedUser = result.rows[0] as User;
      logger.info('User updated successfully:', { userId: updatedUser.id });
      return userToResponse(updatedUser);
    } catch (error) {
      logger.error('Error updating user: ', error);
      throw new Error('Failed to update user');
    }
  }

  async deleteUser(id: number): Promise<boolean> {
    logger.info('Deleting user:', { userId: id });

    if (!id || id <= 0) {
      logger.error('No user ID supplied. Or invalid');
      throw new Error('Invalid user ID');
    }

    try {
      const query = 'DELETE FROM users WHERE id = $1 RETURNING id';
      const result = await this.db.query(query, [id]);

      if (result.rows.length === 0) {
        logger.info('User not found for deletion: ', { userId: id });
        return false;
      }

      logger.info('User deleted successfully: ', { userId: id });
      return true;
    } catch (error) {
      logger.error('Error deleting user: ', error);
      throw new Error('Failed to delete user');
    }
  }

  private async findUserByEmail(email: string): Promise<User | null> {
    try {
      const query = `SELECT * FROM users WHERE email = $1`;
      const result = await this.db.query(query, [email]);

      return result.rows.length > 0 ? (result.rows[0] as User) : null;
    } catch (error) {
      logger.error('Error finding user by email: ', error);
      return null;
    }
  }
}
