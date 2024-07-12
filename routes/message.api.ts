import express from "express";
import { joiValidate } from "../middlewares/validationMiddleware";
import {
  createMessageSchema,
  getSingleChatUserSchema,
  updateMessageStatusSchema,
} from "../validations/messageSchema";
import {
  createNewMessage,
  getChatUsers,
  getSingleChatUser,
  updateMessageStatus,
} from "../controllers/message.controller";

const router = express.Router();

/**
 * @route POST /messages
 * @description Create a new message
 * @body {content, to: userId}
 * @access Login required
 */

router.post("/", joiValidate(createMessageSchema, "body"), createNewMessage);

/**
 * @route GET /messages/users
 * @description Get a list of chat users of the current user
 * @access Login required
 */

router.get("/users", getChatUsers);

/**
 * @route GET /messages/users/:userId
 * @description Get single chat user of the current user
 * @access Login required
 */

router.get(
  "/users/:userId",
  joiValidate(getSingleChatUserSchema, "params"),
  getSingleChatUser
);

/**
 * @route PUT /messages/status
 * @description Update status of messages , {isRead: true}
 * @body {messages: []}
 * @access Login required
 */

router.put(
  "/status",
  joiValidate(updateMessageStatusSchema, "body"),
  updateMessageStatus
);

export default router;
