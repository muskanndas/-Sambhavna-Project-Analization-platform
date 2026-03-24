import mongoose from "mongoose";

export const MAX_MEMBERS_EXCLUDING_LEADER = 4;

const teamSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Team name is required"],
      trim: true,
      maxlength: [120, "Team name cannot exceed 120 characters"],
    },
    leader: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Leader is required"],
    },
    members: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      ],
      default: [],
      validate: [
        {
          validator(arr) {
            return arr.length <= MAX_MEMBERS_EXCLUDING_LEADER;
          },
          message: `Team may have at most ${MAX_MEMBERS_EXCLUDING_LEADER} members besides the leader (5 people total)`,
        },
        {
          validator(arr) {
            const ids = arr.map((id) => id.toString());
            return new Set(ids).size === ids.length;
          },
          message: "Duplicate members are not allowed",
        },
      ],
    },
    department: {
      type: String,
      required: [true, "Department is required"],
      trim: true,
      maxlength: [100, "Department cannot exceed 100 characters"],
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      default: null,
    },
  },
  { timestamps: true }
);

teamSchema.pre("validate", function ensureLeaderNotInMembers(next) {
  if (!this.leader || !this.members?.length) {
    return next();
  }
  const leaderId = this.leader.toString();
  const hasLeaderAsMember = this.members.some(
    (m) => m.toString() === leaderId
  );
  if (hasLeaderAsMember) {
    this.invalidate("members", "Leader cannot be listed in members");
  }
  next();
});

teamSchema.index({ leader: 1 });
teamSchema.index({ members: 1 });
teamSchema.index({ department: 1 });

const Team = mongoose.models.Team ?? mongoose.model("Team", teamSchema);

export default Team;
