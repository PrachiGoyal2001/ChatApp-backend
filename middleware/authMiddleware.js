export const isAuthenticated = (req, res, next) => {
  if (!req.session?.userId) {
    return res.status(401).json({
      message: "Unauthorized",
    });
  }

  // attach user info to request
  req.user = {
    id: req.session.userId
  };

  next();
};
