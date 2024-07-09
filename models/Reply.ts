import { Schema, Types, model } from "mongoose";

type ReplySchema = {
  author: Types.ObjectId;
  content: string;
  targetType: "Post" | "Reply";
  target: Types.ObjectId;
  mediaFile: string;
  replyCount: number;
  repostCount: number;
  likeCount: number;
  viewCount: number;
  bookmarkCount: number;
  links: [Types.ObjectId];
};

const replySchema = new Schema<ReplySchema>(
  {
    author: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    content: { type: String, required: true },
    targetType: {
      type: String,
      required: true,
      enum: ["Post", "Reply"],
    },
    target: {
      type: Schema.Types.ObjectId,
      required: true,
      refPath: "targetType",
    },
    replyCount: { type: Number, default: 0 },
    repostCount: { type: Number, default: 0 },
    likeCount: { type: Number, default: 0 },
    viewCount: { type: Number, default: 0 },
    bookmarkCount: { type: Number, default: 0 },
    links: { type: [Schema.Types.ObjectId] },
  },
  { timestamps: true }
);

replySchema.methods.toJSON = function () {
  const reply = this._doc;
  return reply;
};

const Reply = model<ReplySchema>("Reply", replySchema);

export default Reply;
