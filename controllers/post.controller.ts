import { Types } from "mongoose";
import Post from "../models/Post";
import User from "../models/User";
import { AppError, catchAsync, sendResponse } from "../helpers/utils";
import UserThread from "../models/UserThread";
import Follow from "../models/Follow";
import Like from "../models/Like";
import Bookmark from "../models/Bookmark";
import Reply from "../models/Reply";

const calculatePostCount = async (userId: Types.ObjectId) => {
  const postCount = await UserThread.countDocuments({
    user: userId,
    isDeleted: false,
  });

  await User.findByIdAndUpdate(userId, { postCount });
};

const calculateRepostCount = async (postId: Types.ObjectId) => {
  const repostCount = await UserThread.countDocuments({
    repostType: "Post",
    repost: postId,
  });

  await Post.findByIdAndUpdate(postId, { repostCount });
  return repostCount;
};

export const createNewPost = catchAsync(async (req, res, next) => {
  const currentUserId = req.userId as Types.ObjectId;
  const { content, mediaFile } = req.body;

  const post = await Post.create({
    content,
    mediaFile,
    author: currentUserId,
  });

  let thread = await UserThread.create({
    user: currentUserId,
    post: post._id,
  });

  await calculatePostCount(currentUserId);
  thread = await thread.populate({
    path: "post",
    populate: { path: "author" },
  });

  return sendResponse(res, 200, thread, null, "Create Post Successfully");
});

export const createRepostOfPost = catchAsync(async (req, res, next) => {
  const currentUserId = req.userId as Types.ObjectId;
  const { repostType, repostId } = req.body;

  const post = await Post.findById(repostId);
  if (!post) throw new AppError(404, "Post Not Found", "Create Repost Error");

  let thread = await UserThread.findOne({
    user: currentUserId,
    repost: repostId,
  });
  if (thread)
    throw new AppError(
      409,
      "You already reposted this post",
      "Create Repost Error"
    );

  thread = await UserThread.create({
    user: currentUserId,
    repostType,
    repost: repostId,
  });

  await calculatePostCount(currentUserId);
  const repostCount = await calculateRepostCount(repostId);
  thread = await thread.populate("repost");

  return sendResponse(
    res,
    200,
    { thread, repostCount },
    null,
    "Repost Successfully"
  );
});

export const undoRepostOfPost = catchAsync(async (req, res, next) => {
  const currentUserId = req.userId as Types.ObjectId;
  const { repostId } = req.body;

  const post = await Post.findById(repostId);
  if (!post) throw new AppError(404, "Post Not Found", "Undo Repost Error");

  let thread = await UserThread.findOne({ repost: repostId });
  if (!thread) throw new AppError(404, "Repost Not Found", "Undo Repost Error");

  await thread.delete();
  await calculatePostCount(currentUserId);
  const repostCount = await calculateRepostCount(repostId);

  return sendResponse(
    res,
    200,
    { thread, repostCount },
    null,
    "Repost Successfully"
  );
});

export const updateSinglePost = catchAsync(async (req, res, next) => {
  const currentUserId = req.userId as Types.ObjectId;
  const postId = req.params.id;

  let post = await Post.findById(postId);
  if (!post) throw new AppError(404, "Post Not Found", "Update Post Error");
  if (!post.author.equals(currentUserId))
    throw new AppError(403, "User Not Authorized", "Update Post Error");

  const allows: ("content" | "mediaFile")[] = ["content", "mediaFile"];

  allows.forEach((field) => {
    if (req.body[field] !== undefined) {
      post[field] = req.body[field];
    }
  });
  await post.save();

  // post = await Post.findByIdAndUpdate(postId, req.body, { new: true });

  return sendResponse(res, 200, post, null, "Update Post Successfully");
});

export const getSinglePost = catchAsync(async (req, res, next) => {
  const currentUserId = req.userId;
  const postId = req.params.id;

  let post = await Post.findById(postId).populate("author");
  if (!post) throw new AppError(404, "Post Not Found", "Get Single Post Error");

  const isLiked = !!(await Like.findOne({
    author: currentUserId,
    targetType: "Post",
    target: post._id,
  }));

  const isReposted = !!(await UserThread.findOne({
    user: currentUserId,
    repostType: "Post",
    repost: post._id,
  }));

  const isBookmarked = !!(await Bookmark.findOne({
    user: currentUserId,
    targetType: "Post",
    target: post._id,
  }));

  const relationship = await Follow.find({
    $or: [
      { follower: currentUserId, followee: post.author },
      {
        follower: post.author,
        followee: currentUserId,
      },
    ],
  });

  const postWithContent = post.toJSON() as Record<string, any>;
  postWithContent.isLiked = isLiked;
  postWithContent.isReposted = isReposted;
  postWithContent.isBookmarked = isBookmarked;
  postWithContent.author = postWithContent.author.toJSON() as Record<
    string,
    any
  >;
  postWithContent.author.relationship = !relationship.length
    ? undefined
    : relationship.length === 2
    ? "followEachOther"
    : relationship[0].follower.equals(post.author)
    ? "followsCurrentUser"
    : "followedByCurrentUser";

  await Post.findByIdAndUpdate(postId, { $inc: { viewCount: 1 } });

  return sendResponse(
    res,
    200,
    postWithContent,
    null,
    "Get Single Post Successfully"
  );
});

