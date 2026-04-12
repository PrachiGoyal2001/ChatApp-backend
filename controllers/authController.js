import bcrypt from "bcryptjs";
import User from "../models/User.js";

export const register = async (req, res) => {
  try {
    const { username, password, email } = req.body;

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

    await User.create({
      username,
      email,
      password: hashedPassword,
    });

    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    res.status(500).json({
      message: "Something went wrong",
      error: err.message,
    });
  }
};

export const login = async (req, res) => {
  const { username, password } = req.body;

  const user = await User.findOne({ username });

  if (user && (await bcrypt.compare(password, user.password))) {
    req.session.userId = user.id;

    return res.status(200).json({
      message: "Logged in Successfully",
      userId: user.id,
    });
  }

  return res.status(401).json({ message: "Invalid credentials" });
};

export const checkAuth = (req, res) => {
  if (req.session?.userId) {
    return res.json({ loggedIn: true, user: req.session.userId });
  }
  res.json({ loggedIn: false });
};

export const logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).send("Logout failed");

    res.clearCookie("connect.sid");
    res.status(200).json({ message: "Logged out Successfully" });
  });
};
