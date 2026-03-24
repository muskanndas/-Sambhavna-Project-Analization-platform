import { Router } from "express";
import {
  createTicket,
  getTeamTickets,
  updateTicketStatus,
} from "../controllers/ticketController.js";
import { protect, isStudent } from "../middleware/authMiddleware.js";

const ticketRoutes = Router();

ticketRoutes.get("/team/:teamId", protect, getTeamTickets);
ticketRoutes.patch("/:id/status", protect, updateTicketStatus);
ticketRoutes.post("/", protect, isStudent, createTicket);

export default ticketRoutes;
