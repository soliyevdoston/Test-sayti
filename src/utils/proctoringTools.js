import { logUserActivity } from "./activityLog";

const hotkeyViolationReason = (event) => {
  const key = String(event.key || "").toLowerCase();
  const withCtrl = event.ctrlKey || event.metaKey;

  if (withCtrl && ["c", "v", "x", "a", "p", "s", "u"].includes(key)) {
    return `Ruxsat etilmagan tugma: ${withCtrl ? "Ctrl" : "Meta"}+${key.toUpperCase()}`;
  }
  if (key === "f12") return "Developer tools tugmasi bosildi";
  if (withCtrl && event.shiftKey && ["i", "j"].includes(key)) {
    return "Developer tools shortcut ishlatildi";
  }
  return "";
};

export const startProctoringSession = ({
  maxWarnings = 3,
  cooldownMs = 1200,
  onViolation = () => {},
  onLimitReached = () => {},
} = {}) => {
  let warnings = 0;
  let lastViolationAt = 0;
  let stopped = false;

  const reportViolation = (reason, meta = {}) => {
    if (stopped) return;
    const now = Date.now();
    if (now - lastViolationAt < cooldownMs) return;
    lastViolationAt = now;
    warnings += 1;

    const payload = {
      count: warnings,
      reason,
      maxWarnings,
      at: new Date().toISOString(),
      meta,
    };

    logUserActivity({
      action: "proctoring_violation",
      area: "security",
      status: "failed",
      message: reason,
      meta: payload,
    });

    onViolation(payload);
    if (warnings >= maxWarnings) {
      onLimitReached(payload);
    }
  };

  const onVisibility = () => {
    if (document.hidden) reportViolation("Test vaqtida boshqa oynaga o'tildi");
  };
  const onBlur = () => reportViolation("Test sahifasi fokusdan chiqdi");
  const onContextMenu = (event) => {
    event.preventDefault();
    reportViolation("Sichqonchaning o'ng tugmasi bloklandi");
  };
  const onCopy = (event) => {
    event.preventDefault();
    reportViolation("Nusxa olish/copy bloklandi");
  };
  const onPaste = (event) => {
    event.preventDefault();
    reportViolation("Qo'yish/paste bloklandi");
  };
  const onCut = (event) => {
    event.preventDefault();
    reportViolation("Kesish/cut bloklandi");
  };
  const onKeyDown = (event) => {
    const reason = hotkeyViolationReason(event);
    if (!reason) return;
    event.preventDefault();
    reportViolation(reason);
  };

  document.addEventListener("visibilitychange", onVisibility);
  window.addEventListener("blur", onBlur);
  document.addEventListener("contextmenu", onContextMenu);
  document.addEventListener("copy", onCopy);
  document.addEventListener("paste", onPaste);
  document.addEventListener("cut", onCut);
  window.addEventListener("keydown", onKeyDown);

  return () => {
    stopped = true;
    document.removeEventListener("visibilitychange", onVisibility);
    window.removeEventListener("blur", onBlur);
    document.removeEventListener("contextmenu", onContextMenu);
    document.removeEventListener("copy", onCopy);
    document.removeEventListener("paste", onPaste);
    document.removeEventListener("cut", onCut);
    window.removeEventListener("keydown", onKeyDown);
  };
};
