import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

export const protect = async (req, res, next) => {
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return res.status(500).json({ message: "Server misconfiguration" });
    }

    const header = req.headers.authorization;

    if (!header?.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const token = header.slice(7).trim();
    if (!token) {
      return res.status(401).json({ message: "Authentication required" });
    }

    let payload;
    try {
      payload = jwt.verify(token, secret);
    } catch (error) {
      return res.status(401).json({ message: "Invalid or expired token" });
    }

    const userId = payload.sub;
    if (!userId) {
      return res.status(401).json({ message: "Invalid token payload" });
    }

    const user = await User.findById(userId).select("-password");

    if (!user) {
      return res.status(401).json({ message: "User no longer exists" });
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
};

const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: "Authentication required" });
  }

  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ message: "Access denied for this role" });
  }

  next();
};

export const isAdmin = requireRole("admin");
export const isMentor = requireRole("mentor");
export const isStudent = requireRole("student");
