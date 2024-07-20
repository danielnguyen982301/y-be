import mongoose, { Types } from "mongoose";
import { NextFunction, Response } from "express";
import Joi from "joi";
import { AuthenticatedRequest } from "../types";

import { sendResponse } from "../helpers/utils";

export const checkValidID = (paramsID: Types.ObjectId) => {
  if (!mongoose.Types.ObjectId.isValid(paramsID)) throw new Error("Invalid ID");
  return paramsID;
};

export const joiValidate =
  (
    schema: Record<string, Joi.ObjectSchema>,
    property: "body" | "params" | "query"
  ) =>
  (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const { error, value } = schema[property].validate(req[property]);
    if (error) {
      const message = error.details[0].message;
      return sendResponse(res, 400, null, message, "Validation Error");
    }
    req[property] = value;
    next();
  };
