import fs from "fs/promises";
import mongoose from "mongoose";
import Report from "../models/report.model.js";
import Project from "../models/project.model.js";
import Team from "../models/team.model.js";

const teamMemberIdSet = (team) => {
  const ids = new Set([team.leader.toString()]);
  for (const m of team.members || []) {
    ids.add(m.toString());
  }
  return ids;
};

export const uploadReport = async (req, res) => {
  let keepFile = false;
  try {
    if (!req.file) {
      return res.status(400).json({ message: "File is required (field name: file)" });
    }

    const { team: teamId, project: projectId } = req.body;

    if (!teamId || !projectId) {
      return res.status(400).json({
        message: "team and project are required (form fields)",
      });
    }

    if (!mongoose.isValidObjectId(teamId) || !mongoose.isValidObjectId(projectId)) {
      return res.status(400).json({ message: "Invalid team or project id" });
    }

    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    if (!teamMemberIdSet(team).has(req.user._id.toString())) {
      return res.status(403).json({
        message: "Only team members can upload reports for this team",
      });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    if (project.team.toString() !== team._id.toString()) {
      return res.status(400).json({
        message: "Project does not belong to this team",
      });
    }

    const fileUrl = `/uploads/reports/${req.file.filename}`;

    const report = await Report.create({
      team: team._id,
      project: project._id,
      fileUrl,
      uploadedBy: req.user._id,
    });

    keepFile = true;

    const populated = await Report.findById(report._id)
      .populate("team", "name department")
      .populate("project", "title status")
      .populate("uploadedBy", "name email role");

    return res.status(201).json({
      message: "Report uploaded successfully",
      report: populated,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  } finally {
    if (!keepFile && req.file?.path) {
      fs.unlink(req.file.path).catch(() => {});
    }
  }
};
