import mongoose, { Types } from "mongoose";

import { catchAsync, sendResponse } from "../../helpers/utils";
import Message from "../../models/Message";
import User from "../../models/User";

export const getChatUsers = catchAsync(async (req, res, next) => {
  const currentUserId = req.userId as Types.ObjectId;

  const messages = await Message.find({
    $or: [{ from: currentUserId }, { to: currentUserId }],
  });

  const mappedMessages = messages.reduce((acc, message) => {
    const sender = message.from;
    const recipient = message.to;
    const otherUser = sender.equals(currentUserId) ? recipient : sender;
    acc[otherUser.toString()] = !acc[otherUser.toString()]
      ? [message]
      : [...acc[otherUser.toString()], message];
    return acc;
  }, {} as Record<string, any>);

  const chatUserIds = Object.keys(mappedMessages).map(
    (userId) => new mongoose.Types.ObjectId(userId)
  );

  const chatUsers = await User.find({ _id: { $in: chatUserIds } });
  const chatUsersWithMessages = chatUsers.map((user) => {
    let temp = user.toJSON() as Record<string, any>;
    temp.messages = mappedMessages[user._id.toString()];
    return temp;
  });

  return sendResponse(
    res,
    200,
    { chatUsers: chatUsersWithMessages },
    null,
    "Get Chat User List Successfully"
  );
});
