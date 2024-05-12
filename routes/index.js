const express = require("express");
const router = express.Router();

// userRoute
const userAPI = require("./user.api");
router.use("/users", userAPI);

const taskAPI = require("./task.api");
router.use("/tasks", taskAPI);

module.exports = router;
