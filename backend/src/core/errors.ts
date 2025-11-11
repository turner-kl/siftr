/**
 * Domain Error Classes
 */

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends Error {
  constructor(entityName: string, id: string) {
    super(`${entityName}が見つかりません: ${id}`);
    this.name = 'NotFoundError';
  }
}

export class SystemError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = 'SystemError';
  }
}
