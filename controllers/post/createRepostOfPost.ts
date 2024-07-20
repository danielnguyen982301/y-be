import { Types } from "mongoose";

import Post from "../../models/Post";
import { AppError, catchAsync, sendResponse } from "../../helpers/utils";
import UserThread from "../../models/UserThread";
import Notification from "../../models/Notification";
import { calculatePostCount } from "./createPost";

export const calculateRepostCountOfPost = async (postId: Types.ObjectId) => {
  const repostCount = await UserThread.countDocuments({
    repostType: "Post",
    repost: postId,
  });

  await Post.findByIdAndUpdate(postId, { repostCount });
  return repostCount;
};

export const createRepostOfPost = catchAsync(async (req, res, next) => {
  const currentUserId = req.userId as Types.ObjectId;
  const { repostType, repostId } = req.body;

  const post = await Post.findById(repostId);
  if (!post) throw new AppError(404, "Post Not Found", "Create Repost Error");

  let thread = await UserThread.findOne({
    user: currentUserId,
    repost: repostId,
  });
  if (thread)
    throw new AppError(
      409,
      "You already reposted this post",
      "Create Repost Error"
    );

  thread = await UserThread.create({
    user: currentUserId,
    repostType,
    repost: repostId,
  });

  let notif;

  if (!post.author.equals(currentUserId)) {
    notif = await Notification.create({
      sender: currentUserId,
      event: "repost",
      recipient: post.author,
      repostType: "Post",
      repost: repostId,
    });
    notif = await notif.populate([
      { path: "sender" },
      { path: "repost", populate: "author" },
    ]);
  }

  await calculatePostCount(currentUserId);
  const repostCount = await calculateRepostCountOfPost(repostId);

  return sendResponse(
    res,
    200,
    { thread, repostCount, notif },
    null,
    "Repost Successfully"
  );
});
