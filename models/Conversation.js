import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema({
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }],
  lastMessage: {
    text: { type: String, default: "" },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    createdAt:{ type: Date }
  }
}, { timestamps: true });

conversationSchema.index({ participants: 1 });

const Conversation = mongoose.model("Conversation", conversationSchema);
export default Conversation;
