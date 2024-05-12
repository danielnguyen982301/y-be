const { validationResult } = require("express-validator");
const { sendResponse } = require("../helpers/utils");

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendResponse(res, 400, null, errors.array(), "Validation Error");
  }
  next();
};

module.exports = validate;
