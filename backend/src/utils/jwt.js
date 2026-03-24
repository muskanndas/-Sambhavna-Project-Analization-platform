import jwt from "jsonwebtoken";

export const signToken = (user) => {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET is required");
  }

  return jwt.sign(
    { sub: user._id.toString(), role: user.role, email: user.email },
    secret,
    { expiresIn: "7d" }
  );
};
