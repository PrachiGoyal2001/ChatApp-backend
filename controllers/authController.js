import bcrypt from "bcryptjs";
import User from "../models/User.js";
import { createToken, verifyToken } from "../utils/jwt.js";

export const register = async (req, res) => {
  try {
    const { username, password, email } = req.body;
    if (!username?.trim() || !password || !email?.trim()) {
      return res.status(400).json({ message: "All fields required" });
    }
    const existingUser = await User.findOne({
      $or: [{ username }, { email }],
    });

    if (existingUser) {
      if (existingUser.username === username) {
        return res.status(400).json({ message: "Username already exists" });
      }
      if (existingUser.email === email) {
        return res.status(400).json({ message: "Email already exists" });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      username: username.trim(),
      email: email.trim().toLowerCase(),
      password: hashedPassword,
    });

    const token = createToken({ userId: newUser._id.toString() });

    res.status(201).json({
      message: "User registered and logged in successfully",
      userId: newUser._id,
      token,
    });
  } catch (err) {
    res.status(500).json({
      message: "Something went wrong",
      error: err.message,
    });
  }
};

export const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ username });

    if (user && (await bcrypt.compare(password, user.password))) {
      const token = createToken({ userId: user._id.toString() });

      return res.status(200).json({
        message: "Logged in Successfully",
        userId: user._id,
        token,
      });
    }

    return res.status(401).json({ message: "Invalid credentials" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

export const checkAuth = (req, res) => {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  const payload = verifyToken(token);

  if (payload?.userId) {
    return res.json({ loggedIn: true, user: payload.userId });
  }

  res.json({ loggedIn: false });
};

export const logout = (req, res) => {
  res.status(200).json({ message: "Logged out Successfully" });
};
