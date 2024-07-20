import { Types } from "mongoose";

import Post from "../../models/Post";
import { AppError, catchAsync, sendResponse } from "../../helpers/utils";

export const updateSinglePost = catchAsync(async (req, res, next) => {
  const currentUserId = req.userId as Types.ObjectId;
  const postId = req.params.id;

  let post = await Post.findById(postId);
  if (!post) throw new AppError(404, "Post Not Found", "Update Post Error");
  if (!post.author.equals(currentUserId))
    throw new AppError(403, "User Not Authorized", "Update Post Error");

  const allows: ("content" | "mediaFile")[] = ["content", "mediaFile"];

  allows.forEach((field) => {
    if (req.body[field] !== undefined) {
      post[field] = req.body[field];
    }
  });
  await post.save();

  return sendResponse(res, 200, post, null, "Update Post Successfully");
});
