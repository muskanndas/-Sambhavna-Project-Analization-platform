import mongoose from "mongoose";
import Project from "../models/project.model.js";
import Team from "../models/team.model.js";
import { allocateMentorByLeastProjects } from "../utils/mentorAllocation.js";
import { notifyTeamMembers } from "../utils/notifications.js";

const normalizeTechStack = (raw) => {
  if (raw == null) return [];
  if (Array.isArray(raw)) {
    return raw
      .map((t) => (typeof t === "string" ? t.trim() : String(t).trim()))
      .filter(Boolean);
  }
  if (typeof raw === "string") {
    return raw
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
  }
  return [];
};

export const submitProposal = async (req, res) => {
  try {
    const { title, description, techStack, teamId } = req.body;

    if (!title || !description || !teamId) {
      return res.status(400).json({
        message: "title, description, and teamId are required",
      });
    }

    if (!mongoose.isValidObjectId(teamId)) {
      return res.status(400).json({ message: "Invalid teamId" });
    }

    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    if (team.leader.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: "Only the team leader can submit a project proposal",
      });
    }

    if (team.project) {
      return res.status(409).json({
        message: "This team already has a project proposal",
      });
    }

    const department = team.department;
    const mentorId = await allocateMentorByLeastProjects(department);

    if (!mentorId) {
      return res.status(422).json({
        message: "No mentor available in this department to assign",
      });
    }

    const stack = normalizeTechStack(techStack);

    const project = await Project.create({
      title,
      description,
      techStack: stack,
      team: team._id,
      mentor: mentorId,
      department,
      status: "Pending",
      progress: 0,
    });

    team.project = project._id;
    await team.save();

    const populated = await Project.findById(project._id)
      .populate("team", "name department leader members")
      .populate("mentor", "name email department expertise role");

    return res.status(201).json({
      message: "Proposal submitted successfully",
      project: populated,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "This team already has a project proposal",
      });
    }
    return res.status(500).json({ message: error.message });
  }
};

const assertPendingForReview = (project, res) => {
  if (project.status !== "Pending") {
    res.status(400).json({
      message: `Only pending proposals can be reviewed (current status: ${project.status})`,
    });
    return false;
  }
  return true;
};

const populateProjectResponse = (projectId) =>
  Project.findById(projectId)
    .populate("team", "name department leader members")
    .populate("mentor", "name email department expertise role");

export const approveProject = async (req, res) => {
  try {
    const project = req.project;
    if (!assertPendingForReview(project, res)) return;

    project.status = "Approved";
    await project.save();

    notifyTeamMembers(
      project.team,
      `Your project "${project.title}" has been approved.`
    ).catch((err) => console.error("Notification error:", err.message));

    const populated = await populateProjectResponse(project._id);

    return res.status(200).json({
      message: "Project approved",
      project: populated,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const submitMentorFeedback = async (req, res) => {
  try {
    const { message } = req.body;
    if (!message || !String(message).trim()) {
      return res.status(400).json({ message: "Feedback message is required" });
    }

    const project = req.project;
    const text = String(message).trim();

    project.mentorFeedback = text;
    await project.save();

    notifyTeamMembers(
      project.team,
      `Mentor feedback on "${project.title}": ${text}`
    ).catch((err) => console.error("Notification error:", err.message));

    const populated = await populateProjectResponse(project._id);

    return res.status(200).json({
      message: "Feedback submitted",
      project: populated,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const rejectProject = async (req, res) => {
  try {
    const project = req.project;
    if (!assertPendingForReview(project, res)) return;

    project.status = "Rejected";
    await project.save();

    const populated = await populateProjectResponse(project._id);

    return res.status(200).json({
      message: "Project rejected",
      project: populated,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
