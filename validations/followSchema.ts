import Joi from "joi";
import { checkValidID } from "../middlewares/validationMiddleware";

export const createFollowSchema = {
  body: Joi.object({
    followeeId: Joi.string().required().custom(checkValidID),
  }),
};

export const getFollowerListSchema = {
  params: Joi.object({
    userId: Joi.string().required().custom(checkValidID),
  }),
  query: Joi.object({
    page: Joi.number().optional(),
    limit: Joi.number().optional(),
  }),
};

export const getFolloweeListSchema = {
  params: Joi.object({
    userId: Joi.string().required().custom(checkValidID),
  }),
  query: Joi.object({
    page: Joi.number().optional(),
    limit: Joi.number().optional(),
  }),
};

export const reactRequestSchema = {
  params: Joi.object({
    userId: Joi.string().required().custom(checkValidID),
  }),
  body: Joi.object({
    status: Joi.string().valid("accepted", "declined").required(),
  }),
};

export const unfollowSchema = {
  body: Joi.object({
    followeeId: Joi.string().required().custom(checkValidID),
  }),
};
