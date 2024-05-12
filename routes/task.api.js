const express = require("express");
const {
  createTaskValidations,
  getTasksValidations,
  getSingleTaskValidations,
  updateTaskValidations,
  deleteTaskValidations,
} = require("../validations/taskValidations");
const {
  createTask,
  getTasks,
  getSingleTask,
  updateTask,
  deleteTask,
} = require("../controllers/task.controller");
const validate = require("../middlewares/validationMiddleware");
const router = express.Router();

/**
 * @route POST /tasks
 * @description Create a task
 */

router.post("/", createTaskValidations, validate, createTask);

/**
 * @route GET /tasks
 * @description Get task list
 */

router.get("/", getTasksValidations, validate, getTasks);

/**
 * @route GET /tasks/:taskId
 * @description Get single task by ID
 */

router.get("/:taskId", getSingleTaskValidations, validate, getSingleTask);

/**
 * @route PUT /tasks/:taskId
 * @description Update task, including update status and assign/ unassign task
 */

router.put("/:taskId", updateTaskValidations, validate, updateTask);

/**
 * @route DELETE /tasks/:taskId
 * @description Soft delete a task
 */

router.delete("/:taskId", deleteTaskValidations, validate, deleteTask);

module.exports = router;
