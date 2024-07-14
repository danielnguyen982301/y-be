import Joi from "joi";
import { checkValidID } from "../middlewares/validationMiddleware";

export const createPostSchema = {
  body: Joi.object({
    content: Joi.string()
      .required()
      .regex(/^[\w\s\.,#@\?!\$%&\*\(\)\^\[\]'";:\+\-]+$/)
      .trim(),
    mediaFile: Joi.string().allow("").optional(),
  }),
};

export const createRepostOfPostSchema = {
  body: Joi.object({
    repostType: Joi.string().required().valid("Post", "Reply"),
    repostId: Joi.string().required().custom(checkValidID),
  }),
};

export const undoRepostOfPostSchema = {
  body: Joi.object({
    repostId: Joi.string().required().custom(checkValidID),
  }),
};

export const getAllPostsSchema = {
  query: Joi.object({
    page: Joi.number().optional(),
    limit: Joi.number().optional(),
    ignoreCurrent: Joi.boolean().optional(),
    searchText: Joi.string()
      .regex(/^[#@\w\s]+$/)
      .trim()
      .optional(),
  }),
};

export const getPostsOfFolloweesSchema = {
  query: Joi.object({
    page: Joi.number().optional(),
    limit: Joi.number().optional(),
  }),
};

export const getPostsOfSingleUserSchema = {
  params: Joi.object({
    userId: Joi.string().required().custom(checkValidID),
  }),
  query: Joi.object({
    page: Joi.number().optional(),
    limit: Joi.number().optional(),
    original: Joi.boolean().optional(),
  }),
};

export const updatePostSchema = {
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

export const getSinglePostSchema = {
  params: Joi.object({
    id: Joi.string().required().custom(checkValidID),
  }),
};

export const deletePostSchema = {
  params: Joi.object({
    id: Joi.string().required().custom(checkValidID),
  }),
};
