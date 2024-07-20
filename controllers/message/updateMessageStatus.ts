import { AppError, catchAsync, sendResponse } from "../../helpers/utils";
import Message from "../../models/Message";

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
    "Update Message Status Successfully"
  );
});
