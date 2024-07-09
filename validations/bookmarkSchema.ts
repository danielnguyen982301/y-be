import Joi from "joi";
import { checkValidID } from "../middlewares/validationMiddleware";

export const getBookmarksSchema = {
  query: Joi.object({
    page: Joi.number().optional(),
    limit: Joi.number().optional(),
  }),
};

export const createBookmarkSchema = {
  body: Joi.object({
    targetType: Joi.string().required().valid("Post", "Reply"),
    targetId: Joi.string().required().custom(checkValidID),
  }),
};

export const removeBookmarkSchema = {
  body: Joi.object({
    targetType: Joi.string().required().valid("Post", "Reply"),
    targetId: Joi.string().required().custom(checkValidID),
  }),
};
