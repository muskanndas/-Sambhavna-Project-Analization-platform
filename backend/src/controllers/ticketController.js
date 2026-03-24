import mongoose from "mongoose";
import Ticket, {
  TICKET_PRIORITIES,
  TICKET_STATUSES,
} from "../models/ticket.model.js";
import Team from "../models/team.model.js";
import User from "../models/user.model.js";
import { createNotification } from "../utils/notifications.js";

const teamMemberIdSet = (team) => {
  const ids = new Set([team.leader.toString()]);
  for (const m of team.members || []) {
    ids.add(m.toString());
  }
  return ids;
};

const userBelongsToTeam = (team, userId) =>
  teamMemberIdSet(team).has(userId.toString());

export const createTicket = async (req, res) => {
  try {
    const { title, description, assignedTo, team: teamId, priority, deadline } =
      req.body;

    if (!title || !description || !assignedTo || !teamId || !priority || !deadline) {
      return res.status(400).json({
        message:
          "title, description, assignedTo, team, priority, and deadline are required",
      });
    }

    if (!TICKET_PRIORITIES.includes(priority)) {
      return res.status(400).json({
        message: `priority must be one of: ${TICKET_PRIORITIES.join(", ")}`,
      });
    }

    if (
      !mongoose.isValidObjectId(teamId) ||
      !mongoose.isValidObjectId(assignedTo)
    ) {
      return res.status(400).json({ message: "Invalid team or assignee id" });
    }

    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    if (team.leader.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: "Only the team leader can create tickets",
      });
    }

    if (!userBelongsToTeam(team, assignedTo)) {
      return res.status(400).json({
        message: "Assignee must be the leader or a member of this team",
      });
    }

    const assignee = await User.findById(assignedTo).select("role");
    if (!assignee) {
      return res.status(404).json({ message: "Assignee user not found" });
    }

    const deadlineDate = new Date(deadline);
    if (Number.isNaN(deadlineDate.getTime())) {
      return res.status(400).json({ message: "Invalid deadline date" });
    }

    const ticket = await Ticket.create({
      title,
      description,
      assignedTo,
      team: team._id,
      priority,
      deadline: deadlineDate,
      status: "Pending",
    });

    createNotification(
      assignedTo,
      `You were assigned a ticket: "${title}"`
    ).catch((err) => console.error("Notification error:", err.message));

    const populated = await Ticket.findById(ticket._id)
      .populate("assignedTo", "name email role")
      .populate("team", "name department");

    return res.status(201).json({
      message: "Ticket created",
      ticket: populated,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const updateTicketStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid ticket id" });
    }

    if (!status || !TICKET_STATUSES.includes(status)) {
      return res.status(400).json({
        message: `status must be one of: ${TICKET_STATUSES.join(", ")}`,
      });
    }

    const ticket = await Ticket.findById(id);
    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    const team = await Team.findById(ticket.team);
    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    const userId = req.user._id.toString();
    const isLeader = team.leader.toString() === userId;
    const isAssignee = ticket.assignedTo.toString() === userId;

    if (!isLeader && !isAssignee) {
      return res.status(403).json({
        message: "Only the team leader or assignee can update ticket status",
      });
    }

    ticket.status = status;
    await ticket.save();

    const populated = await Ticket.findById(ticket._id)
      .populate("assignedTo", "name email role")
      .populate("team", "name department");

    return res.status(200).json({
      message: "Ticket status updated",
      ticket: populated,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getTeamTickets = async (req, res) => {
  try {
    const { teamId } = req.params;

    if (!mongoose.isValidObjectId(teamId)) {
      return res.status(400).json({ message: "Invalid team id" });
    }

    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    if (!userBelongsToTeam(team, req.user._id)) {
      return res.status(403).json({
        message: "You must belong to this team to view its tickets",
      });
    }

    const tickets = await Ticket.find({ team: team._id })
      .populate("assignedTo", "name email role")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      count: tickets.length,
      tickets,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
