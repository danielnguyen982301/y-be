import express from "express";
import { joiValidate } from "../middlewares/validationMiddleware";
import { authSchema } from "../validations/authSchema";
import { loginWithEmail } from "../controllers/auth.controller";

const router = express.Router();

/**
 * @route POST /auth/login
 * @description Log in with email and password
 * @body {email, password}
 * @access Public
 */
router.post("/login", joiValidate(authSchema, "body"), loginWithEmail);

export default router;
