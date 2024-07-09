import mongoose, { Types } from "mongoose";
import { AuthenticatedRequest, sendResponse } from "../helpers/utils";
import { NextFunction, Response } from "express";
import Joi from "joi";

export const checkValidID = (paramsID: Types.ObjectId) => {
  console.log(paramsID);
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
      return sendResponse(res, 422, null, message, "Validation Error");
    }
    req[property] = value;
    next();
  };
