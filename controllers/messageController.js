import Message from "../models/Message.js";
import Conversation from "../models/Conversation.js";
import mongoose from "mongoose";

export const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;

    const messages = await Message.find({ conversationId }).sort({
      createdAt: 1,
    });

    res.json([
      ...messages
    ]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const markAsRead = async (req, res) => {
  try {
    const { conversationId } = req.body;
    const userId = req.session.userId;

    await Message.updateMany(
      {
        conversationId,
        receiver: userId,
        read: false,
      },
      { $set: { read: true } },
    );

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const saveMessage = async (data)=> {
  const { from, to, message } = data;

  const participants = [from, to].sort();

  let conversation = await Conversation.findOne({
    participants: { $all: participants },
  });

  if (!conversation) {
    conversation = await Conversation.create({
      participants,
    });
  }

  const messageDoc = await Message.create({
    conversationId: conversation._id,
    sender: from,
    receiver: to,
    text: message,
    read: false
  });

  conversation.lastMessage = {
    text: message,
    sender: from,
    createdAt: messageDoc.createdAt
  };

  await conversation.save();

  return { conversation, messageDoc };
}