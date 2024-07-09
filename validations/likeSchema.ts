import Joi from "joi";
import { checkValidID } from "../middlewares/validationMiddleware";

export const saveLikeSchema = {
  body: Joi.object({
    targetType: Joi.string().required().valid("Post", "Reply"),
    target: Joi.string().required().custom(checkValidID),
  }),
};

export const getLikedTargetsOfSingleUserSchema = {
  params: Joi.object({
    userId: Joi.string().required().custom(checkValidID),
  }),
  query: Joi.object({
    page: Joi.number().optional(),
    limit: Joi.number().optional(),
  }),
};
