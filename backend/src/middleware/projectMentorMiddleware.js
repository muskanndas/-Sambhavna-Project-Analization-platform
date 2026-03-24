import mongoose from "mongoose";
import Project from "../models/project.model.js";

/**
 * Ensures `req.project` exists and `req.user` is the project's assigned mentor.
 * Use after `protect` and `isMentor`.
 */
export const requireAssignedMentorForProject = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid project id" });
    }

    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    if (project.mentor.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: "Only the assigned mentor can review this project",
      });
    }

    req.project = project;
    next();
  } catch (err) {
    next(err);
  }
};
