import { apisStudyplan } from "../utils/api.customize";

export async function createStudyGoal(goal: {
  targetBandScore: number;
  targetDate: string;
  focusSkills: string[];
  studyHoursPerDay: number;
}) {
  const res = await apisStudyplan.post("/study-plan/goals", goal);
  return res;
}

export async function getActiveStudyGoal() {
  const res = await apisStudyplan.get("/study-plan/goals/active");
  return res;
}

export async function getStudyProgress() {
  const res = await apisStudyplan.get("/study-plan/progress");
  return res;
}

export async function deleteStudyGoal(goalId: string) {
  const res = await apisStudyplan.delete(`/study-plan/goals/${goalId}`);
  return res;
}
