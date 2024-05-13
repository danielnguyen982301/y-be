const mongoose = require("mongoose");
const Task = require("../models/Task");
const { validationResult } = require("express-validator");
const { sendResponse, AppError } = require("../helpers/utils");
const User = require("../models/User");
const taskController = {};

taskController.createTask = async (req, res, next) => {
  try {
    const { name, description } = req.body;

    const newTask = await Task.create({
      name,
      description,
    });
    sendResponse(
      res,
      200,
      { task: newTask },
      null,
      "Create Task Successfully!"
    );
  } catch (err) {
    next(err);
  }
};

taskController.getTasks = async (req, res, next) => {
  const allowedQuery = ["page", "limit", "name", "description", "status"];

  try {
    let { page, limit, ...filterQuery } = req.query;
    page = page || 1;
    limit = limit || 10;

    const filterKeys = Object.keys(filterQuery);
    filterKeys.forEach((key) => {
      if (!allowedQuery.includes(key)) {
        throw new AppError(400, "Bad Request", "Invalid query");
      }
      if (!filterQuery[key]) delete filterQuery[key];
    });

    if (filterQuery.name)
      filterQuery.name = { $regex: filterQuery.name, $options: "i" };
    if (filterQuery.description)
      filterQuery.description = {
        $regex: filterQuery.description,
        $options: "i",
      };

    const tasks = await Task.find({
      ...filterQuery,
      isDeleted: false,
    })
      .limit(limit)
      .skip((page - 1) * limit);
    const totalTasks = await Task.countDocuments();
    const totalPages = Math.ceil(totalTasks / limit);
    sendResponse(
      res,
      200,
      { tasks, page, total: totalPages },
      null,
      "Get Task List Successfully!"
    );
  } catch (err) {
    next(err);
  }
};

taskController.getSingleTask = async (req, res, next) => {
  try {
    const { taskId } = req.params;

    const task = await Task.findOne({ _id: taskId, isDeleted: false }).populate(
      "assignee"
    );
    if (!task) {
      throw new AppError(404, "Task Not Found", "Not Found");
    }

    sendResponse(res, 200, { task }, null, "Get Task Successfully!");
  } catch (err) {
    next(err);
  }
};

taskController.updateTask = async (req, res, next) => {
  const allowedUpdates = ["name", "description", "status", "assignee"];

  try {
    const { taskId } = req.params;
    const updates = req.body;
    const finishedTaskStatus = ["done", "archive"];
    const updateKeys = Object.keys(updates);
    const invalidFields = updateKeys.filter(
      (field) => !allowedUpdates.includes(field)
    );

    if (invalidFields.length) {
      throw new AppError(400, "Bad Request", "Invalid update field");
    }

    let task = await Task.findOne({ _id: taskId, isDeleted: false });
    if (!task) {
      throw new AppError(404, "Task Not Found", "Not Found");
    }

    // when a task status is "done", it cannot be changed to something else other than "archive"

    if (
      task.status === "done" &&
      !finishedTaskStatus.includes(updates.status)
    ) {
      throw new AppError(400, "Invalid task status update", "Bad Request");
    }

    // Unassign a task that has been assigned before

    if (task.assignee && !updates.assignee) {
      const currentAssignee = await User.findById(task.assignee);
      if (!currentAssignee) {
        throw new AppError(404, "User Not Found", "Not Found");
      }
      currentAssignee.tasks = currentAssignee.tasks.pull(taskId);
      await currentAssignee.save();
      delete updates.assignee;
      task.assignee = undefined;
    }

    //  Task has not been assigned before and there's no employee to assign, proceed to update other fields

    if (!task.assignee && !updates.assignee) {
      delete updates.assignee;
    }

    // Unassign a task that has been assigned before and assign it to another employee

    if (task.assignee && updates.assignee) {
      const currentAssignee = await User.findById(task.assignee);
      if (!currentAssignee) {
        throw new AppError(404, "User Not Found", "Not Found");
      }
      currentAssignee.tasks = currentAssignee.tasks.pull(taskId);
      await currentAssignee.save();

      const newAssignee = await User.findById(updates.assignee);
      if (!newAssignee) {
        throw new AppError(404, "User Not Found", "Not Found");
      }
      newAssignee.tasks.push(taskId);
      await newAssignee.save();
    }

    // Assign a task that has not been assigned yet to an employee

    if (!task.assignee && updates.assignee) {
      const newAssignee = await User.findById(updates.assignee);
      if (!newAssignee) {
        throw new AppError(404, "User Not Found", "Not Found");
      }
      newAssignee.tasks.push(taskId);
      await newAssignee.save();
    }

    // Update task if there's an assignee, include/update 'assignee' field, else delete 'assignee' field

    task = updates.assignee
      ? await Task.findByIdAndUpdate(taskId, updates, { new: true })
      : await Task.findByIdAndUpdate(
          taskId,
          { ...updates, $unset: { assignee: 1 } },
          { new: true }
        );

    sendResponse(res, 200, { task }, null, "Update Task Successfully!");
  } catch (err) {
    next(err);
  }
};

taskController.deleteTask = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const deletedTask = await Task.findByIdAndUpdate(
      taskId,
      { isDeleted: true },
      { new: true }
    );
    if (!deletedTask) throw new AppError(404, "Task Not Found", "Not Found");

    sendResponse(
      res,
      200,
      { task: deletedTask },
      null,
      "Delete Task Successfully"
    );
  } catch (err) {
    next(err);
  }
};

module.exports = taskController;
