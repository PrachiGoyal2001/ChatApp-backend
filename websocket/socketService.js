import Message from "../models/Message.js";
import Conversation from "../models/Conservation.js";

export const handlePrivateMessage = async (data) => {
  let conversation = await Conversation.findOne({
    participants: { $all: [data.from, data.to] },
  });

  if (!conversation) {
    conversation = await Conversation.create({
      participants: [data.from, data.to],
    });
  }

  const messageDoc = await Message.create({
    conversationId: conversation._id,
    senderId: data.from,
    content: data.message,
  });

  return { conversation, messageDoc };
};
