import { Schema, Types, model } from "mongoose";

type BookmarkSchema = {
  user: Types.ObjectId;
  targetType: "Post" | "Reply";
  target: Types.ObjectId;
};

const bookmarkSchema = new Schema<BookmarkSchema>(
  {
    user: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    targetType: { type: String, enum: ["Post", "Reply"] },
    target: { type: Schema.Types.ObjectId, refPath: "targetType" },
  },
  { timestamps: true }
);

const Bookmark = model<BookmarkSchema>("Bookmark", bookmarkSchema);

export default Bookmark;
