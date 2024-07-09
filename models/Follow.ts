import { Schema, Types, model } from "mongoose";

type FollowSchema = {
  follower: Types.ObjectId;
  followee: Types.ObjectId;
};

const followSchema = new Schema<FollowSchema>(
  {
    follower: { type: Schema.Types.ObjectId, required: true, ref: "User" },
    followee: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

const Follow = model<FollowSchema>("Follow", followSchema);

export default Follow;
