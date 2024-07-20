import { Types } from "mongoose";

import Friend from "../../models/Follow";
import { AppError, catchAsync, sendResponse } from "../../helpers/utils";
import User from "../../models/User";
import Follow from "../../models/Follow";
import Notification from "../../models/Notification";

export const calculateFollowCount = async (
  followerId: Types.ObjectId,
  followeeId: Types.ObjectId
) => {
  const followingCount = await Follow.countDocuments({
    follower: followerId,
  });
  const followerCount = await Follow.countDocuments({
    followee: followeeId,
  });
  await User.findByIdAndUpdate(followerId, { followingCount });
  await User.findByIdAndUpdate(followeeId, { followerCount });
};

export const followUser = catchAsync(async (req, res, next) => {
  const currentUserId = req.userId as Types.ObjectId;
  const targetUserId = req.body.followeeId as Types.ObjectId;

  const user = await User.findById(targetUserId);
  if (!user) throw new AppError(404, "User Not Found", "Follow Error");

  let follow = await Friend.findOne({
    follower: currentUserId,
    followee: targetUserId,
  });

  if (!follow) {
    follow = await Follow.create({
      follower: currentUserId,
      followee: targetUserId,
    });
  } else {
    throw new AppError(400, "You already followed this user", "Follow Error");
  }

  let notif = await Notification.create({
    sender: currentUserId,
    event: "follow",
    recipient: targetUserId,
  });

  follow = await follow.populate("follower");

  notif = await notif.populate("sender");

  await calculateFollowCount(currentUserId, targetUserId);

  return sendResponse(res, 200, { follow, notif }, null, "Follow Successfully");
});
