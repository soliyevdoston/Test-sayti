import { getTeacherSubscription } from "./subscriptionTools";

const FREE_PLAN_ID = "free";
const FREE_ALLOWED_PATHS = new Set([
  "/teacher/dashboard",
  "/teacher/tests",
  "/teacher/create-test",
  "/teacher/subscription",
  "/guide",
]);

export const getTeacherPlanId = (teacherId) =>
  String(getTeacherSubscription(teacherId)?.planId || FREE_PLAN_ID);

export const isTeacherFreePlan = (teacherId) => getTeacherPlanId(teacherId) === FREE_PLAN_ID;

export const isTeacherProActive = (teacherId) => !isTeacherFreePlan(teacherId);

export const canUseTeacherProFeature = (teacherId) => isTeacherProActive(teacherId);

export const isTeacherPathAllowedForPlan = (teacherId, pathname) =>
  isTeacherProActive(teacherId) || FREE_ALLOWED_PATHS.has(String(pathname || ""));
