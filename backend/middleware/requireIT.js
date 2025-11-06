
export const requireIT = (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: "Unauthorized" });
  if (req.user.isIT) return next();
  return res.status(403).json({ message: "Access denied. IT staff only." });
};
