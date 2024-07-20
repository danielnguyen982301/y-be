import { Types } from "mongoose";

import { AppError, catchAsync, sendResponse } from "../../helpers/utils";
import Reply from "../../models/Reply";
import UserThread from "../../models/UserThread";
import Notification from "../../models/Notification";
import { calculatePostCount } from "../post/createPost";
import { calculateRepostCountOfReply } from "./createRepostOfReply";

export const undoRepostOfReply = catchAsync(async (req, res, next) => {
  const currentUserId = req.userId as Types.ObjectId;
  const { repostId } = req.body;

  const reply = await Reply.findById(repostId);
  if (!reply) throw new AppError(404, "Post Not Found", "Undo Repost Error");

  let thread = await UserThread.findOne({ repost: repostId });
  if (!thread) throw new AppError(404, "Repost Not Found", "Undo Repost Error");

  await thread.delete();
  let notif = await Notification.findOneAndDelete({
    sender: currentUserId,
    event: "repost",
    recipient: reply.author,
    repostType: "Reply",
    repost: repostId,
  }).populate([{ path: "sender" }, { path: "repost", populate: "author" }]);

  await calculatePostCount(currentUserId);
  const repostCount = await calculateRepostCountOfReply(repostId);

  return sendResponse(
    res,
    200,
    { thread, repostCount, notif },
    null,
    "Undo Repost Successfully"
  );
});
