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
    const userId = req.user.id;

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

export const saveMessage = async (data) => {
  const { from, to, message, files = [], } = data;

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
    files,
    read: false
  });

  conversation.lastMessage = {
    text: message || (files.length && files[files.length-1].fileName),
    sender: from,
    createdAt: messageDoc.createdAt
  };

  await conversation.save();

  return { conversation, messageDoc };
}

export const saveCallMessage = async (data) => {
  const { from, to, isVideoCall = false } = data;
  const participants = [from, to].sort();
  const callType = isVideoCall ? "video" : "audio";
  const text = isVideoCall ? "Video call" : "Voice call";

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
    text,
    messageType: "call",
    call: {
      type: callType,
    },
    read: false,
  });

  conversation.lastMessage = {
    text,
    sender: from,
    createdAt: messageDoc.createdAt,
  };

  await conversation.save();

  return { conversation, messageDoc };
};
