import { Schema, Types, model } from "mongoose";

export type PostSchema = {
  author: Types.ObjectId;
  content: string;
  mediaFile: string;
  replyCount: number;
  repostCount: number;
  likeCount: number;
  viewCount: number;
  bookmarkCount: number;
  hashtags: Types.ObjectId[];
};

const postSchema = new Schema<PostSchema>(
  {
    author: { type: Schema.Types.ObjectId, required: true, ref: "User" },
    content: { type: String, required: true },
    mediaFile: { type: String },
    replyCount: { type: Number, default: 0 },
    repostCount: { type: Number, default: 0 },
    likeCount: { type: Number, default: 0 },
    viewCount: { type: Number, default: 0 },
    bookmarkCount: { type: Number, default: 0 },
    hashtags: { type: [Schema.Types.ObjectId], ref: "Hashtag" },
  },
  { timestamps: true }
);

postSchema.methods.toJSON = function () {
  const post = this._doc;
  return post;
};

const Post = model<PostSchema>("Post", postSchema);

export default Post;
