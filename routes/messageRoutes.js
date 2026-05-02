import express from "express";
import {
  getMessages,
  markAsRead
} from "../controllers/messageController.js";
import { isAuthenticated } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/:conversationId", isAuthenticated, getMessages);
router.post("/read", isAuthenticated, markAsRead);

export default router;
