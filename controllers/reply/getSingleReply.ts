import { Types } from "mongoose";

import { AppError, catchAsync, sendResponse } from "../../helpers/utils";
import Reply from "../../models/Reply";
import UserThread from "../../models/UserThread";
import Follow from "../../models/Follow";
import Like from "../../models/Like";
import Post from "../../models/Post";
import Bookmark from "../../models/Bookmark";

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
