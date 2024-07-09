import { Schema, Types, model } from "mongoose";

export type HashtagSchema = {
  name: string;
  posts: Types.ObjectId[];
};

const hashtagSchema = new Schema<HashtagSchema>(
  {
    name: { type: String, required: true },
    posts: { type: [Schema.Types.ObjectId], ref: "Post" },
  },
  { timestamps: true }
);

const Hashtag = model<HashtagSchema>("Hashtag", hashtagSchema);

export default Hashtag;
