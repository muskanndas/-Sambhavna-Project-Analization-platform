import crypto from "node:crypto";
import bcrypt from "bcrypt";
import User from "../models/user.model.js";
import PasswordResetOtp from "../models/passwordResetOtp.model.js";
import { signToken } from "../utils/jwt.js";
import { sendPasswordResetOtp } from "../utils/email.js";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const OTP_EXPIRY_MS = 10 * 60 * 1000;
const GENERIC_FORGOT_MESSAGE =
  "If an account exists for this email, a reset code has been sent.";

//register controller
export const register = async (req, res) => {
  try {
    const { name, email, password, department, role } = req.body;

    if (!name || !email || !password || !department) {
      return res.status(400).json({
        message: "name, email, password, and department are required",
      });
    }

    if (!EMAIL_REGEX.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    if (String(password).length < 8) {
      return res
        .status(400)
        .json({ message: "Password must be at least 8 characters" });
    }

    if (role && role !== "student") {
      return res
        .status(403)
        .json({ message: "Only student registration is allowed" });
    }

    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) {
      return res.status(409).json({ message: "Email already registered" });
    }

    const user = await User.create({
      name,
      email,
      password,
      department,
      role: "student",
    });

    const token = signToken(user);

    return res.status(201).json({
      message: "Registration successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

//login controller
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    if (!EMAIL_REGEX.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select(
      "+password"
    );

    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = signToken(user);

    return res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        expertise: user.expertise,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

function generateOtp() {
  return String(crypto.randomInt(0, 1_000_000)).padStart(6, "0");
}

/** Request OTP for password reset (does not reveal whether email is registered). */
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    if (!EMAIL_REGEX.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    const normalized = email.toLowerCase();
    const user = await User.findOne({ email: normalized });

    if (!user) {
      return res.status(200).json({ message: GENERIC_FORGOT_MESSAGE });
    }

    await PasswordResetOtp.deleteMany({ email: normalized });

    const otp = generateOtp();
    const otpHash = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MS);

    await PasswordResetOtp.create({
      email: normalized,
      otpHash,
      expiresAt,
    });

    try {
      await sendPasswordResetOtp(normalized, otp);
    } catch {
      await PasswordResetOtp.deleteMany({ email: normalized });
      return res.status(503).json({
        message:
          "Could not send reset email. Try again later or contact support.",
      });
    }

    return res.status(200).json({ message: GENERIC_FORGOT_MESSAGE });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

/** Reset password using email + OTP + new password. */
export const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({
        message: "email, otp, and newPassword are required",
      });
    }

    if (!EMAIL_REGEX.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    if (String(otp).length !== 6 || !/^\d{6}$/.test(String(otp))) {
      return res.status(400).json({ message: "OTP must be a 6-digit code" });
    }

    if (String(newPassword).length < 8) {
      return res
        .status(400)
        .json({ message: "Password must be at least 8 characters" });
    }

    const normalized = email.toLowerCase();
    const record = await PasswordResetOtp.findOne({ email: normalized }).sort({
      createdAt: -1,
    });

    if (!record || record.expiresAt.getTime() < Date.now()) {
      return res
        .status(400)
        .json({ message: "Invalid or expired reset code" });
    }

    const otpOk = await bcrypt.compare(String(otp), record.otpHash);
    if (!otpOk) {
      return res
        .status(400)
        .json({ message: "Invalid or expired reset code" });
    }

    const user = await User.findOne({ email: normalized }).select("+password");
    if (!user) {
      await PasswordResetOtp.deleteMany({ email: normalized });
      return res
        .status(400)
        .json({ message: "Invalid or expired reset code" });
    }

    user.password = newPassword;
    await user.save();
    await PasswordResetOtp.deleteMany({ email: normalized });

    return res.status(200).json({ message: "Password has been reset" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
