import { Types } from "mongoose";

import Post from "../../models/Post";
import { AppError, catchAsync, sendResponse } from "../../helpers/utils";
import UserThread from "../../models/UserThread";
import Notification from "../../models/Notification";
import { calculatePostCount } from "./createPost";
import { calculateRepostCountOfPost } from "./createRepostOfPost";

export const undoRepostOfPost = catchAsync(async (req, res, next) => {
  const currentUserId = req.userId as Types.ObjectId;
  const { repostId } = req.body;

  const post = await Post.findById(repostId);
  if (!post) throw new AppError(404, "Post Not Found", "Undo Repost Error");

  let thread = await UserThread.findOne({ repost: repostId });
  if (!thread) throw new AppError(404, "Repost Not Found", "Undo Repost Error");

  await thread.delete();

  let notif = await Notification.findOneAndDelete({
    sender: currentUserId,
    event: "repost",
    recipient: post.author,
    repostType: "Post",
    repost: repostId,
  }).populate([{ path: "sender" }, { path: "repost", populate: "author" }]);

  await calculatePostCount(currentUserId);
  const repostCount = await calculateRepostCountOfPost(repostId);

  return sendResponse(
    res,
    200,
    { thread, repostCount, notif },
    null,
    "Undo Repost Successfully"
  );
});
