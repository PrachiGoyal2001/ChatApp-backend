import express from "express";
import {
  getUsersList
} from "../controllers/userController.js";
import { isAuthenticated } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/getUsersList", isAuthenticated, getUsersList);
export default router;
