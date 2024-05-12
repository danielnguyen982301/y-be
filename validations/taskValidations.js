const { body, query, param } = require("express-validator");

const createTaskValidations = [
  body("name").notEmpty().trim().escape().withMessage("Task name is required"),
  body("description")
    .notEmpty()
    .trim()
    .escape()
    .withMessage("Task description is required"),
];

const getTasksValidations = [
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
  query("description")
    .isString()
    .withMessage("Description must be a string")
    .trim()
    .escape()
    .optional(),
];

const getSingleTaskValidations = [
  param("taskId").isMongoId().withMessage("Invalid ID").trim().escape(),
];

const updateTaskValidations = [
  param("taskId").isMongoId().withMessage("Invalid ID").trim().escape(),
  body("name")
    .notEmpty()
    .trim()
    .escape()
    .withMessage("Task name is required")
    .optional(),
  body("description")
    .notEmpty()
    .trim()
    .escape()
    .withMessage("Task description is required")
    .optional(),
  body("status")
    .isIn(["pending", "working", "review", "done", "archive"])
    .withMessage("Invalid status")
    .trim()
    .escape()
    .optional(),
  body("assignee")
    .isMongoId()
    .withMessage("Invalid ID")
    .trim()
    .escape()
    .optional({ checkFalsy: true }),
];

const deleteTaskValidations = [
  param("taskId").isMongoId().withMessage("Invalid ID").trim().escape(),
];

module.exports = {
  createTaskValidations,
  getTasksValidations,
  getSingleTaskValidations,
  updateTaskValidations,
  deleteTaskValidations,
};
