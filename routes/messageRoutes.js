import express from "express";
import Message from "../models/Message.js";
import Conversation from "../models/Conservation.js";
import mongoose from "mongoose";

const router = express.Router();

router.get("/:userId", async (req, res) => {
  try {

    const myId = new mongoose.Types.ObjectId(String(req.session.userId));
    const userId = new mongoose.Types.ObjectId(String(req.params.userId));

    const conversation = await Conversation.findOne({
      participants: { $all: [myId, userId] },
    });

    if (!conversation) return res.json([]);

    const messages = await Message.find({ conversationId: conversation._id })
      .sort({ createdAt: 1 })
      .populate("senderId", "username");

    res.json(messages);
  } catch (err) {
    console.error("Error fetching messages:", err);
    res.status(500).send("Server error while fetching messages");
  }
});
export default router;
