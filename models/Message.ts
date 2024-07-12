import { Schema, Types, model } from "mongoose";

type MessageSchema = {
  content: string;
  from: Types.ObjectId;
  to: Types.ObjectId;
  isRead: boolean;
};

const messageSchema = new Schema<MessageSchema>(
  {
    content: { type: String, required: true },
    from: { type: Schema.Types.ObjectId, required: true, ref: "User" },
    to: { type: Schema.Types.ObjectId, required: true, ref: "User" },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Message = model<MessageSchema>("Message", messageSchema);

export default Message;
