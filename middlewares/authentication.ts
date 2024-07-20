import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { Types } from "mongoose";
import { AuthenticatedRequest } from "../types";

import { AppError } from "../helpers/utils";

type ExtendedJWTPayload = JwtPayload & { _id: Types.ObjectId };

export const loginRequired = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const tokenString = req.headers.authorization;
    if (!tokenString)
      throw new AppError(401, "Login Required", "Authentication Error");

    const token = tokenString.replace("Bearer ", "");
    jwt.verify(token, process.env.JWT_SECRET_KEY as string, (err, payload) => {
      if (err) {
        if (err.name === "TokenExpiredError")
          throw new AppError(401, "Token Expired", "Authentication Error");
        else throw new AppError(401, "Invalid Token", "Authentication Error");
      }
      const jwtPayload = payload as ExtendedJWTPayload;
      req.userId = jwtPayload._id;
    });
    next();
  } catch (error) {
    next(error);
  }
};
