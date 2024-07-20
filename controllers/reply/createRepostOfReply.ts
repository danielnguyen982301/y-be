import { Types } from "mongoose";

import { AppError, catchAsync, sendResponse } from "../../helpers/utils";
import Reply from "../../models/Reply";
import UserThread from "../../models/UserThread";
import Notification from "../../models/Notification";
import { calculatePostCount } from "../post/createPost";

export const calculateRepostCountOfReply = async (replyId: Types.ObjectId) => {
  const repostCount = await UserThread.countDocuments({
    repostType: "Reply",
    repost: replyId,
  });

  await Reply.findByIdAndUpdate(replyId, { repostCount });
  return repostCount;
};

export const createRepostOfReply = catchAsync(async (req, res, next) => {
  const currentUserId = req.userId as Types.ObjectId;
  const { repostType, repostId } = req.body;

  const reply = await Reply.findById(repostId);
  if (!reply)
    throw new AppError(404, "Reply Not Found", "Create Repost Of Reply Error");

  let thread = await UserThread.findOne({
    user: currentUserId,
    repost: repostId,
  });
  if (thread)
    throw new AppError(
      409,
      "You already reposted this reply",
      "Create Repost Of Reply Error"
    );

  thread = await UserThread.create({
    user: currentUserId,
    repostType,
    repost: repostId,
  });

  let notif;

  if (!reply.author.equals(currentUserId)) {
    notif = await Notification.create({
      sender: currentUserId,
      event: "repost",
      recipient: reply.author,
      repostType: "Reply",
      repost: repostId,
    });
    notif = await notif.populate([
      { path: "sender" },
      { path: "repost", populate: "author" },
    ]);
  }

  await calculatePostCount(currentUserId);
  const repostCount = await calculateRepostCountOfReply(repostId);

  return sendResponse(
    res,
    200,
    { thread, repostCount, notif },
    null,
    "Repost Reply Successfully"
  );
});
