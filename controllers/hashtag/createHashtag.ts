import { Types } from "mongoose";

import { AppError, catchAsync, sendResponse } from "../../helpers/utils";
import Hashtag from "../../models/Hashtag";
import Post from "../../models/Post";

export const createHashtag = catchAsync(async (req, res, next) => {
  const { hashtags, postId } = req.body as {
    hashtags: string[];
    postId: Types.ObjectId;
  };

  const post = await Post.findById(postId);
  if (!post) throw new AppError(404, "Post Not Found", "Create Hashtag Error");

  const newHashtags: { name: string; [key: string]: any }[] = [];

  await Promise.all(
    hashtags.map(async (name: string) => {
      let hashtag = await Hashtag.findOne({ name });
      if (!hashtag) {
        hashtag = await Hashtag.create({ name });
        newHashtags.push(hashtag);
      }
      if (!hashtag.posts.includes(postId)) {
        hashtag.posts.push(postId);
        hashtag = await hashtag.save();
      }
      if (!post.hashtags.includes(hashtag._id)) {
        post.hashtags.push(hashtag._id);
        await post.save();
      }
    })
  );

  return sendResponse(
    res,
    200,
    newHashtags,
    null,
    "Create Hashtags Of Post Successfully"
  );
});
