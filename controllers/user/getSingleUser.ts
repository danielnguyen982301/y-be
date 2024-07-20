import { AppError, catchAsync, sendResponse } from "../../helpers/utils";
import User from "../../models/User";
import Follow from "../../models/Follow";

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
