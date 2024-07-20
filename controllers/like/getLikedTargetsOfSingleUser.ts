import { Types } from "mongoose";

import { AppError, catchAsync, sendResponse } from "../../helpers/utils";
import Like from "../../models/Like";
import User from "../../models/User";
import UserThread from "../../models/UserThread";
import Bookmark from "../../models/Bookmark";
import Follow from "../../models/Follow";

export const getLikedTargetsOfSingleUser = catchAsync(
  async (req, res, next) => {
    const currentUserId = req.userId as Types.ObjectId;
    const { userId } = req.params as unknown as { userId: Types.ObjectId };
    let { page, limit } = req.query as unknown as {
      page: number;
      limit: number;
      [key: string]: any;
    };

    page = page || 1;
    limit = limit || 10;

    const user = await User.findById(userId);
    if (!user)
      throw new AppError(
        404,
        "User Not Found",
        "Get Posts of Single User Error"
      );

    const count = await Like.countDocuments({ author: userId });
    const totalPages = Math.ceil(count / limit);

    const likes = await Like.find({ author: userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit)
      .populate("author");

    const populatedLikes = await Promise.all(
      likes.map(async (like) => {
        if (like.targetType === "Reply") {
          return await like.populate({
            path: "target",
            populate: [
              { path: "author" },
              { path: "target", populate: "author" },
            ],
          });
        } else
          return await like.populate({ path: "target", populate: "author" });
      })
    );

    const targetIds = populatedLikes.map((like) => like.target._id);

    const likedTargets = await Like.find({
      author: currentUserId,
      target: { $in: targetIds },
    });

    const repostedTargets = await UserThread.find({
      user: currentUserId,
      repost: { $in: targetIds },
    });

    const bookmarkedTargets = await Bookmark.find({
      user: currentUserId,
      target: { $in: targetIds },
    });

    const authorIds = populatedLikes.map((like) => {
      let temp = like.toJSON() as Record<string, any>;
      return temp.target.author._id;
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

    const likesWithContent = populatedLikes.map((like) => {
      let temp = like.toJSON() as Record<string, any>;
      temp.target.isLiked = likedTargets.some((like) =>
        like.target.equals(temp.target._id)
      );
      temp.target.isReposted = repostedTargets.some((thread) =>
        thread.repost.equals(temp.target._id)
      );
      temp.target.isBookmarked = bookmarkedTargets.some((bookmark) =>
        bookmark.target.equals(temp.target._id)
      );
      temp.target.author = temp.target.author.toJSON() as Record<string, any>;
      temp.target.author.relationship =
        mappedRelationships[temp.target.author._id.toString()];
      return temp;
    });

    return sendResponse(
      res,
      200,
      { likes: likesWithContent, totalPages, count },
      null,
      "Get List Of Liked Targets Of Single User Successfully"
    );
  }
);
