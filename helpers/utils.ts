import { NextFunction, Request, Response } from "express";
import { Types } from "mongoose";

export type AuthenticatedRequest = Request & { userId?: Types.ObjectId };

type Callback = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => Promise<Response>;

export type Message = {
  _id: string;
  content: string;
  from: string;
  to: string;
  isRead: boolean;
  createdAt: string;
  [key: string]: any;
};

export type ChatSession = {
  userId: string;
  username: string;
};

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

class SessionStore {
  findSession(id: string) {}
  saveSession(id: string, session: ChatSession) {}
  findAllSessions() {}
}

export class InMemorySessionStore extends SessionStore {
  sessions: Map<string, ChatSession>;
  constructor() {
    super();
    this.sessions = new Map();
  }

  findSession(id: string) {
    return this.sessions.get(id);
  }

  saveSession(id: string, session: ChatSession) {
    this.sessions.set(id, session);
  }

  findAllSessions() {
    return [...this.sessions.values()];
  }
}

/* abstract */ class MessageStore {
  saveMessage(message: Message) {}
  findMessagesForUser(userId: string) {}
}

export class InMemoryMessageStore extends MessageStore {
  messages: Message[];
  constructor() {
    super();
    this.messages = [];
  }

  saveMessage(message: Message) {
    this.messages.push(message);
  }

  findMessagesForUser(userId: string) {
    return this.messages.filter(
      ({ from, to }) => from === userId || to === userId
    );
  }
}
