import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const mongoUrl = "mongodb://localhost:27017/chatAppDb";
    await mongoose.connect(mongoUrl, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ MongoDB connected");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err);
  }
};

export default connectDB;
