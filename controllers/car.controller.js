const mongoose = require("mongoose");
const Car = require("../models/Car");
const { validationResult } = require("express-validator");
const { sendResponse, AppError } = require("../helpers/utils");
const carController = {};

carController.createCar = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendResponse(res, 400, null, errors.array(), "Validation Error");
  }
  try {
    // YOUR CODE HERE
    const { make, model, release_date, transmission_type, size, style, price } =
      req.body;

    const newCar = await Car.create({
      make,
      model,
      release_date,
      transmission_type,
      size,
      style,
      price,
    });
    sendResponse(res, 200, { car: newCar }, null, "Create Car Successfully!");
  } catch (err) {
    // YOUR CODE HERE
    next(err);
  }
};

carController.getCars = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendResponse(res, 400, null, errors.array(), "Validation Error");
  }
  const allowedQuery = ["page"];

  try {
    // YOUR CODE HERE
    let { page, ...filterQuery } = req.query;
    page = page || 1;

    const filterKeys = Object.keys(filterQuery);
    filterKeys.forEach((key) => {
      if (!allowedQuery.includes(key)) {
        throw new AppError(400, "Bad Request", "Invalid query");
      }
      if (!filterQuery[key]) delete filterQuery[key];
    });

    const cars = await Car.find({ isDeleted: false })
      .limit(10)
      .skip((page - 1) * 10);
    const totalCars = await Car.countDocuments();
    const totalPages = Math.ceil(totalCars / 10);
    sendResponse(
      res,
      200,
      { cars, page, total: totalPages },
      null,
      "Get Car List Successfully!"
    );
  } catch (err) {
    // YOUR CODE HERE
    next(err);
  }
};

carController.editCar = async (req, res, next) => {
  const allowedUpdate = [
    "make",
    "model",
    "release_date",
    "transmission_type",
    "size",
    "style",
    "price",
  ];

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendResponse(res, 400, null, errors.array(), "Validation Error");
  }

  try {
    // YOUR CODE HERE
    const { id } = req.params;
    const updates = req.body;
    const updateKeys = Object.keys(updates);
    const invalidFields = updateKeys.filter(
      (field) => !allowedUpdate.includes(field)
    );

    if (invalidFields.length) {
      throw new AppError(400, "Bad Request", "Invalid update field");
    }

    const updatedCar = await Car.findByIdAndUpdate(id, updates, { new: true });
    if (!updatedCar) {
      throw new AppError(404, "Car Not Found", "Not Found");
    }

    sendResponse(
      res,
      200,
      { car: updatedCar },
      null,
      "Update Car Successfully!"
    );
  } catch (err) {
    // YOUR CODE HERE
    next(err);
  }
};

carController.deleteCar = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendResponse(res, 400, null, errors.array(), "Validation Error");
  }
  try {
    // YOUR CODE HERE
    const { id } = req.params;
    const deletedCar = await Car.findByIdAndUpdate(
      id,
      { isDeleted: true },
      { new: true }
    );
    if (!deletedCar) {
      throw new AppError(404, "Car Not Found", "Not found");
    }

    sendResponse(
      res,
      200,
      { car: deletedCar },
      null,
      "Delete Car Successfully!"
    );
  } catch (err) {
    // YOUR CODE HERE
    next(err);
  }
};

module.exports = carController;
