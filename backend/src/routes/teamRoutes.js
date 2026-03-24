import { Router } from "express";
import { createTeam, getTeamsByUser } from "../controllers/teamController.js";
import { protect, isStudent } from "../middleware/authMiddleware.js";

const teamRoutes = Router();

teamRoutes.post("/", protect, isStudent, createTeam);
teamRoutes.get("/me", protect, getTeamsByUser);

export default teamRoutes;
