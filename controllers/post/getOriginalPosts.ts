import { Types } from "mongoose";

import Post from "../../models/Post";
import { catchAsync, sendResponse } from "../../helpers/utils";
import UserThread from "../../models/UserThread";
import Follow from "../../models/Follow";
import Like from "../../models/Like";
import Bookmark from "../../models/Bookmark";

export const getOriginalPosts = catchAsync(async (req, res, next) => {
  const currentUserId = req.userId as Types.ObjectId;
  let { page, limit, ...filter } = req.query as unknown as {
    page: number;
    limit: number;
    [key: string]: any;
  };

  page = page || 1;
  limit = limit || 10;

  const filterConditions: Record<string, any>[] = [
    { repost: { $eq: undefined } },
    { reply: { $eq: undefined } },
  ];

  if (filter.ignoreCurrent) {
    filterConditions.push({ user: { $ne: currentUserId } });
  }

  if (filter.searchText) {
    const searchedPosts = await Post.find({
      content: { $regex: filter.searchText, $options: "i" },
    });
    const searchPostIds = searchedPosts.map((post) => post._id);
    filterConditions.push({ post: { $in: searchPostIds } });
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
    .populate({ path: "post", populate: { path: "author" } })
    .populate("user");

  const postIds = posts.map((post) => post.post);

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
    return temp.post.author._id;
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

  const fields = ["post"];

  let postsWithContent = posts.map((post) => {
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
    "Get All Original Posts Successfully!"
  );
});
