import Joi from "joi";
import { checkValidID } from "../middlewares/validationMiddleware";

export const getHashTagsSchema = {
  query: Joi.object({
    searchText: Joi.string()
      .regex(/^[\w\s_#]+$/)
      .trim()
      .allow("")
      .optional(),
  }),
};

export const createHashTagsSchema = {
  body: Joi.object({
    hashtags: Joi.array().items(
      Joi.string()
        .regex(/^[\w\s_#]+$/)
        .trim()
    ),
    postId: Joi.string().required().custom(checkValidID),
  }),
};
