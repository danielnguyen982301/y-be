const { body, query, param } = require("express-validator");

const createCarValidations = [
  body("make").notEmpty().trim().escape().withMessage("Car make is required"),
  body("model").notEmpty().trim().escape().withMessage("Car model is required"),
  body("release_date")
    .notEmpty()
    .withMessage("Release date is required")
    .isInt({ min: 1900 })
    .withMessage("Year must be after 1900")
    .trim()
    .escape(),
  body("transmission_type")
    .notEmpty()
    .withMessage("Car transmission type is required")
    .isIn([
      "MANUAL",
      "AUTOMATIC",
      "AUTOMATED_MANUAL",
      "DIRECT_DRIVE",
      "UNKNOWN",
    ])
    .withMessage("Invalid transmission type")
    .trim()
    .escape(),
  body("size")
    .notEmpty()
    .withMessage("Car size is required")
    .isIn(["Compact", "Midsize", "Large"])
    .trim()
    .escape(),
  body("style").notEmpty().withMessage("Car style is required").trim().escape(),
  body("price")
    .notEmpty()
    .withMessage("Car price is required")
    .isInt()
    .withMessage("Price must be a number")
    .trim()
    .escape(),
];

const getCarsValidations = [
  query("page")
    .isInt()
    .withMessage("Page must be a number")
    .trim()
    .toInt()
    .escape()
    .optional(),
];

const updateCarValidations = [
  param("id").notEmpty().withMessage("Car ID is required").trim().escape(),
  body("make")
    .notEmpty()
    .trim()
    .escape()
    .withMessage("Car make is required")
    .optional(),
  body("model")
    .notEmpty()
    .trim()
    .escape()
    .withMessage("Car model is required")
    .optional(),
  body("release_date")
    .notEmpty()
    .withMessage("Release date is required")
    .isInt({ min: 1900 })
    .withMessage("Year must be after 1900")
    .trim()
    .escape()
    .optional(),
  body("transmission_type")
    .notEmpty()
    .withMessage("Car transmission type is required")
    .isIn([
      "MANUAL",
      "AUTOMATIC",
      "AUTOMATED_MANUAL",
      "DIRECT_DRIVE",
      "UNKNOWN",
    ])
    .withMessage("Invalid transmission type")
    .trim()
    .escape()
    .optional(),
  body("size")
    .notEmpty()
    .withMessage("Car size is required")
    .isIn(["Compact", "Midsize", "Large"])
    .trim()
    .escape()
    .optional(),
  body("style")
    .notEmpty()
    .withMessage("Car style is required")
    .trim()
    .escape()
    .optional(),
  body("price")
    .notEmpty()
    .withMessage("Car price is required")
    .isInt()
    .withMessage("Price must be a number")
    .trim()
    .escape()
    .optional(),
];

const deleteCarValidations = [
  param("id").notEmpty().withMessage("Car ID is required").trim().escape(),
];

module.exports = {
  createCarValidations,
  getCarsValidations,
  updateCarValidations,
  deleteCarValidations,
};
