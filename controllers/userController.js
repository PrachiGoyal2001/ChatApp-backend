import Conversation from "../models/Conversation.js";
import mongoose from "mongoose";

export const getUsersList = async (req, res) => {
  try {
    const userId = req.user.id;
    const objectUserId = new mongoose.Types.ObjectId(userId);

    const conversations = await Conversation.aggregate([
      {
        $match: {
          participants: objectUserId,
        },
      },
      {
        $lookup: {
          from: "users", // Check from User Collection
          localField: "participants", // check from above $match participants
          foreignField: "_id", // check _id from user Schema
          as: "users", //output as users
        },
      },
      {
        $addFields: {
          otherUser: {
            $arrayElemAt: [
              {
                $filter: {
                  input: "$users",
                  as: "u",
                  cond: { $ne: ["$$u._id", objectUserId] },
                },
              },
              0,
            ],
          },
        },
      },
      {
        $lookup: {
          from: "messages",
          let: { convId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$conversationId", "$$convId"] },
                    { $eq: ["$receiver", objectUserId] },
                    { $eq: ["$read", false] },
                  ],
                },
              },
            },
            { $count: "count" },
          ],
          as: "unreadData",
        },
      },
      {
        $addFields: {
          unreadCount: {
            $ifNull: [{ $arrayElemAt: ["$unreadData.count", 0] }, 0],
          },
        },
      },
      {
        $project: {
          _id: 1,
          otherUser: { _id: 1, username: 1, email: 1 },
          lastMessage: 1,
          unreadCount: 1,
        },
      },
      { $sort: { "lastMessage.createdAt": -1, updatedAt: -1 } },
    ]);
    res.json(conversations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};