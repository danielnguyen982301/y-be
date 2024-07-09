import express from "express";
import { joiValidate } from "../middlewares/validationMiddleware";
import {
  createUserSchema,
  getSingleUserSchema,
  getUsersSchema,
  updateUserProfileSchema,
} from "../validations/userSchema";
import {
  getCurrentUser,
  getSingleUser,
  getUsers,
  register,
  updateProfile,
} from "../controllers/user.controller";
import { loginRequired } from "../middlewares/authentication";

const router = express.Router();

/**
 * @route POST /users
 * @description Register new user
 * @body {username, displayName, email, password}
 * @access Public
 */

router.post("/", joiValidate(createUserSchema, "body"), register);

/**
 * @route GET /users?page=1&limit=10
 * @description Get users with pagination
 * @access Login required
 */

router.get("/", loginRequired, joiValidate(getUsersSchema, "query"), getUsers);

/**
 * @route GET /users/me
 * @description Get current user info
 * @access Login required
 */

router.get("/me", loginRequired, getCurrentUser);

/**
 * @route GET /users/:username
 * @description Get a user profile
 * @access Login required
 */

router.get(
  "/:username",
  loginRequired,
  joiValidate(getSingleUserSchema, "params"),
  getSingleUser
);

/**
 * @route PUT /users/:id
 * @description Update user profile
 * @body {displayName, avatar, header, bio, location}
 * @access Login required
 */

router.put(
  "/:id",
  loginRequired,
  [
    joiValidate(updateUserProfileSchema, "params"),
    joiValidate(updateUserProfileSchema, "body"),
  ],
  updateProfile
);

export default router;
