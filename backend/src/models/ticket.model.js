import mongoose from "mongoose";
import { recalculateProjectProgressForTeam } from "../utils/projectProgress.js";

export const TICKET_STATUSES = ["Pending", "In Progress", "Completed"];

export const TICKET_PRIORITIES = ["Low", "Medium", "High"];

const ticketSchema = new mongoose.Schema(
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
      maxlength: [5000, "Description cannot exceed 5000 characters"],
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Assignee is required"],
    },
    team: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
      required: [true, "Team is required"],
    },
    status: {
      type: String,
      enum: {
        values: TICKET_STATUSES,
        message: "{VALUE} is not a valid status",
      },
      default: "Pending",
    },
    priority: {
      type: String,
      enum: {
        values: TICKET_PRIORITIES,
        message: "{VALUE} is not a valid priority",
      },
      required: [true, "Priority is required"],
    },
    deadline: {
      type: Date,
      required: [true, "Deadline is required"],
    },
  },
  { timestamps: true }
);

ticketSchema.index({ team: 1, status: 1 });
ticketSchema.index({ assignedTo: 1 });
ticketSchema.index({ deadline: 1 });

ticketSchema.post("save", async function syncProjectProgress(doc) {
  try {
    await recalculateProjectProgressForTeam(doc.team);
  } catch (err) {
    console.error("Failed to update project progress:", err.message);
  }
});

const Ticket =
  mongoose.models.Ticket ?? mongoose.model("Ticket", ticketSchema);

export default Ticket;
