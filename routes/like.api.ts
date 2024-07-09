import express from "express";
import { joiValidate } from "../middlewares/validationMiddleware";
import {
  getLikedTargetsOfSingleUserSchema,
  saveLikeSchema,
} from "../validations/likeSchema";
import {
  getLikedTargetsOfSingleUser,
  saveLike,
} from "../controllers/like.controller";

const router = express.Router();

/**
 * @route POST /likes
 * @description Save a like to a post or reply
 * @body {targetType: 'Post' or 'Reply', target}
 * @access Login required
 */

router.post("/", joiValidate(saveLikeSchema, "body"), saveLike);

/**
 * @route GET /likes/user/:userId
 * @description Get liked targets of single user
 * @access Login required
 */

router.get(
  "/user/:userId",
  [
    joiValidate(getLikedTargetsOfSingleUserSchema, "params"),
    joiValidate(getLikedTargetsOfSingleUserSchema, "query"),
  ],
  getLikedTargetsOfSingleUser
);

export default router;
