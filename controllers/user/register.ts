import bcrypt from "bcryptjs";

import { AppError, catchAsync, sendResponse } from "../../helpers/utils";
import User from "../../models/User";

export const register = catchAsync(async (req, res, next) => {
  let { username, displayName, email, password } = req.body;

  let user = await User.findOne({ $or: [{ email }, { username }] });
  if (user)
    throw new AppError(
      409,
      "User with this email or username already exists",
      "Registration Error"
    );

  const salt = await bcrypt.genSalt(10);
  password = await bcrypt.hash(password, salt);
  user = await User.create({ username, displayName, email, password });
  const accessToken = user.generateToken();

  return sendResponse(
    res,
    200,
    { user, accessToken },
    null,
    "Create User Successfully!"
  );
});
