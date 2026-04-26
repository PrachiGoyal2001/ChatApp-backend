import express from "express";
import {
  getUserDetails,
} from "../controllers/userController.js";
import { isAuthenticated } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/getUserDetails/:userId", isAuthenticated, getUserDetails);

export default router;
