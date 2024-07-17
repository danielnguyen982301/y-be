import { PipelineStage, Types } from "mongoose";
import { AppError, catchAsync, sendResponse } from "../helpers/utils";
import Hashtag from "../models/Hashtag";
import Post from "../models/Post";

export const getHashTags = catchAsync(async (req, res, next) => {
  const { searchText } = req.query as unknown as {
    searchText: string;
  };

  // const filterConditions: Record<string, any>[] = [];
  let filterConditions: Record<string, any> = {};

  if (searchText) {
    filterConditions = {
      ...filterConditions,
      name: { $regex: searchText, $options: "i" },
    };
  }

  const pipeline: PipelineStage[] = [
    {
      $match: filterConditions,
    },
    {
      $addFields: {
        postCount: { $size: "$posts" },
      },
    },
    {
      $sort: { postCount: -1 },
    },
  ];

  if (searchText !== undefined) pipeline.push({ $limit: 10 });

  const hashtags = await Hashtag.aggregate(pipeline);

  return sendResponse(
    res,
    200,
    { hashtags },
    null,
    "Get HashTags Successfully"
  );
});

export const createHashtag = catchAsync(async (req, res, next) => {
  const { hashtags, postId } = req.body as {
    hashtags: string[];
    postId: Types.ObjectId;
  };

  const post = await Post.findById(postId);
  if (!post) throw new AppError(404, "Post Not Found", "Create Hashtag Error");

  const newHashtags: { name: string; [key: string]: any }[] = [];

  await Promise.all(
    hashtags.map(async (name: string) => {
      let hashtag = await Hashtag.findOne({ name });
      if (!hashtag) {
        hashtag = await Hashtag.create({ name });
        newHashtags.push(hashtag);
      }
      hashtag.posts.push(postId);
      hashtag = await hashtag.save();
      post.hashtags.push(hashtag._id);
      await post.save();
      // return hashtag;
    })
  );

  // const hashTagsOfPost = await Promise.all(promises);

  return sendResponse(
    res,
    200,
    newHashtags,
    null,
    "Create Hashtags Of Post Successfully"
  );
});
