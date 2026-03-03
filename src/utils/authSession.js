const PERSISTED_KEYS = new Set([
  "theme",
  "billing_payment_requests_v1",
  "billing_user_subscriptions_v1",
  "billing_oauth_users_v1",
  "billing_device_locks_v1",
  "billing_telegram_config_v1",
  "teacher_subscription_limits_v1",
  "teacher_test_usage_v1",
  "teacher_solved_usage_v1",
  "admin_student_test_assignments_v1",
  "student_personal_catalog_v1",
  "activity_logs_v1",
  "student_personal_assignments_v1",
]);

export const clearUserSession = () => {
  Object.keys(localStorage).forEach((key) => {
    if (!PERSISTED_KEYS.has(key)) {
      localStorage.removeItem(key);
    }
  });
};

export const getStoredRole = () => String(localStorage.getItem("userRole") || "").toLowerCase();

export const isRoleAllowed = (allowedRoles = []) => {
  const role = getStoredRole();
  return allowedRoles.some((item) => String(item).toLowerCase() === role);
};

export const hasValidSessionForRole = (role = getStoredRole()) => {
  const normalizedRole = String(role || "").toLowerCase();
  if (normalizedRole === "admin") {
    return Boolean(localStorage.getItem("schoolId"));
  }
  if (normalizedRole === "teacher") {
    return Boolean(localStorage.getItem("teacherId"));
  }
  if (normalizedRole === "student") {
    return Boolean(localStorage.getItem("studentId") || localStorage.getItem("studentTestId"));
  }
  return false;
};
