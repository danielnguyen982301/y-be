import { NextFunction, Request, Response } from "express";
import { AppError, catchAsync, sendResponse } from "../helpers/utils";
import bcrypt from "bcryptjs";
import User from "../models/User";

export const loginWithEmail = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email }, "+password");
    if (!user) throw new AppError(400, "Invalid Credentials", "Login Error");

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new AppError(400, "Wrong Password", "Login Error");
    const accessToken = user.generateToken();

    return sendResponse(
      res,
      200,
      { user, accessToken },
      null,
      "Log in Successfully!"
    );
  }
);
