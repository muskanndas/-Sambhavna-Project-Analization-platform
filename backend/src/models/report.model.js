import mongoose from "mongoose";

const reportSchema = new mongoose.Schema(
  {
    team: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
      required: [true, "Team is required"],
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: [true, "Project is required"],
    },
    fileUrl: {
      type: String,
      required: [true, "File URL is required"],
      trim: true,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Uploader is required"],
    },
  },
  { timestamps: true }
);

reportSchema.index({ team: 1, createdAt: -1 });
reportSchema.index({ project: 1, createdAt: -1 });
reportSchema.index({ uploadedBy: 1 });

const Report =
  mongoose.models.Report ?? mongoose.model("Report", reportSchema);

export default Report;
