import mongoose from "mongoose";

const ConversationSchema = new mongoose.Schema({
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const Conversation = mongoose.model("Conversation", ConversationSchema);
export default Conversation;
