import { Types } from "mongoose";

import { catchAsync, sendResponse } from "../../helpers/utils";
import User from "../../models/User";
import Follow from "../../models/Follow";

export const getUsers = catchAsync(async (req, res, next) => {
  const currentUserId = req.userId as Types.ObjectId;
  let { page, limit, ...filter } = req.query as unknown as {
    page: number;
    limit: number;
    [key: string]: any;
  };

  page = page || 1;
  limit = limit || 10;

  const filterConditions: Record<string, any>[] = [{ isDeleted: false }];

  if (filter.searchText) {
    filterConditions.push({
      $or: [
        {
          username: { $regex: filter.searchText, $options: "i" },
        },
        { displayName: { $regex: filter.searchText, $options: "i" } },
      ],
    });
  }

  const filterCriteria = filterConditions.length
    ? { $and: filterConditions }
    : {};

  const count = await User.countDocuments(filterCriteria);
  const totalPages = Math.ceil(count / limit);

  const users = await User.find(filterCriteria)
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip((page - 1) * limit);

  const userIds = users.map((user) => user._id);

  const relationships = await Follow.find({
    $or: [
      { follower: currentUserId, followee: { $in: userIds } },
      {
        follower: { $in: userIds },
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

  const usersWithRelationship = users.map((user) => {
    let temp = user.toJSON() as Record<string, any>;
    temp.relationship = mappedRelationships[user._id.toString()];
    return temp;
  });

  return sendResponse(
    res,
    200,
    { users: usersWithRelationship, totalPages, count },
    null,
    "Get User List Successfully!"
  );
});
