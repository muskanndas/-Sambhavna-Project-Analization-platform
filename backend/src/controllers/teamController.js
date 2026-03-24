import mongoose from "mongoose";
import Team, {
  MAX_MEMBERS_EXCLUDING_LEADER,
} from "../models/team.model.js";
import User from "../models/user.model.js";

export const createTeam = async (req, res) => {
  try {
    const { name, department, memberIds = [], project } = req.body;
    const leaderId = req.user._id;

    if (!name || !department) {
      return res
        .status(400)
        .json({ message: "name and department are required" });
    }

    if (!Array.isArray(memberIds)) {
      return res.status(400).json({ message: "memberIds must be an array" });
    }

    if (memberIds.length > MAX_MEMBERS_EXCLUDING_LEADER) {
      return res.status(400).json({
        message: `At most ${MAX_MEMBERS_EXCLUDING_LEADER} members allowed besides the leader`,
      });
    }

    const normalizedIds = [...new Set(memberIds.map((id) => id.toString()))];
    if (normalizedIds.length !== memberIds.length) {
      return res.status(400).json({ message: "Duplicate memberIds are not allowed" });
    }

    if (normalizedIds.includes(leaderId.toString())) {
      return res.status(400).json({ message: "Leader cannot be included in memberIds" });
    }

    if (department !== req.user.department) {
      return res.status(400).json({
        message: "Team department must match your department",
      });
    }

    for (const id of normalizedIds) {
      if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({ message: `Invalid member id: ${id}` });
      }
    }

    if (project != null && project !== "" && !mongoose.isValidObjectId(project)) {
      return res.status(400).json({ message: "Invalid project id" });
    }

    if (normalizedIds.length) {
      const users = await User.find({
        _id: { $in: normalizedIds },
        role: "student",
        department,
      }).select("_id");

      if (users.length !== normalizedIds.length) {
        return res.status(400).json({
          message:
            "All members must exist, be students, and belong to the same department",
        });
      }
    }

    const team = await Team.create({
      name,
      leader: leaderId,
      members: normalizedIds,
      department,
      project: project || null,
    });

    const populated = await Team.findById(team._id)
      .populate("leader", "name email role department")
      .populate("members", "name email role department")
      .populate("project");

    return res.status(201).json({
      message: "Team created successfully",
      team: populated,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "Team already exists" });
    }
    return res.status(500).json({ message: error.message });
  }
};

export const getTeamsByUser = async (req, res) => {
  try {
    const userId = req.user._id;

    const teams = await Team.find({
      $or: [{ leader: userId }, { members: userId }],
    })
      .populate("leader", "name email role department")
      .populate("members", "name email role department")
      .populate("project")
      .sort({ updatedAt: -1 });

    return res.status(200).json({
      count: teams.length,
      teams,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
