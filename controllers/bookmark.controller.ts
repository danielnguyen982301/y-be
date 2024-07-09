import mongoose, { Types } from "mongoose";
import { AppError, catchAsync, sendResponse } from "../helpers/utils";
import Bookmark from "../models/Bookmark";
import Like from "../models/Like";
import UserThread from "../models/UserThread";
import Follow from "../models/Follow";

const calculateBookmarkCount = async (
  targetId: Types.ObjectId,
  targetType: "Post" | "Reply"
) => {
  const bookmarkCount = await Bookmark.countDocuments({
    target: targetId,
    targetType,
  });
  await mongoose
    .model(targetType)
    .findByIdAndUpdate(targetId, { bookmarkCount });
  return bookmarkCount;
};

export const getBookmarks = catchAsync(async (req, res, next) => {
  const currentUserId = req.userId as Types.ObjectId;
  let { page, limit } = req.query as unknown as { page: number; limit: number };
  page = page || 1;
  limit = limit || 10;

  const filterConditions: Record<string, any>[] = [{ user: currentUserId }];

  const filterCriteria = filterConditions.length
    ? { $and: filterConditions }
    : {};

  const count = await Bookmark.countDocuments(filterCriteria);
  const totalPages = Math.ceil(count / limit);

  const bookmarks = await Bookmark.find(filterCriteria)
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip((page - 1) * limit)
    .populate("user");

  const populatedBookmarks = await Promise.all(
    bookmarks.map(async (bookmark) => {
      if (bookmark.targetType === "Reply") {
        return await bookmark.populate({
          path: "target",
          populate: [
            { path: "author" },
            { path: "target", populate: "author" },
          ],
        });
      } else
        return await bookmark.populate({ path: "target", populate: "author" });
    })
  );

  const targetIds = populatedBookmarks.map((bookmark) => bookmark.target._id);

  const likedTargets = await Like.find({
    author: currentUserId,
    target: { $in: targetIds },
  });

  const repostedTargets = await UserThread.find({
    user: currentUserId,
    repost: { $in: targetIds },
  });

  const authorIds = populatedBookmarks.map((bookmark) => {
    let temp = bookmark.toJSON() as Record<string, any>;
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

  const bookmarksWithContent = populatedBookmarks.map((bookmark) => {
    let temp = bookmark.toJSON() as Record<string, any>;
    temp.target.isLiked = likedTargets.some((liked) =>
      liked.target.equals(temp.target._id)
    );
    temp.target.isReposted = repostedTargets.some((thread) =>
      thread.repost.equals(temp.target._id)
    );
    temp.target.isBookmarked = true;
    temp.target.author = temp.target.author.toJSON() as Record<string, any>;
    temp.target.author.relationship =
      mappedRelationships[temp.target.author._id.toString()];
    return temp;
  });

  return sendResponse(
    res,
    200,
    { bookmarks: bookmarksWithContent, totalPages, count },
    null,
    "Get Bookmark List Successfully"
  );
});

export const createBookmark = catchAsync(async (req, res, next) => {
  const currentUserId = req.userId;
  const { targetType, targetId } = req.body;

  const targetObj = await mongoose.model(targetType).findById(targetId);
  if (!targetObj)
    throw new AppError(404, `${targetType} Not Found`, "Create Bookmark Error");

  let bookmark = await Bookmark.findOne({
    user: currentUserId,
    targetType,
    target: targetId,
  });
  if (bookmark)
    throw new AppError(
      409,
      `You already bookmarked this ${targetType}`,
      "Create Bookmark Error"
    );

  bookmark = await Bookmark.create({
    user: currentUserId,
    targetType,
    target: targetId,
  });

  const bookmarkCount = await calculateBookmarkCount(targetId, targetType);

  return sendResponse(
    res,
    200,
    { bookmark, bookmarkCount },
    null,
    "Save Bookmark Successfully"
  );
});

export const removeBookmark = catchAsync(async (req, res, next) => {
  const currentUserId = req.userId;
  const { targetType, targetId } = req.body;

  const targetObj = await mongoose.model(targetType).findById(targetId);
  if (!targetObj)
    throw new AppError(404, `${targetType} Not Found`, "Remove Bookmark Error");

  let bookmark = await Bookmark.findOne({
    user: currentUserId,
    targetType,
    target: targetId,
  });
  if (!bookmark)
    throw new AppError(404, `Bookmark Not Found`, "Remove Bookmark Error");

  await bookmark.delete();

  const bookmarkCount = await calculateBookmarkCount(targetId, targetType);

  return sendResponse(
    res,
    200,
    { bookmark, bookmarkCount },
    null,
    "Remove Bookmark Successfully"
  );
});
