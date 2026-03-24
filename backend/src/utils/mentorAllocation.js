import User from "../models/user.model.js";
import Project from "../models/project.model.js";

const findMentorsInDepartment = async (department) =>
  User.find({ role: "mentor", department })
    .select("_id")
    .sort({ _id: 1 })
    .lean();

const countAssignedProjectsPerMentor = async (mentorIds) => {
  if (!mentorIds.length) {
    return new Map();
  }
  const tallies = await Project.aggregate([
    { $match: { mentor: { $in: mentorIds } } },
    { $group: { _id: "$mentor", count: { $sum: 1 } } },
  ]);
  return new Map(tallies.map((t) => [t._id.toString(), t.count]));
};

const pickMentorWithLowestCount = (mentorIdsSorted, countByMentorId) => {
  let chosen = mentorIdsSorted[0];
  let lowest = countByMentorId.get(chosen.toString()) ?? 0;

  for (let i = 1; i < mentorIdsSorted.length; i++) {
    const id = mentorIdsSorted[i];
    const n = countByMentorId.get(id.toString()) ?? 0;
    if (n < lowest) {
      chosen = id;
      lowest = n;
    }
  }

  return chosen;
};

/**
 * Mentor allocation: same department → count project load → least-loaded mentor.
 * Tie-break: mentors are sorted by `_id`; the first among those with the minimum
 * count is chosen (deterministic).
 *
 * @param {string} department - Department name (trimmed)
 * @returns {Promise<import("mongoose").Types.ObjectId | null>} Mentor id or null if none
 */
export const allocateMentorByLeastProjects = async (department) => {
  const dept =
    typeof department === "string" ? department.trim() : String(department ?? "").trim();
  if (!dept) {
    return null;
  }

  const mentors = await findMentorsInDepartment(dept);
  if (!mentors.length) {
    return null;
  }

  const mentorIds = mentors.map((m) => m._id);
  const countByMentorId = await countAssignedProjectsPerMentor(mentorIds);

  return pickMentorWithLowestCount(mentorIds, countByMentorId);
};
