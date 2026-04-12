import User from "../models/User.js";
import Conversation from "../models/Conservation.js";
import Message from "../models/Message.js";
import mongoose from "mongoose";

export const getUsersWithLastMessage = async (req, res) => {
  try {
    const myId = new mongoose.Types.ObjectId(req.session.userId);

    const users = await User.find(
      { _id: { $ne: myId } },
      { password: 0 }
    );

    const result = await Promise.all(
      users.map(async (user) => {
        const conversation = await Conversation.findOne({
          participants: { $all: [myId, user._id] },
        });

        if (!conversation) {
          return { ...user.toObject(), lastMessage: null };
        }

        const lastMessage = await Message.findOne({
          conversationId: conversation._id,
        })
          .sort({ createdAt: -1 })
          .populate("senderId", "username");

        return {
          ...user.toObject(),
          lastMessage: lastMessage
            ? {
                content: lastMessage.content,
                time: lastMessage.createdAt,
                sender: lastMessage.senderId,
              }
            : null,
        };
      })
    );

    result.sort((a, b) => {
      const timeA = a.lastMessage?.time
        ? new Date(a.lastMessage.time).getTime()
        : 0;
      const timeB = b.lastMessage?.time
        ? new Date(b.lastMessage.time).getTime()
        : 0;

      return timeB - timeA;
    });

    res.json(result);
  } catch (err) {
    res.status(500).send("Server error");
  }
};

export const getUserDetails = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select("username");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (err) {
    res.status(500).send("Server error");
  }
};
