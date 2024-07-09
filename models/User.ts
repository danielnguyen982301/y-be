import { Model, Schema, Types, model } from "mongoose";
import jwt from "jsonwebtoken";

type UserSchema = {
  username: string;
  email: string;
  password: string;
  displayName: string;
  avatar: string;
  header: string;
  bio: string;
  location: string;
  postCount: number;
  followerCount: number;
  followingCount: number;
  isDeleted: false;
};

type UserMethods = {
  generateToken(): string;
};

type UserModel = Model<UserSchema, {}, UserMethods>;

const userSchema = new Schema<UserSchema, UserModel, UserMethods>(
  {
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true, select: false },
    displayName: { type: String, required: true },
    avatar: { type: String, default: "" },
    header: { type: String, default: "" },
    bio: { type: String, default: "" },
    location: { type: String, default: "" },
    postCount: { type: Number, default: 0 },
    followerCount: { type: Number, default: 0 },
    followingCount: { type: Number, default: 0 },

    isDeleted: { type: Boolean, default: false, select: false },
  },
  { timestamps: true }
);

userSchema.methods.toJSON = function () {
  const user = this._doc;
  delete user.password;
  delete user.isDeleted;
  return user;
};

userSchema.methods.generateToken = function () {
  const accessToken = jwt.sign(
    { _id: this._id },
    process.env.JWT_SECRET_KEY as string,
    {
      expiresIn: 24 * 60 * 60,
    }
  );
  return accessToken;
};

const User = model<UserSchema, UserModel>("User", userSchema);

export default User;