export const getAllOriginalPosts = catchAsync(async (req, res, next) => {
  const currentUserId = req.userId as Types.ObjectId;
  let { page, limit, ...filter } = req.query as unknown as {
    page: number;
    limit: number;
    [key: string]: any;
  };

  page = page || 1;
  limit = limit || 10;

  const filterConditions: Record<string, any>[] = [
    { repost: { $eq: undefined } },
    { reply: { $eq: undefined } },
  ];

  if (filter.ignoreCurrent) {
    filterConditions.push({ user: { $ne: currentUserId } });
  }

  const filterCriteria = filterConditions.length
    ? { $and: filterConditions }
    : {};

  const count = await UserThread.countDocuments(filterCriteria);
  const totalPages = Math.ceil(count / limit);

  let posts = await UserThread.find(filterCriteria)
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip((page - 1) * limit)
    .populate({ path: "post", populate: { path: "author" } })
    .populate("user");

  const postIds = posts.map((post) => post.post);

  const likedPosts = await Like.find({
    author: currentUserId,
    targetType: "Post",
    target: { $in: postIds },
  });

  const repostedPosts = await UserThread.find({
    user: currentUserId,
    repostType: "Post",
    repost: { $in: postIds },
  });

  const bookmarkedPosts = await Bookmark.find({
    user: currentUserId,
    targetType: "Post",
    target: { $in: postIds },
  });

  const authorIds = posts.map((post) => {
    let temp = post.toJSON() as Record<string, any>;
    return temp.post ? temp.post.author._id : temp.reply.author._id;
  });

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

  const fields = ["post"];

  let postsWithContent = posts.map((post) => {
    let temp = post.toJSON() as Record<string, any>;
    fields.forEach((field) => {
      if (temp[field]) {
        temp[field] = temp[field].toJSON() as Record<string, any>;
        temp[field].isLiked = likedPosts.some((like) =>
          like.target.equals(temp[field]._id)
        );
        temp[field].isReposted = repostedPosts.some((thread) =>
          thread.repost.equals(temp[field]._id)
        );
        temp[field].isBookmarked = bookmarkedPosts.some((bookmark) =>
          bookmark.target.equals(temp[field]._id)
        );
        temp[field].author = temp[field].author.toJSON() as Record<string, any>;
        temp[field].author.relationship =
          mappedRelationships[temp[field].author._id.toString()];
      }
    });

    return temp;
  });

  if (filter.searchText) {
    postsWithContent = postsWithContent.filter((post) =>
      post.post.content.toLowerCase().includes(filter.searchText.toLowerCase())
    );
  }

  await Post.updateMany({ _id: { $in: postIds } }, { $inc: { viewCount: 1 } });

  return sendResponse(
    res,
    200,
    { posts: postsWithContent, totalPages, count },
    null,
    "Get All Original Posts Successfully!"
  );
});

export const getThreadsOfFolloweesAndCurrentUser = catchAsync(
  async (req, res, next) => {
    const currentUserId = req.userId as Types.ObjectId;
    let { page, limit } = req.query as unknown as {
      page: number;
      limit: number;
    };

    let followList = await Follow.find({
      follower: currentUserId,
    });

    const followeeIDs = [
      ...followList.map((follow) => follow.followee),
      currentUserId,
    ];

    page = page || 1;
    limit = limit || 10;

    const filterConditions = [{ user: { $in: followeeIDs } }];

    const filterCriteria = filterConditions.length
      ? { $and: filterConditions }
      : {};

    const count = await UserThread.countDocuments(filterCriteria);
    const totalPages = Math.ceil(count / limit);

    let posts = await UserThread.find(filterCriteria)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit)
      .populate("user")
      .populate({ path: "post", populate: "author" })
      .populate({ path: "repost", populate: "author" })
      .populate({
        path: "reply",
        populate: [{ path: "author" }, { path: "target", populate: "author" }],
      });

    const postIds = posts.map((post) => post.post || post.repost || post.reply);

    const likedPosts = await Like.find({
      author: currentUserId,
      target: { $in: postIds },
    });

    const repostedPosts = await UserThread.find({
      user: currentUserId,
      repost: { $in: postIds },
    });

    const bookmarkedPosts = await Bookmark.find({
      user: currentUserId,
      target: { $in: postIds },
    });

    const authorIds = posts.map((post) => {
      let temp = post.toJSON() as Record<string, any>;
      return temp.post
        ? temp.post.author._id
        : temp.repost
        ? temp.repost.author._id
        : temp.reply.author._id;
    });

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

    const fields = ["post", "repost", "reply"];

    const postsWithContent = posts.map((post) => {
      let temp = post.toJSON() as Record<string, any>;
      fields.forEach((field) => {
        if (temp[field]) {
          temp[field] = temp[field].toJSON() as Record<string, any>;
          temp[field].isLiked = likedPosts.some((like) =>
            like.target.equals(temp[field]._id)
          );
          temp[field].isReposted = repostedPosts.some((thread) =>
            thread.repost.equals(temp[field]._id)
          );
          temp[field].isBookmarked = bookmarkedPosts.some((bookmark) =>
            bookmark.target.equals(temp[field]._id)
          );
          temp[field].author = temp[field].author.toJSON() as Record<
            string,
            any
          >;
          temp[field].author.relationship =
            mappedRelationships[temp[field].author._id.toString()];
        }
      });
      return temp;
    });

    await Post.updateMany(
      { _id: { $in: postIds } },
      { $inc: { viewCount: 1 } }
    );

    return sendResponse(
      res,
      200,
      { posts: postsWithContent, totalPages, count },
      null,
      "Get Post List of Followees Successfully!"
    );
  }
);

