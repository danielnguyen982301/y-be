import { Types } from "mongoose";

import { AppError, catchAsync, sendResponse } from "../../helpers/utils";
import Reply from "../../models/Reply";

export const updateSingleReply = catchAsync(async (req, res, next) => {
  const currentUserId = req.userId as Types.ObjectId;
  const replyId = req.params.id;

  let reply = await Reply.findById(replyId);
  if (!reply) throw new AppError(404, "Reply Not Found", "Update Reply Error");
  if (!reply.author.equals(currentUserId))
    throw new AppError(403, "User Not Authorized", "Update Reply Error");

  const allows: ("content" | "mediaFile")[] = ["content", "mediaFile"];

  allows.forEach((field) => {
    if (req.body[field] !== undefined) {
      reply[field] = req.body[field];
    }
  });
  await reply.save();

  return sendResponse(res, 200, reply, null, "Update Reply Successfully");
});
