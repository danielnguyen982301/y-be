import { Types } from "mongoose";

import { AppError, catchAsync, sendResponse } from "../../helpers/utils";
import Message from "../../models/Message";
import User from "../../models/User";

export const getSingleChatUser = catchAsync(async (req, res, next) => {
  const currentUserId = req.userId as Types.ObjectId;
  const chatUserId = req.params.userId;

  const chatUser = await User.findById(chatUserId);
  if (!chatUser)
    throw new AppError(
      404,
      "Chat User Not Found",
      "Get Single Chat User Error"
    );

  const messages = await Message.find({
    $or: [
      { from: currentUserId, to: chatUserId },
      { from: chatUserId, to: currentUserId },
    ],
  });

  const chatUserWithMessages = chatUser.toJSON() as Record<string, any>;
  chatUserWithMessages.messages = messages;

  return sendResponse(
    res,
    200,
    chatUserWithMessages,
    null,
    "Get Single Chat User Successfully"
  );
});
