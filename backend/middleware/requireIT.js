
export const requireIT = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized: no user data in token" });
  }

  if (req.user.role === 'IT') {
    return next(); 
  }

  return res.status(403).json({ message: "Access denied. IT role required." });
};
