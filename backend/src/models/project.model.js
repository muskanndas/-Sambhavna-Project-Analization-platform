import mongoose from "mongoose";

export const PROJECT_STATUSES = [
  "Pending",
  "Approved",
  "Rejected",
  "Completed",
];

const projectSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"],
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
      maxlength: [10_000, "Description cannot exceed 10000 characters"],
    },
    techStack: {
      type: [String],
      default: [],
      validate: {
        validator(arr) {
          return arr.every(
            (t) => typeof t === "string" && t.trim().length > 0 && t.length <= 80
          );
        },
        message: "techStack must be non-empty trimmed strings (max 80 chars each)",
      },
    },
    team: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
      required: [true, "Team is required"],
      unique: true,
    },
    mentor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Mentor is required"],
    },
    department: {
      type: String,
      required: [true, "Department is required"],
      trim: true,
      maxlength: [100, "Department cannot exceed 100 characters"],
    },
    status: {
      type: String,
      enum: {
        values: PROJECT_STATUSES,
        message: "{VALUE} is not a valid status",
      },
      default: "Pending",
    },
    progress: {
      type: Number,
      default: 0,
      min: [0, "Progress cannot be negative"],
      max: [100, "Progress cannot exceed 100"],
    },
    mentorFeedback: {
      type: String,
      trim: true,
      maxlength: [2000, "Feedback cannot exceed 2000 characters"],
    },
  },
  { timestamps: true }
);

projectSchema.index({ department: 1, status: 1 });
projectSchema.index({ mentor: 1 });

const Project =
  mongoose.models.Project ?? mongoose.model("Project", projectSchema);

export default Project;
