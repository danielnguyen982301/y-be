const express = require("express");
const {
  createCar,
  getCars,
  editCar,
  deleteCar,
} = require("../controllers/car.controller");
const {
  createCarValidations,
  getCarsValidations,
  updateCarValidations,
  deleteCarValidations,
} = require("../validations/carValidations");
const router = express.Router();

// CREATE
router.post("/", createCarValidations, createCar);

// READ
router.get("/", getCarsValidations, getCars);

// UPDATE
router.put("/:id", updateCarValidations, editCar);

// // DELETE
router.delete("/:id", deleteCarValidations, deleteCar);

module.exports = router;
