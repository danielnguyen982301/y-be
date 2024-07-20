import { AppError, catchAsync, sendResponse } from "../../helpers/utils";
import Message from "../../models/Message";
import User from "../../models/User";

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
