import express from "express";

import { joiValidate } from "../middlewares/validationMiddleware";
import {
  createBookmarkSchema,
  getBookmarksSchema,
  removeBookmarkSchema,
} from "../validations/bookmarkSchema";
import { getBookmarks } from "../controllers/bookmark/getBookmarks";
import { createBookmark } from "../controllers/bookmark/createBookmark";
import { removeBookmark } from "../controllers/bookmark/removeBookmark";

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
