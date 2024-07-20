import { NextFunction, Response } from "express";
import { AuthenticatedRequest, Callback } from "../types";

export const sendResponse = (
  res: Response,
  status: number,
  data: Record<string, any> | null,
  errors: string | { message: string } | null,
  message: string
): Response => {
  const response: {
    data?: Record<string, any>;
    errors?: string | { message: string };
    message?: string;
  } = {};
  if (data) response.data = data;
  if (errors) response.errors = errors;
  if (message) response.message = message;
  return res.status(status).json(response);
};

export const catchAsync =
  (func: Callback) =>
  (req: AuthenticatedRequest, res: Response, next: NextFunction) =>
    func(req, res, next).catch((err: Error) => next(err));

export class AppError extends Error {
  statusCode: number;
  errorType: string;
  isOperational: boolean;
  constructor(statusCode: number, message: string, errorType: string) {
    super(message);
    this.statusCode = statusCode;
    this.errorType = errorType;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}
