import { Types } from "mongoose";

import Post from "../../models/Post";
import { AppError, catchAsync, sendResponse } from "../../helpers/utils";
import UserThread from "../../models/UserThread";
import Like from "../../models/Like";
import Bookmark from "../../models/Bookmark";
import Reply from "../../models/Reply";
import Notification from "../../models/Notification";
import { calculatePostCount } from "./createPost";

export const deleteSinglePost = catchAsync(async (req, res, next) => {
  const currentUserId = req.userId as Types.ObjectId;
  const postId = req.params.id;

  const post = await Post.findById(postId);
  if (!post) throw new AppError(404, "Post Not Found", "Delete Post Error");
  if (!post.author.equals(currentUserId))
    throw new AppError(403, "User Not Authorized", "Delete Post Error");

  const relatedReplies = await Reply.find({ links: postId });
  const relatedAuthorIds = new Set([
    currentUserId,
    ...relatedReplies.map((reply) => reply.author),
  ]);
  const relatedReplyIds = relatedReplies.map((reply) => reply._id);
  const relatedReplyAndPostIds = [post._id, ...relatedReplyIds];
  const relatedThreads = await UserThread.find({
    $or: [
      { post: postId },
      { reply: { $in: relatedReplyIds } },
      { repost: { $in: relatedReplyAndPostIds } },
    ],
  });
  const relatedThreadIds = relatedThreads.map((thread) => thread._id);
  const relatedNotifs = await Notification.find({
    $or: [
      { mentionLocation: { $in: relatedReplyAndPostIds } },
      { repost: { $in: relatedReplyAndPostIds } },
      { reply: { $in: relatedReplyIds } },
    ],
  });
  const relatedNotifIds = relatedNotifs.map((notif) => notif._id);
  const relatedNotifRecipients = relatedNotifs.map((notif) => notif.recipient);

  await Bookmark.deleteMany({ target: { $in: relatedReplyAndPostIds } });
  await Like.deleteMany({ target: { $in: relatedReplyAndPostIds } });
  await UserThread.deleteMany({
    _id: { $in: relatedThreadIds },
  });
  await Notification.deleteMany({
    _id: { $in: relatedNotifIds },
  });
  await Reply.deleteMany({ _id: { $in: relatedReplyIds } });
  await post.delete();

  await Promise.all(
    [...relatedAuthorIds].map(async (userId) => {
      await calculatePostCount(userId);
    })
  );

  return sendResponse(
    res,
    200,
    { post, notifRecipients: relatedNotifRecipients },
    null,
    "Delete Post Successfully"
  );
});
