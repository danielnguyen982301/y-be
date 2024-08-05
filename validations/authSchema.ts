import Joi from "joi";

export const authSchema = {
  body: Joi.object({
    email: Joi.string().email({ allowFullyQualified: true }).required(),
    password: Joi.string().required(),
  }),
};
