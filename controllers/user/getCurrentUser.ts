import { AppError, catchAsync, sendResponse } from "../../helpers/utils";
import User from "../../models/User";

export const getCurrentUser = catchAsync(async (req, res, next) => {
  const currentUserId = req.userId;

  const user = await User.findById(currentUserId);
  if (!user)
    throw new AppError(404, "User Not Found", "Get Current User Error");

  return sendResponse(res, 200, user, null, "Get Current User Successfully");
});
