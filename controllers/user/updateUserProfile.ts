import { Types } from "mongoose";

import { AppError, catchAsync, sendResponse } from "../../helpers/utils";
import User from "../../models/User";

export const updateUserProfile = catchAsync(async (req, res, next) => {
  const currentUserId = req.userId;
  const userId = req.params.id as unknown as Types.ObjectId;

  if (currentUserId !== userId)
    throw new AppError(403, "Permission Required", "Update User Error");

  let user = await User.findById(userId);
  if (!user) throw new AppError(404, "User Not Found", "Update User Error");

  const allows: ("displayName" | "avatar" | "header" | "bio" | "location")[] = [
    "displayName",
    "avatar",
    "header",
    "bio",
    "location",
  ];

  allows.forEach((field) => {
    if (req.body[field] !== undefined) {
      user[field] = req.body[field];
    }
  });
  await user.save();

  return sendResponse(res, 200, user, null, "Update User Successfully");
});
