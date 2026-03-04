import React, { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { CreditCard, RefreshCcw, ShieldAlert, ShieldCheck } from "lucide-react";
import DashboardLayout from "../components/DashboardLayout";
import { getTeacherStudents, getTeacherTests } from "../api/api";
import { formatLimit, getTeacherSubscription } from "../utils/subscriptionTools";
import {
  getAllPaymentRequests,
  hasActiveSchoolSubscription,
  PAYMENT_CONFIG,
  submitPaymentRequest,
} from "../utils/billingTools";
import { resolvePaymentPricing, validatePromoCode, validateReferralCode } from "../utils/marketingTools";
import { syncTeacherTestUsageWithCurrent } from "../utils/testUsageTools";
import { getTeacherSolveLimitSnapshot } from "../utils/teacherSolveUsageTools";

const FREE_PLAN_FEATURES = [
  "Test yaratish va boshlash",
  "Umumiy test limiti: 10 ta",
  "Yechish limiti: 50 ta",
  "Public test oqimi",
  "Asosiy dashboard",
  "Guruhlar bo'limi yopiq",
  "Natijalar bo'limi yopiq",
  "Chatlar bo'limi yopiq",
  "Blok imtihon yopiq",
  "Preview/shablon/eksport yopiq",
];

const PRO_PLAN_FEATURES = [
  "Cheksiz test yaratish va boshlash",
  "Cheksiz yechish limiti",
  "Cheksiz o'quvchi limiti",
  "Blok imtihon: 1-2-3+ fan bilan",
  "Umumiy vaqtli kompleks testlar",
  "Guruhlar to'liq boshqaruvi",
  "Natijalar va individual tahlil",
  "Teacher-Student chat",
  "Preview (fayl/matn) tahlili",
  "TXT/CSV shablon yuklash",
  "JSON/TXT/CSV/WORD/PDF eksport",
  "Arxiv va nusxalash funksiyasi",
];

export default function TeacherSubscription() {
  const teacherId = localStorage.getItem("teacherId");
  const teacherName = localStorage.getItem("teacherName") || "O'qituvchi";
  const teacherEmail = localStorage.getItem("teacherEmail") || "";

  const [loading, setLoading] = useState(true);
  const [testsCount, setTestsCount] = useState(0);
  const [usageTestsCount, setUsageTestsCount] = useState(0);
  const [usageSolvedCount, setUsageSolvedCount] = useState(0);
  const [studentsCount, setStudentsCount] = useState(0);
  const [paymentRequests, setPaymentRequests] = useState([]);
  const [receipt, setReceipt] = useState("");
  const [receiptImage, setReceiptImage] = useState(null);
  const [promoCode, setPromoCode] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [lastRequestId, setLastRequestId] = useState("");

  const subscription = getTeacherSubscription(teacherId);
  const hasLimit = Number.isFinite(subscription.maxTests);
  const hasSolveLimit = Number.isFinite(subscription.maxSolved);
  const isProActive = String(subscription.planId) !== "free";
  const testLimitReached = hasLimit && usageTestsCount >= subscription.maxTests;
  const solveLimitReached = hasSolveLimit && usageSolvedCount >= subscription.maxSolved;
  const limitReached = testLimitReached || solveLimitReached;
  const schoolActive = hasActiveSchoolSubscription();

  const pendingRequest = useMemo(
    () =>
      paymentRequests.find(
        (request) =>
          request.userType === "teacher" &&
          String(request.userId) === String(teacherId) &&
          request.status === "pending"
      ),
    [paymentRequests, teacherId]
  );

  const teacherRequests = useMemo(
    () =>
      paymentRequests.filter(
        (request) =>
          request.userType === "teacher" &&
          String(request.userId) === String(teacherId)
      ),
    [paymentRequests, teacherId]
  );

  const pricing = useMemo(
    () =>
      resolvePaymentPricing({
        baseAmount: PAYMENT_CONFIG.teacherMonthlyAmount,
        userType: "teacher",
        planId: "teacher_monthly",
        promoCode,
        referralCode,
      }),
    [promoCode, referralCode]
  );

  const refresh = useCallback(async () => {
    if (!teacherId) return;
    try {
      setLoading(true);
      const [testsRes, studentsRes] = await Promise.all([
        getTeacherTests(teacherId).catch(() => ({ data: [] })),
        getTeacherStudents(teacherId).catch(() => ({ data: [] })),
      ]);
      const currentTests = Array.isArray(testsRes.data) ? testsRes.data.length : 0;
      const usageTests = syncTeacherTestUsageWithCurrent(teacherId, currentTests);
      const solveSnapshot = await getTeacherSolveLimitSnapshot(teacherId, Array.isArray(testsRes.data) ? testsRes.data : []);
      setTestsCount(currentTests);
      setUsageTestsCount(usageTests);
      setUsageSolvedCount(Number(solveSnapshot.usedSolved || 0));
      setStudentsCount(Array.isArray(studentsRes.data) ? studentsRes.data.length : 0);
      setPaymentRequests(getAllPaymentRequests());
    } finally {
      setLoading(false);
    }
  }, [teacherId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleSendPayment = async () => {
    if (!teacherId) return toast.warning("Teacher ID topilmadi");
    if (pendingRequest) return toast.info(`Pending so'rov bor: ${pendingRequest.requestId}`);
    if (!receiptImage) return toast.warning("Chek rasmini yuklang");
    const promoValidation = validatePromoCode(promoCode, {
      userType: "teacher",
      planId: "teacher_monthly",
    });
    if (promoCode.trim() && !promoValidation.valid) {
      return toast.warning(promoValidation.reason || "Promo kod noto'g'ri");
    }
    const referralValidation = validateReferralCode(referralCode);
    if (referralCode.trim() && !referralValidation.valid) {
      return toast.warning(referralValidation.reason || "Referral kod noto'g'ri");
    }

    try {
      setSubmitting(true);
      const requestId = await submitPaymentRequest({
        userType: "teacher",
        userId: teacherId,
        planId: "teacher_monthly",
        amount: PAYMENT_CONFIG.teacherMonthlyAmount,
        promoCode: pricing.promo.valid ? pricing.promo.code : "",
        referralCode: pricing.referral.valid ? pricing.referral.code : "",
        fullName: teacherName,
        email: teacherEmail,
        receipt: receipt.trim(),
        receiptFile: receiptImage,
      });
      setLastRequestId(requestId);
      setReceipt("");
      setReceiptImage(null);
      setPaymentRequests(getAllPaymentRequests());
      toast.success(`So'rov yuborildi. ID: ${requestId}`);
    } catch (err) {
      toast.error(err.message || "To'lov yuborishda xatolik");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout role="teacher" userName={teacherName}>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-primary uppercase italic">
              Obuna <span className="text-indigo-600">Bo'limi</span>
            </h1>
            <p className="text-sm text-secondary mt-1">
              Tarif, limit va to'lov holatini shu yerda boshqarasiz.
            </p>
          </div>
          <button type="button" onClick={refresh} className="btn-secondary">
            <RefreshCcw size={14} /> Yangilash
          </button>
        </div>

        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <div className="premium-card">
            <p className="text-[11px] uppercase tracking-wider text-muted font-bold">Joriy reja</p>
            <p className="text-2xl font-extrabold text-primary mt-2">{subscription.label}</p>
            <p className="text-xs text-secondary mt-2">
              Test limiti: {formatLimit(subscription.maxTests)} | Yechish limiti: {formatLimit(subscription.maxSolved)}
            </p>
          </div>
          <div className="premium-card">
            <p className="text-[11px] uppercase tracking-wider text-muted font-bold">Ishlatilgan test</p>
            <p className="text-2xl font-extrabold text-primary mt-2">{loading ? "..." : usageTestsCount}</p>
            <p className={`text-xs mt-2 font-semibold ${limitReached ? "text-red-600" : "text-secondary"}`}>
              {hasLimit ? `Qolgan: ${Math.max(subscription.maxTests - usageTestsCount, 0)}` : "Cheksiz"}
            </p>
            <p className="text-[11px] text-muted mt-1">Joriy testlar: {testsCount}</p>
          </div>
          <div className="premium-card">
            <p className="text-[11px] uppercase tracking-wider text-muted font-bold">Yechilganlar</p>
            <p className="text-2xl font-extrabold text-primary mt-2">{loading ? "..." : usageSolvedCount}</p>
            <p className={`text-xs mt-2 font-semibold ${solveLimitReached ? "text-red-600" : "text-secondary"}`}>
              {hasSolveLimit ? `Qolgan: ${Math.max(subscription.maxSolved - usageSolvedCount, 0)}` : "Cheksiz"}
            </p>
          </div>
          <div className="premium-card">
            <p className="text-[11px] uppercase tracking-wider text-muted font-bold">O'quvchilar</p>
            <p className="text-2xl font-extrabold text-primary mt-2">{loading ? "..." : studentsCount}</p>
            <p className="text-xs text-secondary mt-2">Limit: {formatLimit(subscription.maxStudents)}</p>
          </div>
        </section>

        <section className="grid lg:grid-cols-2 gap-4">
          <article className="premium-card border border-amber-500/20 bg-amber-500/5">
            <p className="text-[11px] uppercase tracking-wider text-muted font-bold">Bepul rejim</p>
            <h2 className="text-2xl font-extrabold mt-2">Faqat test oqimi</h2>
            <div className="space-y-2 mt-4 text-sm text-secondary">
              {FREE_PLAN_FEATURES.map((item, idx) => (
                <p key={item}>
                  {idx + 1}. {item}
                </p>
              ))}
            </div>
          </article>

          <article className="premium-card border border-blue-500/20 bg-blue-500/5">
            <p className="text-[11px] uppercase tracking-wider text-muted font-bold">Oylik Pro</p>
            <h2 className="text-2xl font-extrabold mt-2">Barcha funksiyalar ochiq</h2>
            <div className="space-y-2 mt-4 text-sm text-secondary">
              {PRO_PLAN_FEATURES.map((item, idx) => (
                <p key={item}>
                  {idx + 1}. {item}
                </p>
              ))}
            </div>
            <p className="text-xs font-semibold mt-3 text-blue-700">
              Holat: {isProActive ? "Faol Pro" : "Hozircha Bepul"}
            </p>
          </article>
        </section>

        <section className="premium-card">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h2 className="text-xl font-extrabold">Oylik o'qituvchi obunasi</h2>
              <p className="text-sm text-secondary mt-1">
                Narx:{" "}
                <span className="font-bold text-indigo-600">
                  {PAYMENT_CONFIG.teacherMonthlyAmount.toLocaleString("uz-UZ")} {PAYMENT_CONFIG.currency}
                </span>
              </p>
              <p className="text-sm text-secondary">
                Yakuniy summa:{" "}
                <span className="font-bold text-green-600">
                  {pricing.finalAmount.toLocaleString("uz-UZ")} {PAYMENT_CONFIG.currency}
                </span>
                {pricing.discountAmount > 0 && (
                  <span className="ml-2 text-xs text-blue-600">
                    (-{pricing.discountAmount.toLocaleString("uz-UZ")} {PAYMENT_CONFIG.currency})
                  </span>
                )}
              </p>
              <p className="text-sm text-secondary">
                Karta: <span className="font-bold">{PAYMENT_CONFIG.cardNumber}</span>
              </p>
              <p className="text-sm text-secondary">
                Aloqa:{" "}
                <span className="font-bold text-indigo-600">{PAYMENT_CONFIG.supportTelegram}</span> |{" "}
                <span className="font-bold">{PAYMENT_CONFIG.supportPhone}</span>
              </p>
              <p className="text-xs text-secondary mt-1">
                Instagram: {PAYMENT_CONFIG.supportInstagram} | {PAYMENT_CONFIG.domain}
              </p>
              <div className="mt-3 space-y-1 text-xs text-secondary">
                <p>1. Kartaga to'lov qiling.</p>
                <p>2. Chek rasmini yuklang.</p>
                <p>3. "To'lovni botga yuborish" tugmasini bosing.</p>
                <p>4. Admin tasdiqlagach xizmatlar to'liq ochiladi.</p>
              </div>
            </div>
            <div className="px-3 py-2 rounded-xl border border-indigo-500/20 bg-indigo-500/10 text-xs font-semibold text-indigo-700">
              Maktab obunasi: {schoolActive ? "Faol" : "Nofaol"}
            </div>
          </div>

          {!schoolActive && limitReached && (
            <div className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-sm text-secondary">
              Bepul limit tugagan. Qo'shimcha funksiyalar uchun obuna yuboring.
            </div>
          )}

          {pendingRequest ? (
            <div className="mt-4 rounded-xl border border-blue-500/20 bg-blue-500/10 p-3 text-sm text-secondary">
              Pending so'rov: <span className="font-bold">{pendingRequest.requestId}</span>. Admin tasdiqlashini kuting.
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              <div className="grid md:grid-cols-2 gap-3">
                <input
                  type="text"
                  className="input-clean"
                  placeholder="Promo kod (masalan PROSTART10)"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                />
                <input
                  type="text"
                  className="input-clean"
                  placeholder="Referral kod (masalan REF-ABITUR25)"
                  value={referralCode}
                  onChange={(e) => setReferralCode(e.target.value)}
                />
              </div>
              <p className="text-xs text-secondary">
                Promo:{" "}
                <span className={pricing.promo.valid ? "text-green-600 font-semibold" : "text-muted"}>
                  {pricing.promo.valid ? `${pricing.promo.code} (${pricing.promo.discountPercent}%)` : "yo'q"}
                </span>{" "}
                | Referral:{" "}
                <span className={pricing.referral.valid ? "text-green-600 font-semibold" : "text-muted"}>
                  {pricing.referral.valid ? `${pricing.referral.code} (${pricing.referral.discountPercent}%)` : "yo'q"}
                </span>
              </p>
              <input
                type="text"
                className="input-clean"
                placeholder="To'lov izohi (ixtiyoriy)"
                value={receipt}
                onChange={(e) => setReceipt(e.target.value)}
              />
              <input
                type="file"
                accept="image/*"
                className="input-clean"
                onChange={(e) => setReceiptImage(e.target.files?.[0] || null)}
              />
              <button type="button" className="btn-primary" onClick={handleSendPayment} disabled={submitting}>
                <CreditCard size={15} /> {submitting ? "Yuborilmoqda..." : "To'lovni botga yuborish"}
              </button>
            </div>
          )}

          {lastRequestId && <p className="mt-3 text-xs text-muted">Yuborilgan ID: {lastRequestId}</p>}
        </section>

        <section className="premium-card border border-red-500/20 bg-red-500/5">
          <div className="flex items-start gap-2">
            <ShieldAlert size={18} className="text-red-600 mt-0.5" />
            <div>
              <h3 className="text-lg font-extrabold text-primary">Ogohlantirish</h3>
              <p className="text-sm text-secondary mt-1">
                Soxta chek yuborgan foydalanuvchilar doimiy bloklanadi. Faqat haqiqiy to'lov chekini yuboring.
              </p>
            </div>
          </div>
        </section>

        <section className="premium-card">
          <div className="flex items-center gap-2 mb-4">
            <ShieldCheck size={18} className="text-indigo-600" />
            <h3 className="text-lg font-extrabold">To'lov so'rovlari tarixi</h3>
          </div>
          {teacherRequests.length ? (
            <div className="space-y-2">
              {teacherRequests.map((request) => (
                <div
                  key={request.requestId}
                  className="rounded-xl border border-primary bg-accent px-3 py-2 flex flex-col md:flex-row md:items-center md:justify-between gap-2"
                >
                  <div className="text-sm">
                    <p className="font-semibold">{request.requestId}</p>
                    <p className="text-xs text-secondary">
                      {new Date(request.createdAt).toLocaleString("uz-UZ")}
                    </p>
                  </div>
                  <div
                    className={`px-2.5 py-1 rounded-md text-xs font-semibold w-fit ${
                      request.status === "approved"
                        ? "bg-green-500/10 text-green-600"
                        : request.status === "rejected"
                          ? "bg-red-500/10 text-red-600"
                          : "bg-amber-500/10 text-amber-600"
                    }`}
                  >
                    {request.status}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted">Hozircha so'rov yuborilmagan.</p>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}
