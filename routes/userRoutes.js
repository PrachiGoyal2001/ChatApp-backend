import express from "express";
import {
  getUsersWithLastMessage,
  getUserDetails,
} from "../controllers/userController.js";
import { isAuthenticated } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", isAuthenticated, getUsersWithLastMessage);
router.get("/getUserDetails/:userId", isAuthenticated, getUserDetails);

export default router;
