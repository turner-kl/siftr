/**
 * User Repository Interface (Domain Layer)
 */

import type { NotFoundError, Result, ValidationError } from '../../core/result';
import type { User } from './user.entity';
import type { UserId } from '../types';

/**
 * User Repository Interface
 */
export interface UserRepository {
  /**
   * Find user by ID
   */
  findById(userId: UserId): Promise<Result<User | null, ValidationError | NotFoundError>>;

  /**
   * Find user by Cognito Sub
   */
  findByCognitoSub(
    cognitoSub: string
  ): Promise<Result<User | null, ValidationError | NotFoundError>>;

  /**
   * Find user by email
   */
  findByEmail(email: string): Promise<Result<User | null, ValidationError | NotFoundError>>;

  /**
   * Find all users (for admin/testing)
   */
  findAll(): Promise<Result<User[], ValidationError>>;

  /**
   * Save user (create or update)
   */
  save(user: User): Promise<Result<void, ValidationError>>;

  /**
   * Delete user by ID
   */
  delete(userId: UserId): Promise<Result<void, ValidationError | NotFoundError>>;

  /**
   * Check if user exists
   */
  exists(userId: UserId): Promise<Result<boolean, ValidationError>>;
}
