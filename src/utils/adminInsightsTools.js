const toDate = (value) => {
  const date = new Date(value || 0);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const buildAuditRiskSummary = (logs = []) => {
  const rows = Array.isArray(logs) ? logs : [];
  const now = Date.now();
  const oneDayAgo = now - 24 * 60 * 60 * 1000;

  const recent = rows.filter((row) => {
    const date = toDate(row.createdAt);
    return date ? date.getTime() >= oneDayAgo : false;
  });

  const failed = recent.filter((row) => String(row.status || "").toLowerCase() === "failed");
  const security = recent.filter((row) => String(row.area || "").toLowerCase() === "security");
  const blocked = recent.filter((row) => String(row.action || "").toLowerCase().includes("device_login_blocked"));

  const actorMap = {};
  failed.forEach((row) => {
    const key = `${String(row.actorRole || "guest")}:${String(row.actorName || "Unknown")}`;
    actorMap[key] = (actorMap[key] || 0) + 1;
  });

  const topActors = Object.entries(actorMap)
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const score = failed.length * 2 + security.length * 3 + blocked.length * 4;
  const riskLevel = score >= 45 ? "high" : score >= 20 ? "medium" : "low";

  return {
    score,
    riskLevel,
    recentCount: recent.length,
    failedCount: failed.length,
    securityCount: security.length,
    blockedCount: blocked.length,
    topActors,
  };
};

const dateLabel = (date) =>
  new Intl.DateTimeFormat("uz-UZ", {
    day: "2-digit",
    month: "2-digit",
  }).format(date);

export const buildAuditTimeline = (logs = [], days = 7) => {
  const safeDays = Math.max(Number(days || 7), 1);
  const now = new Date();

  const buckets = Array.from({ length: safeDays }, (_, idx) => {
    const date = new Date(now);
    date.setDate(now.getDate() - (safeDays - 1 - idx));
    const key = date.toISOString().slice(0, 10);
    return {
      key,
      label: dateLabel(date),
      success: 0,
      failed: 0,
    };
  });

  const bucketMap = Object.fromEntries(buckets.map((bucket) => [bucket.key, bucket]));

  (Array.isArray(logs) ? logs : []).forEach((row) => {
    const date = toDate(row.createdAt);
    if (!date) return;
    const key = date.toISOString().slice(0, 10);
    if (!bucketMap[key]) return;
    const isFailed = String(row.status || "").toLowerCase() === "failed";
    if (isFailed) bucketMap[key].failed += 1;
    else bucketMap[key].success += 1;
  });

  return buckets;
};
