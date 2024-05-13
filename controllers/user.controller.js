const mongoose = require("mongoose");
const User = require("../models/User");
const { validationResult } = require("express-validator");
const { sendResponse, AppError } = require("../helpers/utils");
const userController = {};

userController.createUser = async (req, res, next) => {
  try {
    const { name } = req.body;

    //check duplicate name

    const existingUser = await User.findOne({ name });
    if (existingUser)
      throw new AppError(409, "User already exists", "Conflict");

    const newUser = await User.create({
      name,
    });
    sendResponse(
      res,
      200,
      { user: newUser },
      null,
      "Create User Successfully!"
    );
  } catch (err) {
    next(err);
  }
};

userController.getUsers = async (req, res, next) => {
  const allowedQuery = ["page", "limit", "name", "role"];

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

    if (filterQuery.name) {
      filterQuery.name = { $regex: filterQuery.name, $options: "i" };
    }

    const users = await User.find({
      ...filterQuery,
    })
      .limit(limit)
      .skip((page - 1) * limit);
    const totalUsers = await User.countDocuments();
    const totalPages = Math.ceil(totalUsers / limit);
    sendResponse(
      res,
      200,
      { users, page, total: totalPages },
      null,
      "Get User List Successfully!"
    );
  } catch (err) {
    next(err);
  }
};

// Get single user along with task list

userController.getTaskListOfSingleUser = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const selectedUser = await User.findById(userId).populate("tasks");
    if (!selectedUser) {
      throw new AppError(404, "User Not Found", "Not Found");
    }

    sendResponse(
      res,
      200,
      { user: selectedUser },
      null,
      "Get Task List Of User Successfully!"
    );
  } catch (err) {
    next(err);
  }
};

module.exports = userController;
