const utilsHelper = {};

utilsHelper.sendResponse = (res, status, data, errors, message) => {
  const response = {};
  if (data) response.data = data;
  if (errors) response.errors = errors;
  if (message) response.message = message;
  return res.status(status).json(response);
};

class AppError extends Error {
  constructor(statusCode, message, errorType) {
    super(message);
    this.statusCode = statusCode;
    this.errorType = errorType;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

utilsHelper.AppError = AppError;

module.exports = utilsHelper;
