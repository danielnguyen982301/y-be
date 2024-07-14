import Joi from "joi";
import { checkValidID } from "../middlewares/validationMiddleware";

export const createMentionNotifSchema = {
  body: Joi.object({
    mentionLocationType: Joi.string().required().valid("Post", "Reply"),
    mentionLocation: Joi.string().required().custom(checkValidID),
    mentionedTargets: Joi.array().items(Joi.string().custom(checkValidID)),
  }),
};

export const updateNotifStatusSchema = {
  body: Joi.object({
    notifs: Joi.array().items(Joi.string().custom(checkValidID)),
  }),
};
