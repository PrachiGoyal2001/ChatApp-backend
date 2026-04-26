import express from "express";
import {
  // sendMessage,
  getConversations,
  getMessages,
  markAsRead
} from "../controllers/messageController.js";
import { isAuthenticated } from "../middleware/authMiddleware.js";

const router = express.Router();

// router.post("/send", isAuthenticated, sendMessage);
router.get("/conversations", isAuthenticated, getConversations);
router.get("/:conversationId", isAuthenticated, getMessages);
router.post("/read", isAuthenticated, markAsRead);

export default router;
