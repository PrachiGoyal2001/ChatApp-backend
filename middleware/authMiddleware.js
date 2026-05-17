import { verifyToken } from "../utils/jwt.js";

export const isAuthenticated = (req, res, next) => {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  const payload = verifyToken(token);

  if (!payload?.userId) {
    return res.status(401).json({
      message: "Unauthorized",
    });
  }

  // attach user info to request
  req.user = {
    id: payload.userId
  };

  next();
};
