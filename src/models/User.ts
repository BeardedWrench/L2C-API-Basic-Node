export interface User {
  id: number;
  name: string;
  email: string;
  age?: number;
  created_at: Date;
  updated_at: Date;
}

export interface CreateUserRequest {
  name: string;
  email: string;
  age?: number;
}

export interface UpdateUserRequest {
  name?: string;
  email?: string;
  age?: number;
}

export interface UserQueryParams {
  page?: number;
  limit?: number;
  name?: string;
  email?: string;
  minAge?: number;
  maxAge?: number;
  sortBy?: 'name' | 'email' | 'age' | 'created_at';
  sortOrder?: 'ASC' | 'DESC';
}

export interface UserResponse {
  id: number;
  name: string;
  email: string;
  age?: number;
  created_at: string;
  updated_at: string;
}

export interface PaginatedUsersResponse {
  users: UserResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export const USER_VALIDATION = {
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 100,
  EMAIL_MAX_LENGTH: 255,
  AGE_MIN: 0,
  AGE_MAX: 100,
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
};

export function validateUserData(
  userData: CreateUserRequest | UpdateUserRequest,
  isUpdate: boolean = false
): string[] {
  const errors: string[] = [];

  if (!isUpdate || 'name' in userData) {
    const name = userData.name;

    if (!name) {
      errors.push('Name is required.');
    } else if (typeof name !== 'string') {
      errors.push('Name must be a string');
    } else if (name.length < USER_VALIDATION.NAME_MIN_LENGTH) {
      errors.push(`Name must be at least ${USER_VALIDATION.NAME_MIN_LENGTH}`);
    } else if (name.length > USER_VALIDATION.NAME_MAX_LENGTH) {
      errors.push(
        `Name must be no more than ${USER_VALIDATION.NAME_MAX_LENGTH} characters long`
      );
    }
  }

  if (!isUpdate || 'email' in userData) {
    const email = userData.email;

    if (!email) {
      errors.push('Email is required.');
    } else if (typeof email !== 'string') {
      errors.push('Email must be a string');
    } else if (email.length > USER_VALIDATION.EMAIL_MAX_LENGTH) {
      errors.push(
        `Email must be no more than ${USER_VALIDATION.EMAIL_MAX_LENGTH} characters long`
      );
    }
  }

  if (!isUpdate || 'age' in userData) {
    const age = userData.age;

    if (!age) {
      errors.push('Age is required.');
    } else if (typeof age !== 'number') {
      errors.push('Age must be a number');
    } else if (age < USER_VALIDATION.AGE_MIN) {
      errors.push(`Age must be at least ${USER_VALIDATION.AGE_MIN}`);
    } else if (age > USER_VALIDATION.AGE_MIN) {
      errors.push(
        `Age must be no more than ${USER_VALIDATION.AGE_MIN} characters long`
      );
    }
  }

  return errors;
}

export function sanitizeUserData(
  userData: CreateUserRequest | UpdateUserRequest
): CreateUserRequest | UpdateUserRequest {
  const sanitized = { ...userData };

  if ('name' in sanitized && sanitized.name) {
    sanitized.name = sanitized.name.trim();
  }

  if ('email' in sanitized && sanitized.email) {
    sanitized.email = sanitized.email.trim().toLowerCase();
  }

  if ('age' in sanitized && sanitized.age) {
    sanitized.age = Math.floor(Number(sanitized.age));
  }

  return sanitized;
}

export function userToResponse(user: User): UserResponse {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    age: user.age,
    created_at: user.created_at.toISOString(),
    updated_at: user.updated_at.toISOString(),
  };
}
