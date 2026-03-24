import { Router } from "express";
import {
  approveProject,
  rejectProject,
  submitMentorFeedback,
  submitProposal,
} from "../controllers/projectController.js";
import { protect, isMentor, isStudent } from "../middleware/authMiddleware.js";
import { requireAssignedMentorForProject } from "../middleware/projectMentorMiddleware.js";

const projectRoutes = Router();

projectRoutes.post("/", protect, isStudent, submitProposal);

projectRoutes.patch(
  "/:id/approve",
  protect,
  isMentor,
  requireAssignedMentorForProject,
  approveProject
);
projectRoutes.patch(
  "/:id/reject",
  protect,
  isMentor,
  requireAssignedMentorForProject,
  rejectProject
);
projectRoutes.post(
  "/:id/feedback",
  protect,
  isMentor,
  requireAssignedMentorForProject,
  submitMentorFeedback
);

export default projectRoutes;
