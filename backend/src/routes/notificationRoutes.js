import { Router } from "express";
import { getMyNotifications } from "../controllers/notificationController.js";
import { protect } from "../middleware/authMiddleware.js";

const notificationRoutes = Router();

notificationRoutes.get("/", protect, getMyNotifications);

export default notificationRoutes;
