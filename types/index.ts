import { NextFunction, Request, Response } from "express";
import { Types } from "mongoose";

export type AuthenticatedRequest = Request & { userId?: Types.ObjectId };

export type Callback = (
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

export type RepostNotif = {
  _id: string;
  sender: {
    _id: string;
    avatar: string;
    username: string;
    displayName: string;
    [key: string]: any;
  };
  event: "repost";
  recipient: string;
  repostType: "Post" | "Reply";
  repost: {
    _id: string;
    author: { username: string; [key: string]: any };
    content: string;
  };
  delete?: boolean;
};

export type FollowNotif = {
  _id: string;
  sender: {
    _id: string;
    avatar: string;
    username: string;
    displayName: string;
    [key: string]: any;
  };
  event: "follow";
  recipient: string;
  delete?: boolean;
};
