import { Types } from "mongoose";

import { catchAsync, sendResponse } from "../../helpers/utils";
import User from "../../models/User";
import Follow from "../../models/Follow";

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
