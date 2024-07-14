import { Schema, Types, model } from "mongoose";

type NotificationSchema = {
  sender: Types.ObjectId;
  recipient: Types.ObjectId;
  event: "mention" | "repost" | "reply" | "follow";
  mentionLocationType: "Post" | "Reply";
  mentionLocation: Types.ObjectId;
  repostType: "Post" | "Reply";
  repost: Types.ObjectId;
  reply: Types.ObjectId;
  isRead: boolean;
};

const notificationSchema = new Schema<NotificationSchema>(
  {
    sender: { type: Schema.Types.ObjectId, required: true, ref: "User" },
    recipient: { type: Schema.Types.ObjectId, required: true, ref: "User" },
    event: {
      type: String,
      required: true,
      enum: ["mention", "repost", "reply"],
    },
    mentionLocationType: { type: String, enum: ["Post", "Reply"] },
    mentionLocation: {
      type: Schema.Types.ObjectId,
      refPath: "mentionLocationType",
    },
    repostType: { type: String, enum: ["Post", "Reply"] },
    repost: { type: Schema.Types.ObjectId, ref: "UserThread" },
    reply: { type: Schema.Types.ObjectId, ref: "Reply" },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

notificationSchema.methods.toJSON = function () {
  const notif = this._doc;
  return notif;
};

const Notification = model<NotificationSchema>(
  "Notification",
  notificationSchema
);

export default Notification;
