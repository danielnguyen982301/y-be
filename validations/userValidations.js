const { body, query, param } = require("express-validator");

const createUserValidations = [
  body("name").notEmpty().trim().escape().withMessage("User name is required"),
];

const getUsersValidations = [
  query("page")
    .isInt()
    .withMessage("Page must be a number")
    .trim()
    .toInt()
    .escape()
    .optional(),
  query("limit")
    .isInt()
    .withMessage("Limit must be a number")
    .trim()
    .toInt()
    .escape()
    .optional(),
  query("name")
    .isString()
    .withMessage("Name must be a string")
    .trim()
    .escape()
    .optional(),
];

const getTaskListOfSingleUserValidations = [
  param("userId").isMongoId().withMessage("Invalid ID").trim().escape(),
];

module.exports = {
  createUserValidations,
  getUsersValidations,
  getTaskListOfSingleUserValidations,
};
