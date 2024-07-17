import { Types } from "mongoose";
import Friend from "../models/Follow";
import { AppError, catchAsync, sendResponse } from "../helpers/utils";
import User from "../models/User";
import Follow from "../models/Follow";
import Notification from "../models/Notification";

const calculateFollowCount = async (
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

export const getFollowerList = catchAsync(async (req, res, next) => {
  const currentUserId = req.userId as Types.ObjectId;
  const selectedUserId = req.params.userId as unknown as Types.ObjectId;
  let { page, limit } = req.query as unknown as {
    page: number;
    limit: number;
    [key: string]: any;
  };

  let followList = await Follow.find({
    followee: selectedUserId,
  });

  const followerIDs = followList.map((follow) => follow.follower);

  const filterConditions: Record<string, any>[] = [
    { isDeleted: false },
    { _id: { $in: followerIDs } },
  ];

  const filterCriteria = filterConditions.length
    ? { $and: filterConditions }
    : {};

  page = page || 1;
  limit = limit || 10;

  const count = await User.countDocuments(filterCriteria);
  const totalPages = Math.ceil(count / limit);

  const followers = await User.find(filterCriteria)
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip((page - 1) * limit);

  const relationshipsWithCurrentUser = await Follow.find({
    $or: [
      {
        follower: currentUserId,
        followee: { $in: followerIDs },
      },
      {
        follower: { $in: followerIDs },
        followee: currentUserId,
      },
    ],
  });

  const mappedRelationships = relationshipsWithCurrentUser.reduce(
    (acc, relationship) => {
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
    },
    {} as Record<string, any>
  );

  const followersAndRelationshipsWithCurrentUser = followers.map((follower) => {
    let temp = follower.toJSON() as Record<string, any>;
    temp.relationship = mappedRelationships[follower._id.toString()];
    return temp;
  });

  return sendResponse(
    res,
    200,
    { users: followersAndRelationshipsWithCurrentUser, totalPages, count },
    null,
    "Get Follower List Successfully!"
  );
});

export const getFolloweeList = catchAsync(async (req, res, next) => {
  const currentUserId = req.userId as Types.ObjectId;
  const selectedUserId = req.params.userId as unknown as Types.ObjectId;
  let { page, limit } = req.query as unknown as {
    page: number;
    limit: number;
    [key: string]: any;
  };

  let followList = await Follow.find({
    follower: selectedUserId,
  });

  const followeeIDs = followList.map((follow) => follow.followee);

  const filterConditions: Record<string, any>[] = [
    { isDeleted: false },
    { _id: { $in: followeeIDs } },
  ];

  const filterCriteria = filterConditions.length
    ? { $and: filterConditions }
    : {};

  page = page || 1;
  limit = limit || 10;

  const count = await User.countDocuments(filterCriteria);
  const totalPages = Math.ceil(count / limit);

  const followees = await User.find(filterCriteria)
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip((page - 1) * limit);

  const relationshipsWithCurrentUser = await Follow.find({
    $or: [
      {
        follower: currentUserId,
        followee: { $in: followeeIDs },
      },
      {
        follower: { $in: followeeIDs },
        followee: currentUserId,
      },
    ],
  });

  const mappedRelationships = relationshipsWithCurrentUser.reduce(
    (acc, relationship) => {
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
    },
    {} as Record<string, any>
  );

  const followeesAndRelationshipsWithCurrentUser = followees.map((followee) => {
    let temp = followee.toJSON() as Record<string, any>;
    temp.relationship = mappedRelationships[followee._id.toString()];
    return temp;
  });

  return sendResponse(
    res,
    200,
    { users: followeesAndRelationshipsWithCurrentUser, totalPages, count },
    null,
    "Get Followee List Successfully!"
  );
});
