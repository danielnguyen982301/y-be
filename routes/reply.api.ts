import express from "express";
import { joiValidate } from "../middlewares/validationMiddleware";
import {
  createReplySchema,
  createRepostOfReplySchema,
  deleteReplySchema,
  getRepliesOfSingleTargetSchema,
  getRepliesOfSingleUserSchema,
  getSingleReplytSchema,
  undoRepostOfReplySchema,
  updateReplySchema,
} from "../validations/replySchema";
import {
  createNewReply,
  createRepostOfReply,
  deleteSingleReply,
  getRepliesOfSingleTarget,
  getRepliesOfSingleUser,
  getSingleReply,
  undoRepostOfReply,
  updateSingleReply,
} from "../controllers/reply.controller";

const router = express.Router();

/**
 * @route POST /replies
 * @description Create a new reply
 * @body {content, mediaFile, targetType, targetId}
 * @access Login required
 */

router.post("/", joiValidate(createReplySchema, "body"), createNewReply);

/**
 * @route GET /replies/:targetType/:targetId?page=1&limit=10
 * @description Get replies of a post or a reply
 * @access Login required
 */

router.get(
  "/target/:targetType/:targetId",
  [
    joiValidate(getRepliesOfSingleTargetSchema, "params"),
    joiValidate(getRepliesOfSingleTargetSchema, "query"),
  ],
  getRepliesOfSingleTarget
);

/**
 * @route GET /replies/user/:userId?page=1&limit=10
 * @description Get replies of a post or a reply
 * @access Login required
 */

router.get(
  "/user/:userId",
  [
    joiValidate(getRepliesOfSingleUserSchema, "params"),
    joiValidate(getRepliesOfSingleUserSchema, "query"),
  ],
  getRepliesOfSingleUser
);

/**
 * @route PUT /replies/:id
 * @description Update a reply
 * @body {content, mediaFile}
 * @access Login required
 */

router.put(
  "/original/:id",
  [
    joiValidate(updateReplySchema, "params"),
    joiValidate(updateReplySchema, "body"),
  ],
  updateSingleReply
);

/**
 * @route DELETE /replies/:id
 * @description Delete a reply
 * @access Login required
 */

router.delete(
  "/original/:id",
  joiValidate(deleteReplySchema, "params"),
  deleteSingleReply
);

/**
 * @route GET /replies/:id
 * @description Get details of a reply
 * @access Login required
 */

router.get(
  "/original/:id",
  joiValidate(getSingleReplytSchema, "params"),
  getSingleReply
);

/**
 * @route POST /replies/repost/
 * @description Create a repost of reply
 * @body {repostType, repostId}
 * @access Login required
 */

router.post(
  "/repost",
  joiValidate(createRepostOfReplySchema, "body"),
  createRepostOfReply
);

/**
 * @route DELETE /replies/repost/
 * @description Delete a repost of reply
 * @body {repostId}
 * @access Login required
 */

router.delete(
  "/repost",
  joiValidate(undoRepostOfReplySchema, "body"),
  undoRepostOfReply
);

export default router;
