import express from "express";
import { joiValidate } from "../middlewares/validationMiddleware";
import {
  createBookmark,
  getBookmarks,
  removeBookmark,
} from "../controllers/bookmark.controller";
import {
  createBookmarkSchema,
  getBookmarksSchema,
  removeBookmarkSchema,
} from "../validations/bookmarkSchema";

const router = express.Router();

/**
 * @route GET /bookmarks
 * @description Get a list of bookmarks
 * @access Login required
 */

router.get("/", joiValidate(getBookmarksSchema, "query"), getBookmarks);

/**
 * @route POST /hashtags
 * @description Create bookmark of a post or a reply
 * @body {targetType, targetId}
 * @access Login required
 */

router.post("/", joiValidate(createBookmarkSchema, "body"), createBookmark);

/**
 * @route DELETE /hashtags
 * @description Delete bookmark of a post or a reply
 * @body {targetType, targetId}
 * @access Login required
 */
router.delete("/", joiValidate(removeBookmarkSchema, "body"), removeBookmark);

export default router;
