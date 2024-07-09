import bcrypt from "bcryptjs";
import { AppError, catchAsync, sendResponse } from "../helpers/utils";
import User from "../models/User";
import { Types } from "mongoose";
import Follow from "../models/Follow";

export const register = catchAsync(async (req, res, next) => {
  let { username, displayName, email, password } = req.body;

  let user = await User.findOne({ $or: [{ email }, { username }] });
  if (user)
    throw new AppError(
      409,
      "User with this email or username already exists",
      "Registration Error"
    );

  const salt = await bcrypt.genSalt(10);
  password = await bcrypt.hash(password, salt);
  user = await User.create({ username, displayName, email, password });
  const accessToken = user.generateToken();

  return sendResponse(
    res,
    200,
    { user, accessToken },
    null,
    "Create User Successfully!"
  );
});

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

export const getCurrentUser = catchAsync(async (req, res, next) => {
  const currentUserId = req.userId;

  const user = await User.findById(currentUserId);
  if (!user)
    throw new AppError(404, "User Not Found", "Get Current User Error");

  return sendResponse(res, 200, user, null, "Get Current User Successfully");
});

export const getSingleUser = catchAsync(async (req, res, next) => {
  const currentUserId = req.userId;
  const username = req.params.username;

  let user = await User.findOne({ username });
  if (!user) throw new AppError(404, "User Not Found", "Get Single User Error");

  const relationship = await Follow.find({
    $or: [
      { follower: currentUserId, followee: user._id },
      {
        follower: user._id,
        followee: currentUserId,
      },
    ],
  });

  const userWithRelationship = user.toJSON() as Record<string, any>;
  userWithRelationship.relationship = !relationship.length
    ? undefined
    : relationship.length === 2
    ? "followEachOther"
    : relationship[0].follower.equals(user._id)
    ? "followsCurrentUser"
    : "followedByCurrentUser";

  return sendResponse(
    res,
    200,
    userWithRelationship,
    null,
    "Get Single User Successfully"
  );
});

export const updateProfile = catchAsync(async (req, res, next) => {
  const currentUserId = req.userId;
  const userId = req.params.id as unknown as Types.ObjectId;

  if (currentUserId !== userId)
    throw new AppError(403, "Permission Required", "Update User Error");

  let user = await User.findById(userId);
  if (!user) throw new AppError(404, "User Not Found", "Update User Error");

  const allows: ("displayName" | "avatar" | "header" | "bio" | "location")[] = [
    "displayName",
    "avatar",
    "header",
    "bio",
    "location",
  ];

  allows.forEach((field) => {
    if (req.body[field] !== undefined) {
      user[field] = req.body[field];
    }
  });
  await user.save();

  // user = await User.findByIdAndUpdate(userId, req.body, { new: true });

  return sendResponse(res, 200, user, null, "Update User Successfully");
});
