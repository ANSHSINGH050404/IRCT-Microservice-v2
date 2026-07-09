class AppError extends Error {
  constructor(message: string, public statusCode: number, public code: string) {
    super(message);
    this.statusCode = statusCode;
    this.code = code; // custom error code
    this.name = 'AppError';
  }
}

class BadRequestError extends AppError {
  constructor(message: string) {
    super(message, 400, 'BAD_REQUEST');
  }
}

class UnauthorizedError extends AppError {
  constructor(message: string) {
    super(message, 401, 'UNAUTHORIZED');
  }
}

class NotFoundError extends AppError {
  constructor(message: string) {
    super(message, 404, 'NOT_FOUND');
  }
}

class ForbiddenError extends AppError {
  constructor(message: string) {
    super(message, 403, 'FORBIDDEN');
  }
}

export default AppError;
export { BadRequestError, UnauthorizedError, NotFoundError, ForbiddenError };