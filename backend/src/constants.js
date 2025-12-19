const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500
};

const MESSAGES = {
  USER_REGISTERED: 'User registered successfully',
  USER_LOGGED_IN: 'User logged in successfully',
  USER_LOGGED_OUT: 'User logged out successfully',
  USER_NOT_FOUND: 'User not found',
  INVALID_CREDENTIALS: 'Invalid credentials',
  EMAIL_ALREADY_EXISTS: 'Email already exists',
  EMAIL_NOT_FOUND: 'Email doesn\'t exist',
  INVALID_TOKEN: 'Invalid token',
  TOKEN_EXPIRED: 'Token expired',
  ACCESS_DENIED: 'Access denied',
  SERVER_ERROR: 'Internal server error',
  VALIDATION_ERROR: 'Validation error'
};

const USER_ROLES = {
  GLS: 'GLS',
  CMP: 'CMP',
  SCFU: 'SCFU',
  YONO: 'YONO',
  // All: 'All',
};

export const TICKET_CONFIG = {
  // Number of days after which a resolved ticket should auto-close
  AUTO_CLOSE_THRESHOLD_DAYS: 14,
  
  
};

export {
  HTTP_STATUS,
  MESSAGES,
  USER_ROLES
};