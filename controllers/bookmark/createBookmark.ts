import mongoose, { Types } from "mongoose";

import { AppError, catchAsync, sendResponse } from "../../helpers/utils";
import Bookmark from "../../models/Bookmark";

export const calculateBookmarkCount = async (
  targetId: Types.ObjectId,
  targetType: "Post" | "Reply"
) => {
  const bookmarkCount = await Bookmark.countDocuments({
    target: targetId,
    targetType,
  });
  await mongoose
    .model(targetType)
    .findByIdAndUpdate(targetId, { bookmarkCount });
  return bookmarkCount;
};

export const createBookmark = catchAsync(async (req, res, next) => {
  const currentUserId = req.userId;
  const { targetType, targetId } = req.body;

  const targetObj = await mongoose.model(targetType).findById(targetId);
  if (!targetObj)
    throw new AppError(404, `${targetType} Not Found`, "Create Bookmark Error");

  let bookmark = await Bookmark.findOne({
    user: currentUserId,
    targetType,
    target: targetId,
  });
  if (bookmark)
    throw new AppError(
      409,
      `You already bookmarked this ${targetType}`,
      "Create Bookmark Error"
    );

  bookmark = await Bookmark.create({
    user: currentUserId,
    targetType,
    target: targetId,
  });

  const bookmarkCount = await calculateBookmarkCount(targetId, targetType);

  return sendResponse(
    res,
    200,
    { bookmark, bookmarkCount },
    null,
    "Save Bookmark Successfully"
  );
});
