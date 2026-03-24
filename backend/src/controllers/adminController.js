import User from "../models/user.model.js";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const MAX_NAME = 120;
const MAX_DEPARTMENT = 100;
const MAX_EXPERTISE = 500;

export const createMentor = async (req, res) => {
  try {
    const { name, email, password, department, expertise } = req.body;

    if (
      name == null ||
      email == null ||
      password == null ||
      department == null ||
      expertise == null
    ) {
      return res.status(400).json({
        message:
          "name, email, password, department, and expertise are required",
      });
    }

    const nameStr = String(name).trim();
    const emailStr = String(email).trim().toLowerCase();
    const deptStr = String(department).trim();
    const expertiseStr = String(expertise).trim();

    if (!nameStr) {
      return res.status(400).json({ message: "Name cannot be empty" });
    }
    if (nameStr.length > MAX_NAME) {
      return res.status(400).json({
        message: `Name cannot exceed ${MAX_NAME} characters`,
      });
    }

    if (!emailStr) {
      return res.status(400).json({ message: "Email cannot be empty" });
    }
    if (!EMAIL_REGEX.test(emailStr)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    if (String(password).length < 8) {
      return res.status(400).json({
        message: "Password must be at least 8 characters",
      });
    }

    if (!deptStr) {
      return res.status(400).json({ message: "Department cannot be empty" });
    }
    if (deptStr.length > MAX_DEPARTMENT) {
      return res.status(400).json({
        message: `Department cannot exceed ${MAX_DEPARTMENT} characters`,
      });
    }

    if (!expertiseStr) {
      return res.status(400).json({ message: "Expertise cannot be empty" });
    }
    if (expertiseStr.length > MAX_EXPERTISE) {
      return res.status(400).json({
        message: `Expertise cannot exceed ${MAX_EXPERTISE} characters`,
      });
    }

    const exists = await User.findOne({ email: emailStr });
    if (exists) {
      return res.status(409).json({ message: "Email already registered" });
    }

    const user = await User.create({
      name: nameStr,
      email: emailStr,
      password,
      department: deptStr,
      expertise: expertiseStr,
      role: "mentor",
    });

    return res.status(201).json({
      message: "Mentor created successfully",
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
    if (error.code === 11000) {
      return res.status(409).json({ message: "Email already registered" });
    }
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({
        message: messages[0] || "Validation failed",
        ...(messages.length > 1 && { errors: messages }),
      });
    }
    return res.status(500).json({ message: error.message });
  }
};
