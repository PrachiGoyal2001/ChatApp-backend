import Conversation from "../models/Conversation.js";
import mongoose from "mongoose";
import User from "../models/User.js";

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

export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("_id username email createdAt updatedAt");
    console.log("user", req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const searchUsers = async (req, res) => {
  try {
    const userId = req.user.id;
    const query = req.query.q?.trim();

    if (!query) {
      return res.json([]);
    }

    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    const users = await User.find({
      _id: { $ne: userId },
      $or: [
        { username: { $regex: escapedQuery, $options: "i" } },
        { email: { $regex: `^[^@]*${escapedQuery}`, $options: "i" } },
      ],
    })
      .select("_id username email")
      .limit(20);

    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const startConversation = async (req, res) => {
  try {
    const userId = req.user.id;
    const { userId: otherUserId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(otherUserId) || otherUserId === userId) {
      return res.status(400).json({ message: "Invalid user" });
    }

    const otherUser = await User.findById(otherUserId).select("_id username email");

    if (!otherUser) {
      return res.status(404).json({ message: "User not found" });
    }

    let conversation = await Conversation.findOne({
      participants: {
        $all: [userId, otherUserId],
        $size: 2,
      },
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [userId, otherUserId],
      });
    }

    res.json({
      _id: conversation._id,
      otherUser,
      lastMessage: conversation.lastMessage,
      unreadCount: 0,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
