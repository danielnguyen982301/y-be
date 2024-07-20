import { Types } from "mongoose";

import Post from "../../models/Post";
import { catchAsync, sendResponse } from "../../helpers/utils";
import UserThread from "../../models/UserThread";
import Follow from "../../models/Follow";
import Like from "../../models/Like";
import Bookmark from "../../models/Bookmark";

export const getThreadsOfFollowees = catchAsync(async (req, res, next) => {
  const currentUserId = req.userId as Types.ObjectId;
  let { page, limit } = req.query as unknown as {
    page: number;
    limit: number;
  };

  let followList = await Follow.find({
    follower: currentUserId,
  });

  const followeeIDs = [
    ...followList.map((follow) => follow.followee),
    currentUserId,
  ];

  page = page || 1;
  limit = limit || 10;

  const filterConditions = [{ user: { $in: followeeIDs } }];

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
    .populate({ path: "repost", populate: "author" })
    .populate({
      path: "reply",
      populate: [{ path: "author" }, { path: "target", populate: "author" }],
    });

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

  const postIds = posts.map((post) => post.post || post.repost || post.reply);

  const likedPosts = await Like.find({
    author: currentUserId,
    target: { $in: postIds },
  });

  const repostedPosts = await UserThread.find({
    user: currentUserId,
    repost: { $in: postIds },
  });

  const bookmarkedPosts = await Bookmark.find({
    user: currentUserId,
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
    "Get Thread List of Followees Successfully!"
  );
});
