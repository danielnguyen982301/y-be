const express = require("express");
const router = express.Router();
const {
  createUser,
  getUsers,
  getTaskListOfSingleUser,
} = require("../controllers/user.controller");
const {
  createUserValidations,
  getUsersValidations,
  getTaskListOfSingleUserValidations,
} = require("../validations/userValidations");
const validate = require("../middlewares/validationMiddleware");

/**
 * @route POST /users
 * @description Create a user
 */

router.post("/", createUserValidations, validate, createUser);

/**
 * @route GET /users
 * @description Get user list
 */

router.get("/", getUsersValidations, validate, getUsers);

/**
 * @route GET /users
 * @description Get a single user by ID and their task list
 */

router.get(
  "/:userId",
  getTaskListOfSingleUserValidations,
  validate,
  getTaskListOfSingleUser
);

module.exports = router;
