import { Types } from "mongoose";

import { catchAsync, sendResponse } from "../../helpers/utils";
import User from "../../models/User";
import Follow from "../../models/Follow";

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
