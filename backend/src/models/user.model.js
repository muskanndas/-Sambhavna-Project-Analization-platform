import mongoose from "mongoose";
import bcrypt from "bcrypt";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ROLES = ["admin", "mentor", "student"];

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: [120, "Name cannot exceed 120 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [EMAIL_REGEX, "Please enter a valid email address"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters"],
      select: false,
    },
    role: {
      type: String,
      enum: {
        values: ROLES,
        message: "{VALUE} is not a valid role",
      },
      required: [true, "Role is required"],
    },
    department: {
      type: String,
      required: [true, "Department is required"],
      trim: true,
      maxlength: [100, "Department cannot exceed 100 characters"],
    },
    expertise: {
      type: String,
      trim: true,
      maxlength: [500, "Expertise cannot exceed 500 characters"],
      validate: {
        validator(value) {
          if (value == null || value === "") return true;
          return this.role === "mentor";
        },
        message: "Expertise can only be set for mentors",
      },
    },
  },
  {
    timestamps: true,
  }
);

userSchema.pre("save", async function hashPassword() {
  if (!this.isModified("password")) return;
  const saltRounds = 12;
  this.password = await bcrypt.hash(this.password, saltRounds);
});

userSchema.methods.comparePassword = async function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

const User = mongoose.models.User ?? mongoose.model("User", userSchema);

export default User;
