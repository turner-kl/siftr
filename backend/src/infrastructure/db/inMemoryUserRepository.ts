/**
 * In-Memory User Repository (for testing)
 */

import { NotFoundError, type Result, type ValidationError, err, ok } from '../../core/result';
import type { User } from '../../domain/entities/user';
import type { UserRepository } from '../../domain/repositories/user-repository';
import type { UserId } from '../../domain/types';

export class InMemoryUserRepository implements UserRepository {
  private users: Map<string, User> = new Map();

  async findById(userId: UserId): Promise<Result<User | null, ValidationError | NotFoundError>> {
    const user = this.users.get(userId);
    return ok(user || null);
  }

  async findByCognitoSub(
    cognitoSub: string
  ): Promise<Result<User | null, ValidationError | NotFoundError>> {
    const user = Array.from(this.users.values()).find((u) => u.cognitoSub === cognitoSub);
    return ok(user || null);
  }

  async findByEmail(email: string): Promise<Result<User | null, ValidationError | NotFoundError>> {
    const normalizedEmail = email.toLowerCase().trim();
    const user = Array.from(this.users.values()).find(
      (u) => u.email.toLowerCase() === normalizedEmail
    );
    return ok(user || null);
  }

  async findAll(): Promise<Result<User[], ValidationError>> {
    return ok(Array.from(this.users.values()));
  }

  async save(user: User): Promise<Result<void, ValidationError>> {
    // Deep copy to prevent reference issues
    this.users.set(user.userId, JSON.parse(JSON.stringify(user)));
    return ok(undefined);
  }

  async delete(userId: UserId): Promise<Result<void, ValidationError | NotFoundError>> {
    if (!this.users.has(userId)) {
      return err(new NotFoundError('ユーザー', userId));
    }
    this.users.delete(userId);
    return ok(undefined);
  }

  async exists(userId: UserId): Promise<Result<boolean, ValidationError>> {
    return ok(this.users.has(userId));
  }

  // Test helper methods
  clear(): void {
    this.users.clear();
  }

  seedUsers(users: User[]): void {
    for (const user of users) {
      this.users.set(user.userId, JSON.parse(JSON.stringify(user)));
    }
  }
}
