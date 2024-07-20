import { AppError, catchAsync, sendResponse } from "../../helpers/utils";
import Notification from "../../models/Notification";

export const updateNotificationStatus = catchAsync(async (req, res, next) => {
  const notifIds = req.body.notifs;

  const notifs = await Notification.find({ _id: { $in: notifIds } });
  if (notifs.length !== notifIds.length)
    throw new AppError(
      404,
      `Notification Not Found`,
      "Update Notification Status Error"
    );

  const updatedStatusNotifs = await Notification.updateMany(
    { _id: { $in: notifIds } },
    { isRead: true },
    { new: true }
  );

  return sendResponse(
    res,
    200,
    updatedStatusNotifs,
    null,
    "Update Notification Status Successfully"
  );
});
