import { Schema, Types, model } from "mongoose";

type ListSchema = {
  owner: Types.ObjectId;
  name: string;
  description: string;
  users: Types.ObjectId[];
  mode: "public" | "private";
  followCount: number;
};

const listSchema = new Schema<ListSchema>(
  {
    owner: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    name: { type: String, required: true },
    description: { type: String, default: "" },
    users: { type: [Schema.Types.ObjectId], ref: "User" },
    mode: { type: String, default: "public" },
    followCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const List = model<ListSchema>("List", listSchema);

export default List;
