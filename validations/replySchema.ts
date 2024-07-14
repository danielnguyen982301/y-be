import Joi from "joi";
import { checkValidID } from "../middlewares/validationMiddleware";

export const createReplySchema = {
  body: Joi.object({
    content: Joi.string()
      .required()
      .regex(/^[\w\s\.,#@\?!\$%&\*\(\)\^\[\]'";:\+\-]+$/)
      .trim(),
    mediaFile: Joi.string().allow("").optional(),
    targetType: Joi.string().required().valid("Post", "Reply"),
    targetId: Joi.string().required().custom(checkValidID),
    links: Joi.array().items(Joi.string().custom(checkValidID)),
  }),
};

export const createRepostOfReplySchema = {
  body: Joi.object({
    repostType: Joi.string().required().valid("Post", "Reply"),
    repostId: Joi.string().required().custom(checkValidID),
  }),
};

export const undoRepostOfReplySchema = {
  body: Joi.object({
    repostId: Joi.string().required().custom(checkValidID),
  }),
};

export const getRepliesOfSingleTargetSchema = {
  params: Joi.object({
    targetType: Joi.string().required().valid("post", "reply"),
    targetId: Joi.string().required().custom(checkValidID),
  }),
  query: Joi.object({
    page: Joi.number().optional(),
    limit: Joi.number().optional(),
  }),
};

export const getRepliesOfSingleUserSchema = {
  params: Joi.object({
    userId: Joi.string().required().custom(checkValidID),
  }),
  query: Joi.object({
    page: Joi.number().optional(),
    limit: Joi.number().optional(),
  }),
};

export const updateReplySchema = {
  params: Joi.object({
    id: Joi.string().required().custom(checkValidID),
  }),
  body: Joi.object({
    content: Joi.string()
      .regex(/^[\w\s\.,#@\?!\$%&\*\(\)\^\[\]'";:\+\-]+$/)
      .trim()
      .optional(),
    mediaFile: Joi.string().allow("").optional(),
  }),
};

export const getSingleReplytSchema = {
  params: Joi.object({
    id: Joi.string().required().custom(checkValidID),
  }),
};

export const deleteReplySchema = {
  params: Joi.object({
    id: Joi.string().required().custom(checkValidID),
  }),
};
