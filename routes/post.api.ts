import express from "express";
import { joiValidate } from "../middlewares/validationMiddleware";
import {
  createPostSchema,
  createRepostOfPostSchema,
  deletePostSchema,
  getAllPostsSchema,
  getPostsOfFolloweesSchema,
  getPostsOfSingleUserSchema,
  getSinglePostSchema,
  undoRepostOfPostSchema,
  updatePostSchema,
} from "../validations/postSchema";
import {
  createNewPost,
  createRepostOfPost,
  deleteSinglePost,
  getAllOriginalPosts,
  getPostsOfSingleUser,
  getSinglePost,
  getThreadsOfFolloweesAndCurrentUser,
  undoRepostOfPost,
  updateSinglePost,
} from "../controllers/post.controller";

const router = express.Router();

/**
 * @route GET /posts/?page=1&limit=10
 * @description Get all posts of all users except posts of current user
 * @access Login required
 */

router.get("/", joiValidate(getAllPostsSchema, "query"), getAllOriginalPosts);

/**
 * @route GET /posts/followees?page=1&limit=10
 * @description Get all posts of users that the current user are following
 * @access Login required
 */

router.get(
  "/followees",
  joiValidate(getPostsOfFolloweesSchema, "query"),
  getThreadsOfFolloweesAndCurrentUser
);

/**
 * @route GET /posts/user/:userId?page=1&limit=10
 * @description Get all posts of a single user
 * @access Login required
 */

router.get(
  "/user/:userId",
  [
    joiValidate(getPostsOfSingleUserSchema, "params"),
    joiValidate(getPostsOfSingleUserSchema, "query"),
  ],
  getPostsOfSingleUser
);

/**
 * @route POST /posts
 * @description Create a new post
 * @body {content, mediaFile}
 * @access Login required
 */

router.post("/", joiValidate(createPostSchema, "body"), createNewPost);

/**
 * @route POST /posts/repost/
 * @description Create a repost of post
 * @body {repostType, repostId}
 * @access Login required
 */

router.post(
  "/repost",
  joiValidate(createRepostOfPostSchema, "body"),
  createRepostOfPost
);

/**
 * @route DELETE /posts/repost/
 * @description Delete a repost of post
 * @body {repostId}
 * @access Login required
 */

router.delete(
  "/repost",
  joiValidate(undoRepostOfPostSchema, "body"),
  undoRepostOfPost
);

/**
 * @route PUT /posts/:id
 * @description Update a post
 * @body {content, mediaFile}
 * @access Login required
 */

router.put(
  "/original/:id",
  [
    joiValidate(updatePostSchema, "params"),
    joiValidate(updatePostSchema, "body"),
  ],
  updateSinglePost
);

/**
 * @route GET /posts/:id
 * @description Get a single post
 * @access Login required
 */

router.get(
  "/original/:id",
  joiValidate(getSinglePostSchema, "params"),
  getSinglePost
);

/**
 * @route DELETE /posts/:id
 * @description Delete
 * @access Login required
 */

router.delete(
  "/original/:id",
  joiValidate(deletePostSchema, "params"),
  deleteSinglePost
);

export default router;
