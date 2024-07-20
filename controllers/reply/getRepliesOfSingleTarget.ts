import mongoose, { Types } from "mongoose";

import { AppError, catchAsync, sendResponse } from "../../helpers/utils";
import Reply from "../../models/Reply";
import UserThread from "../../models/UserThread";
import Follow from "../../models/Follow";
import Like from "../../models/Like";
import Bookmark from "../../models/Bookmark";

export const getRepliesOfSingleTarget = catchAsync(async (req, res, next) => {
  const currentUserId = req.userId as Types.ObjectId;
  let { targetType, targetId } = req.params;
  targetType = targetType.charAt(0).toUpperCase() + targetType.slice(1);
  let { page, limit } = req.query as unknown as {
    page: number;
    limit: number;
  };

  page = page || 1;
  limit = limit || 10;

  const target = await mongoose.model(targetType).findById(targetId);
  if (!target)
    throw new AppError(404, `${targetType} Not Found`, "Get Replies Error");

  const count = await Reply.countDocuments({ targetType, target: targetId });
  const totalPages = Math.ceil(count / limit);

  const replies = await Reply.find({ targetType, target: targetId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(limit * (page - 1))
    .populate("author");

  const replyIds = replies.map((reply) => reply._id);

  const likedReplies = await Like.find({
    author: currentUserId,
    targetType: "Reply",
    target: { $in: replyIds },
  });

  const repostedReplies = await UserThread.find({
    user: currentUserId,
    repostType: "Reply",
    repost: { $in: replyIds },
  });

  const bookmarkedReplies = await Bookmark.find({
    user: currentUserId,
    targetType: "Reply",
    target: { $in: replyIds },
  });

  const authorIds = replies.map((reply) => reply.author._id);

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

  let repliesWithContent = replies.map((reply) => {
    let temp = reply.toJSON() as Record<string, any>;
    temp.isLiked = likedReplies.some((liked) => liked.target.equals(temp._id));
    temp.isReposted = repostedReplies.some((thread) =>
      thread.repost.equals(temp._id)
    );
    temp.isBookmarked = bookmarkedReplies.some((bookmark) =>
      bookmark.target.equals(temp._id)
    );
    temp.author = temp.author.toJSON() as Record<string, any>;
    temp.author.relationship = mappedRelationships[temp.author._id.toString()];
    return temp;
  });

  await Reply.updateMany(
    { _id: { $in: replyIds } },
    { $inc: { viewCount: 1 } }
  );

  return sendResponse(
    res,
    200,
    { replies: repliesWithContent, totalPages, count },
    null,
    "Get Replies Of Single Target Successfully"
  );
});
