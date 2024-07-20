import { Types } from "mongoose";

import { AppError, catchAsync, sendResponse } from "../../helpers/utils";
import Reply from "../../models/Reply";
import UserThread from "../../models/UserThread";
import Like from "../../models/Like";
import Bookmark from "../../models/Bookmark";
import Notification from "../../models/Notification";
import { calculateReplyCount } from "./createReply";
import { calculatePostCount } from "../post/createPost";

export const deleteSingleReply = catchAsync(async (req, res, next) => {
  const currentUserId = req.userId as Types.ObjectId;
  const replyId = req.params.id;

  const reply = await Reply.findById(replyId);
  if (!reply) throw new AppError(404, "Reply Not Found", "Delete Reply Error");
  if (!reply.author.equals(currentUserId))
    throw new AppError(403, "User Not Authorized", "Delete Reply Error");

  const relatedReplies = await Reply.find({ links: replyId });
  const relatedAuthorIds = new Set([
    currentUserId,
    ...relatedReplies.map((reply) => reply.author),
  ]);
  const relatedReplyIds = [
    reply._id,
    ...relatedReplies.map((reply) => reply._id),
  ];
  const relatedThreads = await UserThread.find({
    $or: [
      { reply: { $in: relatedReplyIds } },
      { repostType: "Reply", repost: { $in: relatedReplyIds } },
    ],
  });
  const relatedThreadIds = relatedThreads.map((thread) => thread._id);
  const relatedNotifs = await Notification.find({
    $or: [
      { mentionLocation: { $in: relatedReplyIds } },
      { repost: { $in: relatedReplyIds } },
      { reply: { $in: relatedReplyIds } },
    ],
  });
  const relatedNotifIds = relatedNotifs.map((notif) => notif._id);
  const relatedNotifRecipients = relatedNotifs.map((notif) => notif.recipient);

  await Bookmark.deleteMany({
    targetType: "Reply",
    target: { $in: relatedReplyIds },
  });
  await Like.deleteMany({
    targetType: "Reply",
    target: { $in: relatedReplyIds },
  });
  await UserThread.deleteMany({
    _id: { $in: relatedThreadIds },
  });
  await Notification.deleteMany({
    _id: { $in: relatedNotifIds },
  });
  await Reply.deleteMany({ _id: { $in: relatedReplyIds } });

  await Promise.all(
    [...relatedAuthorIds].map(async (userId) => {
      await calculatePostCount(userId);
    })
  );

  const replyCount = await calculateReplyCount(reply.target, reply.targetType);

  return sendResponse(
    res,
    200,
    { reply, replyCount, notifRecipients: relatedNotifRecipients },
    null,
    "Delete Reply Successfully"
  );
});
