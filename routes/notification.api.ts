import express from "express";
import { joiValidate } from "../middlewares/validationMiddleware";
import {
  createMentionNotifSchema,
  updateNotifStatusSchema,
} from "../validations/notificationSchema";
import {
  createMentionNotification,
  getNotifications,
  updateNotificationStatus,
} from "../controllers/notification.controller";

const router = express.Router();

/**
 * @route POST /notifications/mentions
 * @description Create a new notification for mentions
 * @body {mentionLocationType: 'Post' | 'Reply, mentionLocation: postId | ReplyId, mentionedTargets: [userId]}
 * @access Login required
 */

router.post(
  "/mentions",
  joiValidate(createMentionNotifSchema, "body"),
  createMentionNotification
);

/**
 * @route GET /notifications
 * @description Get a list of notifications of the current user
 * @access Login required
 */

router.get("/", getNotifications);

/**
 * @route PUT /notifications/status
 * @description Update status of notifications , {isRead: true}
 * @body {notifs: [notifId]}
 * @access Login required
 */

router.put(
  "/status",
  joiValidate(updateNotifStatusSchema, "body"),
  updateNotificationStatus
);

export default router;
