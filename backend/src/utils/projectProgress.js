import mongoose from "mongoose";

/**
 * Sets linked project progress from team tickets:
 * progress = round(completed / total * 100), or 0 if there are no tickets.
 */
export const recalculateProjectProgressForTeam = async (teamId) => {
  if (!teamId) return;

  const Team = mongoose.model("Team");
  const Project = mongoose.model("Project");
  const Ticket = mongoose.model("Ticket");

  const team = await Team.findById(teamId).select("project").lean();
  if (!team?.project) return;

  const filter = { team: teamId };
  const total = await Ticket.countDocuments(filter);
  const completed = await Ticket.countDocuments({
    ...filter,
    status: "Completed",
  });

  const progress =
    total === 0 ? 0 : Math.round((completed / total) * 100);

  await Project.findByIdAndUpdate(team.project, { progress });
};
