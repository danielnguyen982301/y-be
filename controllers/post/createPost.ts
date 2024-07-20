import { Types } from "mongoose";

import Post from "../../models/Post";
import User from "../../models/User";
import { catchAsync, sendResponse } from "../../helpers/utils";
import UserThread from "../../models/UserThread";

export const calculatePostCount = async (userId: Types.ObjectId) => {
  const postCount = await UserThread.countDocuments({
    user: userId,
  });

  await User.findByIdAndUpdate(userId, { postCount });
};

export const createNewPost = catchAsync(async (req, res, next) => {
  const currentUserId = req.userId as Types.ObjectId;
  const { content, mediaFile } = req.body;

  const post = await Post.create({
    content,
    mediaFile,
    author: currentUserId,
  });

  let thread = await UserThread.create({
    user: currentUserId,
    post: post._id,
  });

  await calculatePostCount(currentUserId);
  thread = await thread.populate({
    path: "post",
    populate: { path: "author" },
  });

  return sendResponse(res, 200, thread, null, "Create Post Successfully");
});
