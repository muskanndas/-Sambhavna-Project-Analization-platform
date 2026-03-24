import Notification from "../models/notification.model.js";
import Team from "../models/team.model.js";

export const createNotification = async (userId, message) => {
  await Notification.create({
    user: userId,
    message,
    read: false,
  });
};

export const notifyUserIds = async (userIds, message) => {
  const unique = [...new Set(userIds.map((id) => id.toString()))];
  if (!unique.length) return;
  await Notification.insertMany(
    unique.map((user) => ({ user, message, read: false }))
  );
};

export const notifyTeamMembers = async (teamId, message) => {
  const team = await Team.findById(teamId).select("leader members").lean();
  if (!team) return;
  const ids = [team.leader, ...(team.members || [])];
  await notifyUserIds(ids, message);
};
