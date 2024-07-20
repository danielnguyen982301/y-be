import mongoose, { Types } from "mongoose";

import { AppError, catchAsync, sendResponse } from "../../helpers/utils";
import Notification from "../../models/Notification";

export const createMentionNotification = catchAsync(async (req, res, next) => {
  const currentUserId = req.userId as Types.ObjectId;
  const { mentionLocationType, mentionLocation, mentionedTargets } = req.body;

  const targetObj = await mongoose
    .model(mentionLocationType)
    .findById(mentionLocation);
  if (!targetObj)
    throw new AppError(
      404,
      `${mentionLocationType} Not Found`,
      "Create Mention Notification Error"
    );

  const transformedIds = mentionedTargets.map(
    (userId: string) => new mongoose.Types.ObjectId(userId)
  );

  const mentionedTargetsWithoutCurrentUser = transformedIds.filter(
    (target: Types.ObjectId) => !target.equals(currentUserId)
  );

  const notifs = await Promise.all(
    mentionedTargetsWithoutCurrentUser.map(async (target: Types.ObjectId) => {
      return await Notification.create({
        sender: currentUserId,
        event: "mention",
        recipient: target,
        mentionLocationType,
        mentionLocation,
      });
    })
  );

  return sendResponse(
    res,
    200,
    notifs,
    null,
    "Create Mention Notification Successfully"
  );
});
