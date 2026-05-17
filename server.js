import express from "express";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import connectDB from "./config/db.js";
import dotenv from "dotenv";

import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";

// ✅ import new socket setup
import { initSocket } from "./sockets/socket.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

await connectDB();

app.set("trust proxy", 1);

app.use(cors({
  origin:  [
    "http://localhost:9000",
    "https://chat-app-frontend-smoky-seven.vercel.app"
  ],
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

app.use(express.json());

// ✅ ROUTES
app.use("/uploads", express.static("uploads"));
app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use("/messages", messageRoutes);
app.use("/upload", uploadRoutes);

// ✅ CREATE HTTP SERVER
const server = createServer(app);

// ✅ INITIALIZE SOCKET.IO
const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:9000",
      "https://chat-app-frontend-smoky-seven.vercel.app"
    ],
    allowedHeaders: ["Authorization"]
  }
});

// ✅ THEN INIT SOCKET
initSocket(io);

// ✅ START SERVER
server.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
});
