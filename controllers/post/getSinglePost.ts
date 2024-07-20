import Post from "../../models/Post";
import { AppError, catchAsync, sendResponse } from "../../helpers/utils";
import UserThread from "../../models/UserThread";
import Follow from "../../models/Follow";
import Like from "../../models/Like";
import Bookmark from "../../models/Bookmark";

export const getSinglePost = catchAsync(async (req, res, next) => {
  const currentUserId = req.userId;
  const postId = req.params.id;

  let post = await Post.findById(postId).populate("author");
  if (!post) throw new AppError(404, "Post Not Found", "Get Single Post Error");

  const isLiked = !!(await Like.findOne({
    author: currentUserId,
    targetType: "Post",
    target: post._id,
  }));

  const isReposted = !!(await UserThread.findOne({
    user: currentUserId,
    repostType: "Post",
    repost: post._id,
  }));

  const isBookmarked = !!(await Bookmark.findOne({
    user: currentUserId,
    targetType: "Post",
    target: post._id,
  }));

  const relationship = await Follow.find({
    $or: [
      { follower: currentUserId, followee: post.author },
      {
        follower: post.author,
        followee: currentUserId,
      },
    ],
  });

  const postWithContent = post.toJSON() as Record<string, any>;
  postWithContent.isLiked = isLiked;
  postWithContent.isReposted = isReposted;
  postWithContent.isBookmarked = isBookmarked;
  postWithContent.author = postWithContent.author.toJSON() as Record<
    string,
    any
  >;
  postWithContent.author.relationship = !relationship.length
    ? undefined
    : relationship.length === 2
    ? "followEachOther"
    : relationship[0].follower.equals(post.author)
    ? "followsCurrentUser"
    : "followedByCurrentUser";

  await Post.findByIdAndUpdate(postId, { $inc: { viewCount: 1 } });

  return sendResponse(
    res,
    200,
    postWithContent,
    null,
    "Get Single Post Successfully"
  );
});
