import express from "express";
import { joiValidate } from "../middlewares/validationMiddleware";
import { createHashtag, getHashTags } from "../controllers/hashtag.controller";
import {
  createHashTagsSchema,
  getHashTagsSchema,
} from "../validations/hashtagSchema";

const router = express.Router();

/**
 * @route GET /hashtags
 * @description Get a list of hashtags
 * @access Login required
 */

router.get("/", joiValidate(getHashTagsSchema, "query"), getHashTags);

/**
 * @route POST /hashtags
 * @description Create hashtags for a post
 * @body {postId, hashtags}
 * @access Login required
 */

router.post("/", joiValidate(createHashTagsSchema, "body"), createHashtag);

export default router;
