import express from "express";
import {
  getProfile,
  getUsersList,
  searchUsers,
  startConversation
} from "../controllers/userController.js";
import { isAuthenticated } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/profile", isAuthenticated, getProfile);
router.get("/search", isAuthenticated, searchUsers);
router.post("/start-conversation", isAuthenticated, startConversation);
router.get("/getUsersList", isAuthenticated, getUsersList);
export default router;
