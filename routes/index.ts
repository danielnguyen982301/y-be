import express from "express";
import authAPI from "./auth.api";
import userAPI from "./user.api";
import postAPI from "./post.api";
import replyAPI from "./reply.api";
import likeAPI from "./like.api";
import followAPI from "./follow.api";
import hashtagAPI from "./hashtag.api";
import bookmarkAPI from "./bookmark.api";
import messageAPI from "./message.api";
import { loginRequired } from "../middlewares/authentication";

const router = express.Router();

// authAPI
router.use("/auth", authAPI);

// userAPI
router.use("/users", userAPI);

// postAPI
router.use("/posts", loginRequired, postAPI);

// replyAPI
router.use("/replies", loginRequired, replyAPI);

// likeAPI
router.use("/likes", loginRequired, likeAPI);

// followAPI
router.use("/follows", loginRequired, followAPI);

//hashtagAPI
router.use("/hashtags", loginRequired, hashtagAPI);

//bookmarkAPI
router.use("/bookmarks", loginRequired, bookmarkAPI);

//bookmarkAPI
router.use("/messages", loginRequired, messageAPI);

export default router;
