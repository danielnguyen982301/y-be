import { PipelineStage, Types } from "mongoose";

import { catchAsync, sendResponse } from "../../helpers/utils";
import Hashtag from "../../models/Hashtag";

export const getHashTags = catchAsync(async (req, res, next) => {
  const { searchText } = req.query as unknown as {
    searchText: string;
  };

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
    {
      $limit: 10,
    },
  ];

  const hashtags = await Hashtag.aggregate(pipeline);

  return sendResponse(
    res,
    200,
    { hashtags },
    null,
    "Get HashTags Successfully"
  );
});
