import Message from "../models/Message.js";
import Conversation from "../models/Conversation.js";

export const handlePrivateMessage = async (data) => {
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
};
