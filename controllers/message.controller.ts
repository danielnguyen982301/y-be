import mongoose, { Types } from "mongoose";
import { AppError, catchAsync, sendResponse } from "../helpers/utils";
import Message from "../models/Message";
import User from "../models/User";

export const createNewMessage = catchAsync(async (req, res, next) => {
  const currentUserId = req.userId;
  const { content, to } = req.body;

  const targetUser = await User.findById(to);
  if (!targetUser)
    throw new AppError(404, `Target User Not Found`, "Create Message Error");

  const message = await Message.create({
    content,
    from: currentUserId,
    to,
  });

  return sendResponse(res, 200, message, null, "Create Message Successfully");
});

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

export const updateMessageStatus = catchAsync(async (req, res, next) => {
  const messageIds = req.body.messages;

  const messages = await Message.find({ _id: { $in: messageIds } });
  if (messages.length !== messageIds.length)
    throw new AppError(404, `Message Not Found`, "Update Message Status Error");

  const updatedStatusMessages = await Message.updateMany(
    { _id: { $in: messageIds } },
    { isRead: true },
    { new: true }
  );

  return sendResponse(
    res,
    200,
    updatedStatusMessages,
    null,
    "Create Message Successfully"
  );
});
