import express from "express";
import session from "express-session";
import MongoStore from "connect-mongo";
import cors from "cors";
import { createServer } from "http";
import connectDB from "./config/db.js";
import { setupWebSocket } from "./websocket/socketHandler.js";

import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";

const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URL = process.env.MONGO_URL || "mongodb://localhost:27017/chatAppDb";

await connectDB();

app.use(cors({
  origin: "http://localhost:9000",
  credentials: true,
}));

app.use(express.json());

app.use(session({
  secret: process.env.SESSION_SECRET || "secret",
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: MONGO_URL }),
}));

app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use("/messages", messageRoutes);

const server = createServer(app);
setupWebSocket(server);

server.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
});
