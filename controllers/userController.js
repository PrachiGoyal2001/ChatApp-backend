import User from "../models/User.js";

export const getUserDetails = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select("username");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (err) {
    res.status(500).send("Server error");
  }
};