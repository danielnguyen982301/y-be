import express from "express";

import { joiValidate } from "../middlewares/validationMiddleware";
import {
  createFollowSchema,
  getFolloweeListSchema,
  getFollowerListSchema,
  unfollowSchema,
} from "../validations/followSchema";
import { followUser } from "../controllers/follow/followUser";
import { unfollowUser } from "../controllers/follow/unfollowUser";
import { getFollowerList } from "../controllers/follow/getFollowerList";
import { getFolloweeList } from "../controllers/follow/getFolloweeList";

const router = express.Router();

/**
 * @route POST /follows
 * @description Follow user
 * @body {followeeId: targetUserId}
 * @access Login required
 */

router.post("/", joiValidate(createFollowSchema, "body"), followUser);

/**
 * @route DELETE /follows/
 * @description Unfollow user
 * @body {followeeId: targetUserId}
 * @access Login required
 */

router.delete("/", joiValidate(unfollowSchema, "body"), unfollowUser);

/**
 * @route GET /follows/:userId/followers
 * @description Get a list of followers of user
 * @access Login required
 */

router.get(
  "/:userId/followers",
  [
    joiValidate(getFollowerListSchema, "params"),
    joiValidate(getFollowerListSchema, "query"),
  ],
  getFollowerList
);

/**
 * @route GET /follows/:userId/followees
 * @description Get a list of sent pending requests
 * @access Login required
 */

router.get(
  "/:userId/followees",
  [
    joiValidate(getFolloweeListSchema, "params"),
    joiValidate(getFolloweeListSchema, "query"),
  ],
  getFolloweeList
);

export default router;
