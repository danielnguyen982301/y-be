import Joi from "joi";
import { checkValidID } from "../middlewares/validationMiddleware";

export const createMessageSchema = {
  body: Joi.object({
    content: Joi.string()
      .required()
      .regex(/^[\w\s\.,#@\?!\$%&\*\(\)\^\[\]'";:\-]+$/)
      .trim(),
    to: Joi.string().required().custom(checkValidID),
  }),
};

export const getSingleChatUserSchema = {
  params: Joi.object({
    userId: Joi.string().required().custom(checkValidID),
  }),
};

export const updateMessageStatusSchema = {
  body: Joi.object({
    messages: Joi.array().items(Joi.string().custom(checkValidID)),
  }),
};
