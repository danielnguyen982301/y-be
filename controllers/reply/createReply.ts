import mongoose, { Types } from "mongoose";

import { AppError, catchAsync, sendResponse } from "../../helpers/utils";
import Reply from "../../models/Reply";
import UserThread from "../../models/UserThread";
import Notification from "../../models/Notification";
import { calculatePostCount } from "../post/createPost";

export const calculateReplyCount = async (
  targetId: Types.ObjectId,
  targetType: "Post" | "Reply"
) => {
  const replyCount = await Reply.countDocuments({
    target: targetId,
    targetType,
  });

  await mongoose.model(targetType).findByIdAndUpdate(targetId, { replyCount });
  return replyCount;
};

export const createNewReply = catchAsync(async (req, res, next) => {
  const currentUserId = req.userId as Types.ObjectId;
  const { content, mediaFile, targetType, targetId, links } = req.body;

  const targetObj = await mongoose.model(targetType).findById(targetId);
  if (!targetObj)
    throw new AppError(404, `${targetType} Not Found`, "Create Reply Error");

  let reply = await Reply.create({
    content,
    mediaFile,
    targetType,
    target: targetId,
    author: currentUserId,
    links,
  });

  reply = await reply.populate("target");

  await UserThread.create({
    user: currentUserId,
    reply: reply._id,
  });

  const populatedReply = reply.toJSON() as Record<string, any>;
  const targetAuthor = new mongoose.Types.ObjectId(
    populatedReply.target.author
  );
  if (!targetAuthor.equals(currentUserId)) {
    await Notification.create({
      sender: currentUserId,
      event: "reply",
      recipient: populatedReply.target.author,
      reply: reply._id,
    });
  }

  await calculatePostCount(currentUserId);
  const replyCount = await calculateReplyCount(targetId, targetType);
  reply = await reply.populate("author");

  return sendResponse(
    res,
    200,
    { reply, replyCount },
    null,
    "Create Reply Successfully"
  );
});
