import { hasActiveSchoolSubscription, hasActiveTeacherSubscription } from "./billingTools";

const STORAGE_KEY = "teacher_subscription_limits_v1";
const DISABLE_PLAN_LIMITS = ["1", "true", "yes", "on"].includes(
  String(import.meta.env.VITE_DISABLE_PLAN_LIMITS || "").trim().toLowerCase()
);

export const SUBSCRIPTION_PLANS = [
  {
    id: "free",
    label: "Bepul",
    maxTests: 10,
    maxSolved: 50,
    maxStudents: 100,
    price: 0,
  },
  {
    id: "teacher_monthly",
    label: "Oylik Pro",
    maxTests: Number.POSITIVE_INFINITY,
    maxSolved: Number.POSITIVE_INFINITY,
    maxStudents: Number.POSITIVE_INFINITY,
    price: 49000,
  },
  {
    id: "school",
    label: "Maktab",
    maxTests: Number.POSITIVE_INFINITY,
    maxSolved: Number.POSITIVE_INFINITY,
    maxStudents: Number.POSITIVE_INFINITY,
    price: 1499000,
  },
];

const DEFAULT_PLAN_ID = "free";

const planById = new Map(SUBSCRIPTION_PLANS.map((plan) => [plan.id, plan]));

export const getPlanById = (planId) => planById.get(planId) || planById.get(DEFAULT_PLAN_ID);

export const getTeacherSubscriptionMap = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = JSON.parse(raw || "{}");
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
};

export const saveTeacherSubscriptionMap = (map) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map || {}));
};

export const getTeacherSubscription = (teacherId) => {
  if (DISABLE_PLAN_LIMITS) {
    const monthlyPlan = getPlanById("teacher_monthly");
    return {
      teacherId,
      planId: monthlyPlan.id,
      label: monthlyPlan.label,
      maxTests: monthlyPlan.maxTests,
      maxSolved: monthlyPlan.maxSolved,
      maxStudents: monthlyPlan.maxStudents,
      updatedAt: new Date().toISOString(),
    };
  }
  if (hasActiveSchoolSubscription()) {
    const schoolPlan = getPlanById("school");
    return {
      teacherId,
      planId: schoolPlan.id,
      label: schoolPlan.label,
      maxTests: schoolPlan.maxTests,
      maxSolved: schoolPlan.maxSolved,
      maxStudents: schoolPlan.maxStudents,
      updatedAt: new Date().toISOString(),
    };
  }

  if (hasActiveTeacherSubscription(teacherId)) {
    const monthlyPlan = getPlanById("teacher_monthly");
    return {
      teacherId,
      planId: monthlyPlan.id,
      label: monthlyPlan.label,
      maxTests: monthlyPlan.maxTests,
      maxSolved: monthlyPlan.maxSolved,
      maxStudents: monthlyPlan.maxStudents,
      updatedAt: new Date().toISOString(),
    };
  }

  const map = getTeacherSubscriptionMap();
  const configuredPlanId = map?.[teacherId]?.planId || DEFAULT_PLAN_ID;
  const plan = getPlanById(configuredPlanId);

  return {
    teacherId,
    planId: plan.id,
    label: plan.label,
    maxTests: plan.maxTests,
    maxSolved: plan.maxSolved,
    maxStudents: plan.maxStudents,
    updatedAt: map?.[teacherId]?.updatedAt || null,
  };
};

export const setTeacherSubscription = (teacherId, planId) => {
  if (!teacherId) return;
  const plan = getPlanById(planId);
  const current = getTeacherSubscriptionMap();
  current[teacherId] = {
    planId: plan.id,
    updatedAt: new Date().toISOString(),
  };
  saveTeacherSubscriptionMap(current);
};

export const formatLimit = (value) =>
  Number.isFinite(value) ? `${value}` : "Cheksiz";
