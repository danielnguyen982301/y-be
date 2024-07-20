import mongoose from "mongoose";

import { AppError, catchAsync, sendResponse } from "../../helpers/utils";
import Bookmark from "../../models/Bookmark";
import { calculateBookmarkCount } from "./createBookmark";

export const removeBookmark = catchAsync(async (req, res, next) => {
  const currentUserId = req.userId;
  const { targetType, targetId } = req.body;

  const targetObj = await mongoose.model(targetType).findById(targetId);
  if (!targetObj)
    throw new AppError(404, `${targetType} Not Found`, "Remove Bookmark Error");

  let bookmark = await Bookmark.findOne({
    user: currentUserId,
    targetType,
    target: targetId,
  });
  if (!bookmark)
    throw new AppError(404, `Bookmark Not Found`, "Remove Bookmark Error");

  await bookmark.delete();

  const bookmarkCount = await calculateBookmarkCount(targetId, targetType);

  return sendResponse(
    res,
    200,
    { bookmark, bookmarkCount },
    null,
    "Remove Bookmark Successfully"
  );
});
