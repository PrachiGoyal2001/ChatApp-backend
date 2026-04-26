import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  conversationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Conversation",
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  text: {
    type: String,
    trim: true,
    required: true
  },
  read: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

// ✅ ADD INDEXES HERE
messageSchema.index({ conversationId: 1, createdAt: 1 });
messageSchema.index({ receiver: 1, read: 1 });

const Message = mongoose.model("Message", messageSchema);
export default Message;
