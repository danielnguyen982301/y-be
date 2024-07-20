import { Types } from "mongoose";

import Post from "../../models/Post";
import User from "../../models/User";
import { AppError, catchAsync, sendResponse } from "../../helpers/utils";
import UserThread from "../../models/UserThread";
import Follow from "../../models/Follow";
import Like from "../../models/Like";
import Bookmark from "../../models/Bookmark";

export const getPostsOfSingleUser = catchAsync(async (req, res, next) => {
  const currentUserId = req.userId as Types.ObjectId;
  const { userId } = req.params as unknown as { userId: Types.ObjectId };
  let { page, limit, ...filter } = req.query as unknown as {
    page: number;
    limit: number;
    [key: string]: any;
  };

  page = page || 1;
  limit = limit || 10;

  const user = await User.findById(userId);
  if (!user)
    throw new AppError(404, "User Not Found", "Get Posts of Single User Error");

  let filterConditions: Record<string, any>[] = [
    { user: userId },
    { reply: { $eq: undefined } },
  ];

  if (filter.original) {
    filterConditions = filterConditions.filter(
      (condition) => !Object.keys(condition).includes("reply")
    );
    filterConditions.push({ repost: { $eq: undefined } });
  }

  const filterCriteria = filterConditions.length
    ? { $and: filterConditions }
    : {};

  const count = await UserThread.countDocuments(filterCriteria);
  const totalPages = Math.ceil(count / limit);

  let posts = await UserThread.find(filterCriteria)
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip((page - 1) * limit)
    .populate("user")
    .populate({ path: "post", populate: "author" })
    .populate({
      path: "reply",
      populate: [{ path: "author" }, { path: "target", populate: "author" }],
    })
    .populate({ path: "repost", populate: "author" });

  const populatedPosts = await Promise.all(
    posts.map(async (post) => {
      if (post.repostType === "Reply") {
        return await post.populate({
          path: "repost",
          populate: [
            { path: "author" },
            { path: "target", populate: "author" },
          ],
        });
      }
      return post;
    })
  );

  const postIds = posts.map((post) => post.post || post.repost);

  const likedPosts = await Like.find({
    author: currentUserId,
    targetType: "Post",
    target: { $in: postIds },
  });

  const repostedPosts = await UserThread.find({
    user: currentUserId,
    repostType: "Post",
    repost: { $in: postIds },
  });

  const bookmarkedPosts = await Bookmark.find({
    user: currentUserId,
    targetType: "Post",
    target: { $in: postIds },
  });

  const authorIds = posts.map((post) => {
    let temp = post.toJSON() as Record<string, any>;
    return temp.post
      ? temp.post.author._id
      : temp.repost
      ? temp.repost.author._id
      : temp.reply.author._id;
  });

  const relationships = await Follow.find({
    $or: [
      { follower: currentUserId, followee: { $in: authorIds } },
      {
        follower: { $in: authorIds },
        followee: currentUserId,
      },
    ],
  });

  const mappedRelationships = relationships.reduce((acc, relationship) => {
    const followerId = relationship.follower;
    const followeeId = relationship.followee;
    if (followeeId.equals(currentUserId)) {
      acc[followerId.toString()] = !acc[followerId.toString()]
        ? "followsCurrentUser"
        : "followEachOther";
    } else {
      acc[followeeId.toString()] = !acc[followeeId.toString()]
        ? "followedByCurrentUser"
        : "followEachOther";
    }
    return acc;
  }, {} as Record<string, any>);

  const fields = ["post", "repost", "reply"];

  const postsWithContent = populatedPosts.map((post) => {
    let temp = post.toJSON() as Record<string, any>;
    fields.forEach((field) => {
      if (temp[field]) {
        temp[field] = temp[field].toJSON() as Record<string, any>;
        temp[field].isLiked = likedPosts.some((like) =>
          like.target.equals(temp[field]._id)
        );
        temp[field].isReposted = repostedPosts.some((thread) =>
          thread.repost.equals(temp[field]._id)
        );
        temp[field].isBookmarked = bookmarkedPosts.some((bookmark) =>
          bookmark.target.equals(temp[field]._id)
        );
        temp[field].author = temp[field].author.toJSON() as Record<string, any>;
        temp[field].author.relationship =
          mappedRelationships[temp[field].author._id.toString()];
      }
    });
    return temp;
  });

  await Post.updateMany({ _id: { $in: postIds } }, { $inc: { viewCount: 1 } });

  return sendResponse(
    res,
    200,
    { posts: postsWithContent, totalPages, count },
    null,
    "Get Post List of Single User Successfully!"
  );
});
