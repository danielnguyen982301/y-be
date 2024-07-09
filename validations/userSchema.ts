import Joi from "joi";
import { checkValidID } from "../middlewares/validationMiddleware";

export const createUserSchema = {
  body: Joi.object({
    username: Joi.string()
      .required()
      .regex(/^[\w_]+$/)
      .trim(),
    displayName: Joi.string()
      .required()
      .regex(/^[\w\s]+$/)
      .trim(),
    email: Joi.string().required().email({ allowFullyQualified: true }).trim(),
    password: Joi.string().required(),
  }),
};

export const getUsersSchema = {
  query: Joi.object({
    page: Joi.number().optional(),
    limit: Joi.number().optional(),
    searchText: Joi.string()
      .regex(/^[@\w\s_]+$/)
      .trim()
      .allow("")
      .optional(),
  }),
};

export const getSingleUserSchema = {
  params: Joi.object({
    username: Joi.string()
      .regex(/^[\w]+$/)
      .required(),
    // id: Joi.string().required().custom(checkValidID),
  }),
};

export const updateUserProfileSchema = {
  params: Joi.object({
    id: Joi.string().required().custom(checkValidID),
  }),
  body: Joi.object({
    displayName: Joi.string()
      .regex(/^[\w\s]+$/)
      .trim()
      .optional(),
    avatar: Joi.string().allow("").optional(),
    header: Joi.string().allow("").optional(),
    bio: Joi.string()
      .allow("")
      .regex(/^[\w\s\.,#@\?!\$%&\*\(\)\^\[\]'";:\-]+$/)
      .trim()
      .optional(),
    location: Joi.string()
      .allow("")
      .regex(/^[\w\s\.,#@\?!\$%&\*\(\)\^\[\]'";:\-]+$/)
      .trim()
      .optional(),
  }),
};
