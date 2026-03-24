import { Router } from "express";
import { createMentor } from "../controllers/adminController.js";
import { protect, isAdmin } from "../middleware/authMiddleware.js";

const adminRoutes = Router();

adminRoutes.post("/create-mentor", protect, isAdmin, createMentor);

export default adminRoutes;