export const getPostsOfSingleUser = catchAsync(async (req, res, next) => {
  const currentUserId = req.userId as Types.ObjectId;
  const { userId } = req.params as unknown as { userId: Types.ObjectId };
  let { page, limit, ...filter } = req.query as unknown as {
    page: number;
    limit: number;
    [key: string]: any;
  };

  page = page || 1;
  limit = limit || 10;

  const user = await User.findById(userId);
  if (!user)
    throw new AppError(404, "User Not Found", "Get Posts of Single User Error");

  let filterConditions: Record<string, any>[] = [
    { user: userId },
    { reply: { $eq: undefined } },
  ];

  if (filter.original) {
    filterConditions = filterConditions.filter(
      (condition) => !Object.keys(condition).includes("reply")
    );
    filterConditions.push({ repost: { $eq: undefined } });
  }

  const filterCriteria = filterConditions.length
    ? { $and: filterConditions }
    : {};

  const count = await UserThread.countDocuments(filterCriteria);
  const totalPages = Math.ceil(count / limit);

  let posts = await UserThread.find(filterCriteria)
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip((page - 1) * limit)
    .populate("user")
    .populate({ path: "post", populate: "author" })
    .populate({
      path: "reply",
      populate: [{ path: "author" }, { path: "target", populate: "author" }],
    })
    .populate({ path: "repost", populate: "author" });

  const postIds = posts.map((post) => post.post || post.repost);

  const likedPosts = await Like.find({
    author: currentUserId,
    targetType: "Post",
    target: { $in: postIds },
  });

  const repostedPosts = await UserThread.find({
    user: currentUserId,
    repostType: "Post",
    repost: { $in: postIds },
  });

  const bookmarkedPosts = await Bookmark.find({
    user: currentUserId,
    targetType: "Post",
    target: { $in: postIds },
  });

  const authorIds = posts.map((post) => {
    let temp = post.toJSON() as Record<string, any>;
    return temp.post
      ? temp.post.author._id
      : temp.repost
      ? temp.repost.author._id
      : temp.reply.author._id;
  });

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

  const fields = ["post", "repost", "reply"];

  const postsWithContent = posts.map((post) => {
    let temp = post.toJSON() as Record<string, any>;
    fields.forEach((field) => {
      if (temp[field]) {
        temp[field] = temp[field].toJSON() as Record<string, any>;
        temp[field].isLiked = likedPosts.some((like) =>
          like.target.equals(temp[field]._id)
        );
        temp[field].isReposted = repostedPosts.some((thread) =>
          thread.repost.equals(temp[field]._id)
        );
        temp[field].isBookmarked = bookmarkedPosts.some((bookmark) =>
          bookmark.target.equals(temp[field]._id)
        );
        temp[field].author = temp[field].author.toJSON() as Record<string, any>;
        temp[field].author.relationship =
          mappedRelationships[temp[field].author._id.toString()];
      }
    });
    return temp;
  });

  await Post.updateMany({ _id: { $in: postIds } }, { $inc: { viewCount: 1 } });

  return sendResponse(
    res,
    200,
    { posts: postsWithContent, totalPages, count },
    null,
    "Get Post List of Single User Successfully!"
  );
});

export const deleteSinglePost = catchAsync(async (req, res, next) => {
  const currentUserId = req.userId as Types.ObjectId;
  const postId = req.params.id;

  const post = await Post.findById(postId);
  if (!post) throw new AppError(404, "Post Not Found", "Delete Post Error");
  if (!post.author.equals(currentUserId))
    throw new AppError(403, "User Not Authorized", "Delete Post Error");

  const relatedReplies = await Reply.find({ links: postId });
  const relatedReplyIds = relatedReplies.map((reply) => reply._id);
  const relatedReplyAndPostIds = [post._id, ...relatedReplyIds];

  await Bookmark.deleteMany({ target: { $in: relatedReplyAndPostIds } });
  await Like.deleteMany({ target: { $in: relatedReplyAndPostIds } });
  await UserThread.deleteMany({
    $or: [
      { post: postId },
      { reply: { $in: relatedReplyIds } },
      { repost: { $in: relatedReplyAndPostIds } },
    ],
  });
  await Reply.deleteMany({ _id: { $in: relatedReplyIds } });
  await post.delete();
  await calculatePostCount(currentUserId);

  return sendResponse(res, 200, post, null, "Delete Post Successfully");
});
