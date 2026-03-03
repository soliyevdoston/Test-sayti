import { getResultsApi, getTeacherTests } from "../api/api";
import { getTeacherSubscription } from "./subscriptionTools";

const STORAGE_KEY = "teacher_solved_usage_v1";

const readUsageMap = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = JSON.parse(raw || "{}");
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
};

const writeUsageMap = (map) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map || {}));
};

export const getTeacherSolvedUsage = (teacherId, baselineCurrentCount = 0) => {
  if (!teacherId) return Math.max(Number(baselineCurrentCount) || 0, 0);
  const safeBaseline = Math.max(Number(baselineCurrentCount) || 0, 0);

  const map = readUsageMap();
  const stored = Math.max(Number(map[teacherId]) || 0, 0);
  const resolved = Math.max(stored, safeBaseline);

  if (resolved !== stored) {
    map[teacherId] = resolved;
    writeUsageMap(map);
  }

  return resolved;
};

export const syncTeacherSolvedUsageWithCurrent = (teacherId, currentCount = 0) => {
  return getTeacherSolvedUsage(teacherId, currentCount);
};

const countSolvedFromTests = async (tests = []) => {
  if (!Array.isArray(tests) || !tests.length) return 0;
  const counts = await Promise.all(
    tests.map(async (test) => {
      const testId = test?._id || test?.testId;
      if (!testId) return 0;
      const res = await getResultsApi(testId).catch(() => ({ data: [] }));
      return Array.isArray(res.data) ? res.data.length : 0;
    })
  );
  return counts.reduce((sum, count) => sum + Number(count || 0), 0);
};

export const getTeacherSolveLimitSnapshot = async (teacherId, providedTests = null) => {
  if (!teacherId) {
    return {
      teacherId: "",
      planId: "free",
      planLabel: "Bepul",
      maxSolved: 0,
      hasSolveLimit: true,
      usedSolved: 0,
      remainingSolved: 0,
      limitReached: false,
    };
  }

  const subscription = getTeacherSubscription(teacherId);
  const hasSolveLimit = Number.isFinite(subscription.maxSolved);

  if (!hasSolveLimit) {
    return {
      teacherId,
      planId: subscription.planId,
      planLabel: subscription.label,
      maxSolved: subscription.maxSolved,
      hasSolveLimit: false,
      usedSolved: getTeacherSolvedUsage(teacherId, 0),
      remainingSolved: Number.POSITIVE_INFINITY,
      limitReached: false,
    };
  }

  try {
    let tests = Array.isArray(providedTests) ? providedTests : null;
    if (!tests) {
      const testsRes = await getTeacherTests(teacherId).catch(() => ({ data: [] }));
      tests = Array.isArray(testsRes.data) ? testsRes.data : [];
    }

    const usedSolved = await countSolvedFromTests(tests);
    const synced = syncTeacherSolvedUsageWithCurrent(teacherId, usedSolved);
    const remainingSolved = Math.max(Number(subscription.maxSolved || 0) - synced, 0);

    return {
      teacherId,
      planId: subscription.planId,
      planLabel: subscription.label,
      maxSolved: subscription.maxSolved,
      hasSolveLimit: true,
      usedSolved: synced,
      remainingSolved,
      limitReached: synced >= subscription.maxSolved,
    };
  } catch {
    const fallback = getTeacherSolvedUsage(teacherId, 0);
    const remainingSolved = Math.max(Number(subscription.maxSolved || 0) - fallback, 0);
    return {
      teacherId,
      planId: subscription.planId,
      planLabel: subscription.label,
      maxSolved: subscription.maxSolved,
      hasSolveLimit: true,
      usedSolved: fallback,
      remainingSolved,
      limitReached: fallback >= subscription.maxSolved,
    };
  }
};
