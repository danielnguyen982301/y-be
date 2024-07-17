import { AppError, catchAsync, sendResponse } from "../helpers/utils";
import mongoose, { Types } from "mongoose";
import Reply from "../models/Reply";
import UserThread from "../models/UserThread";
import Follow from "../models/Follow";
import Like from "../models/Like";
import User from "../models/User";
import Post from "../models/Post";
import Bookmark from "../models/Bookmark";
import Notification from "../models/Notification";

const calculatePostCount = async (userId: Types.ObjectId) => {
  const postCount = await UserThread.countDocuments({
    user: userId,
    isDeleted: false,
  });

  await User.findByIdAndUpdate(userId, { postCount });
};

const calculateReplyCount = async (
  targetId: Types.ObjectId,
  targetType: "Post" | "Reply"
) => {
  const replyCount = await Reply.countDocuments({
    target: targetId,
    targetType,
  });

  await mongoose.model(targetType).findByIdAndUpdate(targetId, { replyCount });
  return replyCount;
};

const calculateRepostCount = async (replyId: Types.ObjectId) => {
  const repostCount = await UserThread.countDocuments({
    repostType: "Reply",
    repost: replyId,
  });

  await Reply.findByIdAndUpdate(replyId, { repostCount });
  return repostCount;
};

export const getRepliesOfSingleTarget = catchAsync(async (req, res, next) => {
  const currentUserId = req.userId as Types.ObjectId;
  let { targetType, targetId } = req.params;
  targetType = targetType.charAt(0).toUpperCase() + targetType.slice(1);
  let { page, limit } = req.query as unknown as {
    page: number;
    limit: number;
  };

  page = page || 1;
  limit = limit || 10;

  // Validate target exists
  const target = await mongoose.model(targetType).findById(targetId);
  if (!target)
    throw new AppError(404, `${targetType} Not Found`, "Get Replies Error");

  // Get replies
  const count = await Reply.countDocuments({ targetType, target: targetId });
  const totalPages = Math.ceil(count / limit);

  const replies = await Reply.find({ targetType, target: targetId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(limit * (page - 1))
    .populate("author");

  const replyIds = replies.map((reply) => reply._id);

  const likedReplies = await Like.find({
    author: currentUserId,
    targetType: "Reply",
    target: { $in: replyIds },
  });

  const repostedReplies = await UserThread.find({
    user: currentUserId,
    repostType: "Reply",
    repost: { $in: replyIds },
  });

  const bookmarkedReplies = await Bookmark.find({
    user: currentUserId,
    targetType: "Reply",
    target: { $in: replyIds },
  });

  const authorIds = replies.map((reply) => reply.author._id);

  const relationships = await Follow.find({
    $or: [
      { follower: currentUserId, followee: { $in: authorIds } },
      {
        follower: { $in: authorIds },
        followee: currentUserId,
      },
    ],
  });

  const mappedRelationships = relationships.reduce((acc, relationship) => {
    const followerId = relationship.follower;
    const followeeId = relationship.followee;
    if (followeeId.equals(currentUserId)) {
      acc[followerId.toString()] = !acc[followerId.toString()]
        ? "followsCurrentUser"
        : "followEachOther";
    } else {
      acc[followeeId.toString()] = !acc[followeeId.toString()]
        ? "followedByCurrentUser"
        : "followEachOther";
    }
    return acc;
  }, {} as Record<string, any>);

  let repliesWithContent = replies.map((reply) => {
    let temp = reply.toJSON() as Record<string, any>;
    temp.isLiked = likedReplies.some((liked) => liked.target.equals(temp._id));
    temp.isReposted = repostedReplies.some((thread) =>
      thread.repost.equals(temp._id)
    );
    temp.isBookmarked = bookmarkedReplies.some((bookmark) =>
      bookmark.target.equals(temp._id)
    );
    temp.author = temp.author.toJSON() as Record<string, any>;
    temp.author.relationship = mappedRelationships[temp.author._id.toString()];
    return temp;
  });

  await Reply.updateMany(
    { _id: { $in: replyIds } },
    { $inc: { viewCount: 1 } }
  );

  return sendResponse(
    res,
    200,
    { replies: repliesWithContent, totalPages, count },
    null,
    "Get Replies Of Single Target Successfully"
  );
});

export const getRepliesOfSingleUser = catchAsync(async (req, res, next) => {
  const currentUserId = req.userId as Types.ObjectId;
  let { userId } = req.params;
  let { page, limit } = req.query as unknown as {
    page: number;
    limit: number;
  };

  page = page || 1;
  limit = limit || 10;

  // Validate target exists
  const user = await User.findById(userId);
  if (!user)
    throw new AppError(404, "User Not Found", "Get Posts of Single User Error");

  // Get replies
  const count = await Reply.countDocuments({ author: userId });
  const totalPages = Math.ceil(count / limit);

  const replies = await Reply.find({ author: userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(limit * (page - 1))
    .populate("author")
    .populate({ path: "target", populate: "author" });

  const replyIds = replies.map((reply) => reply._id);

  const likedReplies = await Like.find({
    author: currentUserId,
    targetType: "Reply",
    target: { $in: replyIds },
  });

  const repostedReplies = await UserThread.find({
    user: currentUserId,
    repostType: "Reply",
    repost: { $in: replyIds },
  });

  const bookmarkedReplies = await Bookmark.find({
    user: currentUserId,
    targetType: "Reply",
    target: { $in: replyIds },
  });

  const authorIds = replies.map((reply) => reply.author._id);

  const relationships = await Follow.find({
    $or: [
      { follower: currentUserId, followee: { $in: authorIds } },
      {
        follower: { $in: authorIds },
        followee: currentUserId,
      },
    ],
  });

  const mappedRelationships = relationships.reduce((acc, relationship) => {
    const followerId = relationship.follower;
    const followeeId = relationship.followee;
    if (followeeId.equals(currentUserId)) {
      acc[followerId.toString()] = !acc[followerId.toString()]
        ? "followsCurrentUser"
        : "followEachOther";
    } else {
      acc[followeeId.toString()] = !acc[followeeId.toString()]
        ? "followedByCurrentUser"
        : "followEachOther";
    }
    return acc;
  }, {} as Record<string, any>);

  let repliesWithContent = replies.map((reply) => {
    let temp = reply.toJSON() as Record<string, any>;
    temp.isLiked = likedReplies.some((liked) => liked.target.equals(temp._id));
    temp.isReposted = repostedReplies.some((thread) =>
      thread.repost.equals(temp._id)
    );
    temp.isBookmarked = bookmarkedReplies.some((bookmark) =>
      bookmark.target.equals(temp._id)
    );
    temp.author = temp.author.toJSON() as Record<string, any>;
    temp.author.relationship = mappedRelationships[temp.author._id.toString()];
    return temp;
  });

  await Reply.updateMany(
    { _id: { $in: replyIds } },
    { $inc: { viewCount: 1 } }
  );

  return sendResponse(
    res,
    200,
    { replies: repliesWithContent, totalPages, count },
    null,
    "Get Replies Successfully"
  );
});

export const getSingleReply = catchAsync(async (req, res, next) => {
  const currentUserId = req.userId as Types.ObjectId;
  const replyId = req.params.id;

  const reply = await Reply.findById(replyId);
  if (!reply)
    throw new AppError(404, "Reply Not Found", "Get Single Reply Error");

  const targetIds = [...reply.links, reply._id];

  const likedTargets = await Like.find({
    author: currentUserId,
    target: { $in: targetIds },
  });

  const repostedTargets = await UserThread.find({
    user: currentUserId,
    repost: { $in: targetIds },
  });

  const bookmarkedTargets = await Bookmark.find({
    user: currentUserId,
    target: { $in: targetIds },
  });

  const post = await Post.findById(targetIds[0]).populate("author");
  if (!post)
    throw new AppError(404, "Post Not Found", "Get Single Reply Error");

  const replies = await Reply.find({
    _id: { $in: targetIds.slice(1) },
  }).populate("author");

  const authorIds = [
    post.author._id,
    ...replies.map((reply) => reply.author._id),
  ];

  const relationships = await Follow.find({
    $or: [
      { follower: currentUserId, followee: { $in: authorIds } },
      {
        follower: { $in: authorIds },
        followee: currentUserId,
      },
    ],
  });

  const mappedRelationships = relationships.reduce((acc, relationship) => {
    const followerId = relationship.follower;
    const followeeId = relationship.followee;
    if (followeeId.equals(currentUserId)) {
      acc[followerId.toString()] = !acc[followerId.toString()]
        ? "followsCurrentUser"
        : "followEachOther";
    } else {
      acc[followeeId.toString()] = !acc[followeeId.toString()]
        ? "followedByCurrentUser"
        : "followEachOther";
    }
    return acc;
  }, {} as Record<string, any>);

  const postWithContent = post.toJSON() as Record<string, any>;
  postWithContent.isLiked = likedTargets.some((liked) =>
    liked.target.equals(postWithContent._id)
  );
  postWithContent.isReposted = repostedTargets.some((thread) =>
    thread.repost.equals(postWithContent._id)
  );
  postWithContent.isBookmarked = bookmarkedTargets.some((bookmark) =>
    bookmark.target.equals(postWithContent._id)
  );
  postWithContent.author = postWithContent.author.toJSON() as Record<
    string,
    any
  >;
  postWithContent.author.relationship =
    mappedRelationships[postWithContent.author._id.toString()];

  let repliesWithContent = replies.map((reply) => {
    let temp = reply.toJSON() as Record<string, any>;
    temp.isLiked = likedTargets.some((liked) => liked.target.equals(temp._id));
    temp.isReposted = repostedTargets.some((thread) =>
      thread.repost.equals(temp._id)
    );
    temp.isBookmarked = bookmarkedTargets.some((bookmark) =>
      bookmark.target.equals(temp._id)
    );
    temp.author = temp.author.toJSON() as Record<string, any>;
    temp.author.relationship = mappedRelationships[temp.author._id.toString()];
    return temp;
  });

  const replyChain = [postWithContent, ...repliesWithContent];
  const replyWithLinks = reply.toJSON() as Record<string, any>;
  replyWithLinks.links = replyChain;

  await Post.findByIdAndUpdate(targetIds[0], { $inc: { viewCount: 1 } });

  await Reply.updateMany(
    { _id: { $in: targetIds.slice(1) } },
    { $inc: { viewCount: 1 } }
  );

  return sendResponse(
    res,
    200,
    replyWithLinks,
    null,
    "Get Single Reply Successfully"
  );
});

export const createNewReply = catchAsync(async (req, res, next) => {
  const currentUserId = req.userId as Types.ObjectId;
  const { content, mediaFile, targetType, targetId, links } = req.body;

  // Check if post or reply exists
  const targetObj = await mongoose.model(targetType).findById(targetId);
  if (!targetObj)
    throw new AppError(404, `${targetType} Not Found`, "Create Reply Error");

  // Create new comment
  let reply = await Reply.create({
    content,
    mediaFile,
    targetType,
    target: targetId,
    author: currentUserId,
    links,
  });

  reply = await reply.populate("target");

  await UserThread.create({
    user: currentUserId,
    reply: reply._id,
  });

  const populatedReply = reply.toJSON() as Record<string, any>;
  const targetAuthor = new mongoose.Types.ObjectId(
    populatedReply.target.author
  );
  if (!targetAuthor.equals(currentUserId)) {
    await Notification.create({
      sender: currentUserId,
      event: "reply",
      recipient: populatedReply.target.author,
      reply: reply._id,
    });
  }

  // Update comment count of the reply
  const replyCount = await calculateReplyCount(targetId, targetType);
  reply = await reply.populate("author");

  return sendResponse(
    res,
    200,
    { reply, replyCount },
    null,
    "Create Reply Successfully"
  );
});

export const createRepostOfReply = catchAsync(async (req, res, next) => {
  const currentUserId = req.userId as Types.ObjectId;
  const { repostType, repostId } = req.body;

  const reply = await Reply.findById(repostId);
  if (!reply)
    throw new AppError(404, "Reply Not Found", "Create Repost Of Reply Error");

  let thread = await UserThread.findOne({
    user: currentUserId,
    repost: repostId,
  });
  if (thread)
    throw new AppError(
      409,
      "You already reposted this reply",
      "Create Repost Of Reply Error"
    );

  thread = await UserThread.create({
    user: currentUserId,
    repostType,
    repost: repostId,
  });

  let notif;

  if (!reply.author.equals(currentUserId)) {
    notif = await Notification.create({
      sender: currentUserId,
      event: "repost",
      recipient: reply.author,
      repostType: "Reply",
      repost: repostId,
    });
    notif = await notif.populate([
      { path: "sender" },
      { path: "repost", populate: "author" },
    ]);
  }

  await calculatePostCount(currentUserId);
  const repostCount = await calculateRepostCount(repostId);

  return sendResponse(
    res,
    200,
    { thread, repostCount, notif },
    null,
    "Repost Successfully"
  );
});

export const undoRepostOfReply = catchAsync(async (req, res, next) => {
  const currentUserId = req.userId as Types.ObjectId;
  const { repostId } = req.body;

  const reply = await Reply.findById(repostId);
  if (!reply) throw new AppError(404, "Post Not Found", "Undo Repost Error");

  let thread = await UserThread.findOne({ repost: repostId });
  if (!thread) throw new AppError(404, "Repost Not Found", "Undo Repost Error");

  await thread.delete();
  let notif = await Notification.findOneAndDelete({
    sender: currentUserId,
    event: "repost",
    recipient: reply.author,
    repostType: "Reply",
    repost: repostId,
  }).populate([{ path: "sender" }, { path: "repost", populate: "author" }]);

  await calculatePostCount(currentUserId);
  const repostCount = await calculateRepostCount(repostId);

  return sendResponse(
    res,
    200,
    { thread, repostCount, notif },
    null,
    "Undo Repost Successfully"
  );
});

export const updateSingleReply = catchAsync(async (req, res, next) => {
  const currentUserId = req.userId as Types.ObjectId;
  const replyId = req.params.id;

  let reply = await Reply.findById(replyId);
  if (!reply) throw new AppError(404, "Reply Not Found", "Update Reply Error");
  if (!reply.author.equals(currentUserId))
    throw new AppError(403, "User Not Authorized", "Update Reply Error");

  const allows: ("content" | "mediaFile")[] = ["content", "mediaFile"];

  allows.forEach((field) => {
    if (req.body[field] !== undefined) {
      reply[field] = req.body[field];
    }
  });
  await reply.save();

  return sendResponse(res, 200, reply, null, "Update Reply Successfully");
});

export const deleteSingleReply = catchAsync(async (req, res, next) => {
  const currentUserId = req.userId as Types.ObjectId;
  const replyId = req.params.id;

  const reply = await Reply.findById(replyId);
  if (!reply) throw new AppError(404, "Reply Not Found", "Delete Reply Error");
  if (!reply.author.equals(currentUserId))
    throw new AppError(403, "User Not Authorized", "Delete Reply Error");

  const relatedReplies = await Reply.find({ links: replyId });
  const relatedReplyIds = [
    reply._id,
    ...relatedReplies.map((reply) => reply._id),
  ];
  const relatedThreads = await UserThread.find({
    $or: [
      { reply: { $in: relatedReplyIds } },
      { repostType: "Reply", repost: { $in: relatedReplyIds } },
    ],
  });
  const relatedThreadIds = relatedThreads.map((thread) => thread._id);
  const relatedNotifs = await Notification.find({
    $or: [
      { mentionLocation: { $in: relatedReplyIds } },
      { repost: { $in: relatedReplyIds } },
      { reply: { $in: relatedReplyIds } },
    ],
  });
  const relatedNotifIds = relatedNotifs.map((notif) => notif._id);
  const relatedNotifRecipients = relatedNotifs.map((notif) => notif.recipient);

  await Bookmark.deleteMany({
    targetType: "Reply",
    target: { $in: relatedReplyIds },
  });
  await Like.deleteMany({
    targetType: "Reply",
    target: { $in: relatedReplyIds },
  });
  await UserThread.deleteMany({
    _id: { $in: relatedThreadIds },
  });
  await Notification.deleteMany({
    _id: { $in: relatedNotifIds },
  });
  await Reply.deleteMany({ _id: { $in: relatedReplyIds } });

  const replyCount = await calculateReplyCount(reply.target, reply.targetType);

  return sendResponse(
    res,
    200,
    { reply, replyCount, notifRecipients: relatedNotifRecipients },
    null,
    "Delete Reply Successfully"
  );
});
