import { Schema, Types, model } from "mongoose";

type LikeSchema = {
  author: Types.ObjectId;
  targetType: "Post" | "Reply";
  target: Types.ObjectId;
};

const likeSchema = new Schema<LikeSchema>(
  {
    author: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    targetType: { type: String, required: true, enum: ["Post", "Reply"] },
    target: {
      type: Schema.Types.ObjectId,
      required: true,
      refPath: "targetType",
    },
  },
  { timestamps: true }
);

const Like = model<LikeSchema>("Like", likeSchema);

export default Like;
