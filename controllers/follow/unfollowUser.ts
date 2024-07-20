import { Types } from "mongoose";

import { AppError, catchAsync, sendResponse } from "../../helpers/utils";
import Follow from "../../models/Follow";
import Notification from "../../models/Notification";
import { calculateFollowCount } from "./followUser";

export const unfollowUser = catchAsync(async (req, res, next) => {
  const currentUserId = req.userId as Types.ObjectId;
  const targetUserId = req.body.followeeId as unknown as Types.ObjectId;

  const follow = await Follow.findOne({
    follower: currentUserId,
    followee: targetUserId,
  });
  if (!follow) throw new AppError(404, "Follow Not Found", "Unfollow Error");

  let notif = await Notification.findOneAndDelete({
    sender: currentUserId,
    event: "follow",
    recipient: targetUserId,
  }).populate("sender");

  await follow.delete();

  await calculateFollowCount(currentUserId, targetUserId);

  return sendResponse(
    res,
    200,
    { follow, notif },
    null,
    "Unfollow Successfully"
  );
});
