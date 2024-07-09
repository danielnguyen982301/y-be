import { Schema, Types, model } from "mongoose";

export type UserThreadSchema = {
  user: Types.ObjectId;
  post: Types.ObjectId;
  reply: Types.ObjectId;
  repostType: "Post" | "Reply";
  repost: Types.ObjectId;
  isDeleted: boolean;
};

const userThreadSchema = new Schema<UserThreadSchema>(
  {
    user: { type: Schema.Types.ObjectId, required: true, ref: "User" },
    post: {
      type: Schema.Types.ObjectId,
      ref: "Post",
    },
    reply: { type: Schema.Types.ObjectId, ref: "Reply" },
    repostType: { type: String, enum: ["Post", "Reply"] },
    repost: { type: Schema.Types.ObjectId, refPath: "repostType" },
  },
  { timestamps: true }
);

userThreadSchema.methods.toJSON = function () {
  const thread = this._doc;
  delete thread.isDeleted;
  return thread;
};

const UserThread = model<UserThreadSchema>("UserThread", userThreadSchema);

export default UserThread;
