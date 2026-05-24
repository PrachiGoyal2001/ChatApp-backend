import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";

import User from "../models/User.js";
import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";

dotenv.config();

const password=await bcrypt.hash("123456", 10);
// DB CONNECT
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    console.log("MongoDB Connected");
  } catch (err) {
    console.error("DB Connection Error:", err.message);
    process.exit(1);
  }
};

// SEED FUNCTION
const seedData = async () => {
  try {
    console.log("Seeding started...");

    // Clear old data
    await User.deleteMany();
    await Conversation.deleteMany();
    await Message.deleteMany();

    console.log("Old data cleared");

    // Create Users
    const user1 = await User.create({
      username: "John",
      email: "john@gmail.com",
      password: password,
    });

    const user2 = await User.create({
      username: "Mike",
      email: "mike@gmail.com",
      password: password,
    });

    const user3 = await User.create({
      username: "Alex",
      email: "alex@gmail.com",
      password: password,
    });

    console.log("Users created");

    const conv1 = await Conversation.create({
      participants: [user1._id, user2._id],
      lastMessage: {
        text: "Hey Mike, how are you?",
        sender: user1._id,
        createdAt: new Date(),
      },
    });

    const conv2 = await Conversation.create({
      participants: [user1._id, user3._id],
      lastMessage: {
        text: "Hi Alex!",
        sender: user1._id,
        createdAt: new Date(),
      },
    });

    console.log("Conversations created");

    await Message.insertMany([
      {
        conversationId: conv1._id,
        sender: user1._id,
        receiver: user2._id,
        text: "Hey Mike",
        read: true,
      },
      {
        conversationId: conv1._id,
        sender: user2._id,
        receiver: user1._id,
        text: "Hey John!",
        read: false,
      },
      {
        conversationId: conv1._id,
        sender: user1._id,
        receiver: user2._id,
        text: "How are you?",
        read: false,
      },
    ]);

    await Message.insertMany([
      {
        conversationId: conv2._id,
        sender: user1._id,
        receiver: user3._id,
        text: "Hi Alex",
        read: true,
      },
      {
        conversationId: conv2._id,
        sender: user3._id,
        receiver: user1._id,
        text: "Hello John!",
        read: false,
      },
    ]);

    console.log("Messages created");

    console.log("SEEDING COMPLETED SUCCESSFULLY");

    process.exit();
  } catch (err) {
    console.error("Seeding Error:", err.message);
    process.exit(1);
  }
};

connectDB().then(seedData);
