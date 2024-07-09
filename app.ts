import express, { NextFunction, Request, Response } from "express";
import path from "path";
import cookieParser from "cookie-parser";
import logger from "morgan";
import cors from "cors";
import "dotenv/config";
import mongoose from "mongoose";
import { AppError, sendResponse } from "./helpers/utils";
import indexRouter from "./routes/index";

const app = express();

app.use(cors());
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

// Connect to MONGODB
mongoose
  .connect(process.env.MONGO_URI as string)
  .then(() => console.log("Connected to Database!"))
  .catch((err) => console.log(err));

app.use("/api", indexRouter);

app.use((req, res, next) => {
  const err = new AppError(404, "Path Not Found", "Request Error");
  next(err);
});

app.use((err: AppError, req: Request, res: Response, next: NextFunction) => {
  console.log("ERROR", err);
  return sendResponse(
    res,
    err.statusCode ? err.statusCode : 500,
    null,
    { message: err.message },
    err.isOperational ? err.errorType : "Internal Server Error"
  );
});

export default app;
