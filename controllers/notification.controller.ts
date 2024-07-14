import mongoose from "mongoose";
import { AppError, catchAsync, sendResponse } from "../helpers/utils";
import Notification from "../models/Notification";
import { Types } from "mongoose";
import Like from "../models/Like";
import UserThread from "../models/UserThread";
import Bookmark from "../models/Bookmark";
import Follow from "../models/Follow";

export const createMentionNotification = catchAsync(async (req, res, next) => {
  const currentUserId = req.userId as Types.ObjectId;
  const { mentionLocationType, mentionLocation, mentionedTargets } = req.body;

  const targetObj = await mongoose
    .model(mentionLocationType)
    .findById(mentionLocation);
  if (!targetObj)
    throw new AppError(
      404,
      `${mentionLocationType} Not Found`,
      "Create Mention Notification Error"
    );

  const transformedIds = mentionedTargets.map(
    (userId: string) => new mongoose.Types.ObjectId(userId)
  );

  const mentionedTargetsWithoutCurrentUser = transformedIds.filter(
    (target: Types.ObjectId) => !target.equals(currentUserId)
  );

  const notifs = await Promise.all(
    mentionedTargetsWithoutCurrentUser.map(async (target: Types.ObjectId) => {
      return await Notification.create({
        sender: currentUserId,
        event: "mention",
        recipient: target,
        mentionLocationType,
        mentionLocation,
      });
    })
  );

  return sendResponse(
    res,
    200,
    notifs,
    null,
    "Create Mention Notification Successfully"
  );
});

export const getNotifications = catchAsync(async (req, res, next) => {
  const currentUserId = req.userId as Types.ObjectId;

  const notifications = await Notification.find({
    recipient: currentUserId,
  })
    .sort({ createdAt: -1 })
    .populate("sender")
    .populate("mentionLocation")
    .populate("repost")
    .populate({
      path: "reply",
      populate: [{ path: "author" }, { path: "target", populate: "author" }],
    });

  const populatedNotifs = await Promise.all(
    notifications.map(async (notif) => {
      if (notif.mentionLocationType === "Post") {
        return await notif.populate({
          path: "mentionLocation",
          populate: "author",
        });
      } else if (notif.mentionLocationType === "Reply") {
        return await notif.populate({
          path: "mentionLocation",
          populate: [
            { path: "author" },
            { path: "target", populate: "author" },
          ],
        });
      } else if (notif.repostType === "Post") {
        return await notif.populate({ path: "repost", populate: "author" });
      } else if (notif.repostType === "Reply") {
        return await notif.populate({
          path: "repost",
          populate: [
            { path: "author" },
            { path: "target", populate: "author" },
          ],
        });
      }
      return notif;
    })
  );

  const objectIds = populatedNotifs
    .filter((notif) => notif.event !== "follow")
    .map(
      (notif) =>
        notif.mentionLocation?._id || notif.repost?._id || notif.reply?._id
    );

  const likedObjects = await Like.find({
    author: currentUserId,
    target: { $in: objectIds },
  });

  const repostedObjects = await UserThread.find({
    user: currentUserId,
    repost: { $in: objectIds },
  });

  const bookmarkedObjects = await Bookmark.find({
    user: currentUserId,
    target: { $in: objectIds },
  });

  const authorIds = populatedNotifs
    .filter((notif) => notif.event !== "follow")
    .map((notif) => {
      let temp = notif.toJSON() as Record<string, any>;
      return temp.mentionLocation
        ? temp.mentionLocation.author._id
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

  const fields = ["mentionLocation", "repost", "reply"];

  const notifsWithContent = populatedNotifs.map((notif) => {
    let temp = notif.toJSON() as Record<string, any>;
    fields.forEach((field) => {
      if (temp[field]) {
        temp[field] = temp[field].toJSON() as Record<string, any>;
        temp[field].isLiked = likedObjects.some((like) =>
          like.target.equals(temp[field]._id)
        );
        temp[field].isReposted = repostedObjects.some((thread) =>
          thread.repost.equals(temp[field]._id)
        );
        temp[field].isBookmarked = bookmarkedObjects.some((bookmark) =>
          bookmark.target.equals(temp[field]._id)
        );
        temp[field].author = temp[field].author.toJSON() as Record<string, any>;
        temp[field].author.relationship =
          mappedRelationships[temp[field].author._id.toString()];
      }
    });
    return temp;
  });

  return sendResponse(
    res,
    200,
    { notifs: notifsWithContent },
    null,
    "Get Notification List Successfully"
  );
});

export const updateNotificationStatus = catchAsync(async (req, res, next) => {
  const notifIds = req.body.notifs;

  const notifs = await Notification.find({ _id: { $in: notifIds } });
  if (notifs.length !== notifIds.length)
    throw new AppError(
      404,
      `Notification Not Found`,
      "Update Notification Status Error"
    );

  const updatedStatusNotifs = await Notification.updateMany(
    { _id: { $in: notifIds } },
    { isRead: true },
    { new: true }
  );

  return sendResponse(
    res,
    200,
    updatedStatusNotifs,
    null,
    "Update Notification Status Successfully"
  );
});
