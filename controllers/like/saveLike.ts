import mongoose, { Types } from "mongoose";

import { AppError, catchAsync, sendResponse } from "../../helpers/utils";
import Like from "../../models/Like";

const calculateLikes = async (
  targetId: Types.ObjectId,
  targetType: "Post" | "Reply"
) => {
  const likeCount = await Like.countDocuments({
    target: targetId,
    targetType,
  });
  await mongoose.model(targetType).findByIdAndUpdate(targetId, { likeCount });
  return likeCount;
};

export const saveLike = catchAsync(async (req, res, next) => {
  const { targetType, target: targetId } = req.body;

  const targetObj = await mongoose.model(targetType).findById(targetId);
  if (!targetObj)
    throw new AppError(404, `${targetType} Not Found`, "Create Like Error");

  let like = await Like.findOne({
    targetType,
    target: targetId,
    author: req.userId,
  });

  if (!like) {
    like = await Like.create({
      targetType,
      target: targetId,
      author: req.userId,
    });
  } else {
    await like.delete();
  }

  const likeCount = await calculateLikes(targetId, targetType);
  return sendResponse(
    res,
    200,
    { likeCount },
    null,
    "Save Reaction Successfully"
  );
});
