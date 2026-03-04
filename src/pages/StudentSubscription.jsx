import React, { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { CreditCard, RefreshCcw, ShieldAlert, ShieldCheck } from "lucide-react";
import DashboardLayout from "../components/DashboardLayout";
import { getMyResults } from "../api/api";
import {
  getAllPaymentRequests,
  hasActiveStudentSubscription,
  getStudentPurchasedTests,
  PAYMENT_CONFIG,
  submitPaymentRequest,
} from "../utils/billingTools";
import { resolvePaymentPricing, validatePromoCode, validateReferralCode } from "../utils/marketingTools";

const PERSONAL_FREE_LIMIT = 10;

const STUDENT_SUBSCRIPTION_OPTION = {
  id: "student_monthly",
  title: "Student Pro (oylik)",
  amount: PAYMENT_CONFIG.studentMonthlyAmount,
  desc: "Shaxsiy kabinetda cheksiz test va barcha o'quvchi funksiyalari.",
  benefit: "Cheksiz test",
};

const STUDENT_TEST_PACK_OPTIONS = [
  {
    id: "student_pack_20",
    title: "Test paketi 20 ta",
    amount: PAYMENT_CONFIG.studentPack20Amount,
    desc: "Obunasiz ham 20 ta qo'shimcha test ishlash imkoniyati.",
    benefit: "+20 test",
  },
  {
    id: "student_pack_50",
    title: "Test paketi 50 ta",
    amount: PAYMENT_CONFIG.studentPack50Amount,
    desc: "Abituriyentlar uchun katta paket: 50 ta qo'shimcha test.",
    benefit: "+50 test",
  },
];

export default function StudentSubscription() {
  const studentId = localStorage.getItem("studentId");
  const studentName = localStorage.getItem("fullName") || "O'quvchi";
  const studentEmail = localStorage.getItem("studentEmail") || "";
  const accessMode = localStorage.getItem("studentAccessMode");

  const [loading, setLoading] = useState(true);
  const [solvedCount, setSolvedCount] = useState(0);
  const [paymentRequests, setPaymentRequests] = useState([]);
  const [receipt, setReceipt] = useState("");
  const [receiptImage, setReceiptImage] = useState(null);
  const [purchaseType, setPurchaseType] = useState("subscription");
  const [selectedPlanId, setSelectedPlanId] = useState("student_monthly");
  const [promoCode, setPromoCode] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [lastRequestId, setLastRequestId] = useState("");

  const isActive = hasActiveStudentSubscription(studentId);
  const purchasedTests = getStudentPurchasedTests(studentId);
  const bonusUsed = Math.max(solvedCount - PERSONAL_FREE_LIMIT, 0);
  const bonusRemaining = Math.max(purchasedTests - bonusUsed, 0);

  const selectedPlan = useMemo(() => {
    if (purchaseType === "subscription") return STUDENT_SUBSCRIPTION_OPTION;
    return (
      STUDENT_TEST_PACK_OPTIONS.find((item) => item.id === selectedPlanId) ||
      STUDENT_TEST_PACK_OPTIONS[0]
    );
  }, [purchaseType, selectedPlanId]);

  const pendingRequest = useMemo(
    () =>
      paymentRequests.find(
        (request) =>
          request.userType === "student" &&
          String(request.userId) === String(studentId) &&
          request.status === "pending"
      ),
    [paymentRequests, studentId]
  );

  const myRequests = useMemo(
    () =>
      paymentRequests.filter(
        (request) =>
          request.userType === "student" &&
          String(request.userId) === String(studentId)
      ),
    [paymentRequests, studentId]
  );

  const pricing = useMemo(
    () =>
      resolvePaymentPricing({
        baseAmount: selectedPlan.amount,
        userType: "student",
        planId: selectedPlan.id,
        promoCode,
        referralCode,
      }),
    [promoCode, referralCode, selectedPlan]
  );

  const refresh = useCallback(async () => {
    if (!studentId) return;
    try {
      setLoading(true);
      const { data } = await getMyResults(studentId).catch(() => ({ data: [] }));
      setSolvedCount(Array.isArray(data) ? data.length : 0);
      setPaymentRequests(getAllPaymentRequests());
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleSendPayment = async () => {
    if (!studentId) return toast.warning("Student ID topilmadi");
    if (pendingRequest) return toast.info(`Pending so'rov bor: ${pendingRequest.requestId}`);
    if (!receiptImage) return toast.warning("Chek rasmini yuklang");

    const promoValidation = validatePromoCode(promoCode, {
      userType: "student",
      planId: selectedPlan.id,
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
        userType: "student",
        userId: studentId,
        planId: selectedPlan.id,
        amount: selectedPlan.amount,
        promoCode: pricing.promo.valid ? pricing.promo.code : "",
        referralCode: pricing.referral.valid ? pricing.referral.code : "",
        fullName: studentName,
        email: studentEmail,
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

  if (!studentId) {
    return null;
  }

  return (
    <DashboardLayout role="student" userName={studentName}>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-primary uppercase italic">
              Obuna <span className="text-indigo-600">Bo'limi</span>
            </h1>
            <p className="text-sm text-secondary mt-1">
              O'quvchi obunasi va test paketlarini shu yerda boshqarasiz.
            </p>
          </div>
          <button type="button" onClick={refresh} className="btn-secondary">
            <RefreshCcw size={14} /> Yangilash
          </button>
        </div>

        <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="premium-card">
            <p className="text-[11px] uppercase tracking-wider text-muted font-bold">Joriy reja</p>
            <p className="text-2xl font-extrabold text-primary mt-2">{isActive ? "Shaxsiy Pro" : "Bepul"}</p>
            <p className="text-xs text-secondary mt-2">Bepul limit: {PERSONAL_FREE_LIMIT} test</p>
          </div>
          <div className="premium-card">
            <p className="text-[11px] uppercase tracking-wider text-muted font-bold">Ishlatilgan test</p>
            <p className="text-2xl font-extrabold text-primary mt-2">{loading ? "..." : solvedCount}</p>
            <p className="text-xs mt-2 font-semibold text-secondary">
              Bepul qolgan: {Math.max(PERSONAL_FREE_LIMIT - solvedCount, 0)}
            </p>
          </div>
          <div className="premium-card">
            <p className="text-[11px] uppercase tracking-wider text-muted font-bold">Sotib olingan paket</p>
            <p className="text-2xl font-extrabold text-primary mt-2">{purchasedTests}</p>
            <p className="text-xs mt-2 font-semibold text-secondary">Paket qolgan: {bonusRemaining}</p>
          </div>
          <div className="premium-card">
            <p className="text-[11px] uppercase tracking-wider text-muted font-bold">Holat</p>
            <p className={`text-2xl font-extrabold mt-2 ${isActive ? "text-green-600" : "text-amber-600"}`}>
              {isActive ? "Faol obuna" : "Obuna faol emas"}
            </p>
            <p className="text-xs text-secondary mt-2">
              Kirish turi: {accessMode === "personal" ? "Shaxsiy kabinet" : "Guruh/Test"}
            </p>
          </div>
        </section>

        <section className="premium-card">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="w-full max-w-4xl">
              <h2 className="text-xl font-extrabold">O'quvchi obunasi (ichida test paketi)</h2>
              <p className="text-xs text-secondary mt-1">
                Bir oynada tanlov: oylik obuna yoki test paketi.
              </p>

              <div className="mt-3 grid md:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setPurchaseType("subscription");
                    setSelectedPlanId("student_monthly");
                  }}
                  className={`text-left rounded-xl border p-3 transition-colors ${
                    purchaseType === "subscription"
                      ? "border-indigo-500 bg-indigo-500/10"
                      : "border-primary bg-accent hover:border-indigo-300"
                  }`}
                >
                  <p className="text-xs font-bold text-primary">Oylik obuna</p>
                  <p className="text-[11px] text-secondary mt-1">Cheksiz test va to'liq funksiyalar.</p>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPurchaseType("pack");
                    setSelectedPlanId("student_pack_20");
                  }}
                  className={`text-left rounded-xl border p-3 transition-colors ${
                    purchaseType === "pack"
                      ? "border-indigo-500 bg-indigo-500/10"
                      : "border-primary bg-accent hover:border-indigo-300"
                  }`}
                >
                  <p className="text-xs font-bold text-primary">Test paketi</p>
                  <p className="text-[11px] text-secondary mt-1">20 yoki 50 ta testlik qo'shimcha paket.</p>
                </button>
              </div>

              {purchaseType === "subscription" && (
                <div className="mt-3 rounded-xl border border-primary bg-accent p-3">
                  <p className="text-xs font-bold text-primary">{STUDENT_SUBSCRIPTION_OPTION.title}</p>
                  <p className="text-[11px] text-secondary mt-1">{STUDENT_SUBSCRIPTION_OPTION.desc}</p>
                  <p className="text-[11px] font-semibold text-indigo-600 mt-1">{STUDENT_SUBSCRIPTION_OPTION.benefit}</p>
                </div>
              )}

              {purchaseType === "pack" && (
                <div className="mt-3 grid md:grid-cols-2 gap-2">
                  {STUDENT_TEST_PACK_OPTIONS.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setSelectedPlanId(option.id)}
                      className={`text-left rounded-xl border p-3 transition-colors ${
                        selectedPlanId === option.id
                          ? "border-indigo-500 bg-indigo-500/10"
                          : "border-primary bg-accent hover:border-indigo-300"
                      }`}
                    >
                      <p className="text-xs font-bold text-primary">{option.title}</p>
                      <p className="text-[11px] text-secondary mt-1">{option.desc}</p>
                      <p className="text-[11px] font-semibold text-indigo-600 mt-1">{option.benefit}</p>
                    </button>
                  ))}
                </div>
              )}

              <div className="mt-3 rounded-xl border border-primary bg-accent p-3">
                <p className="text-xs text-muted">Tanlangan reja</p>
                <p className="text-sm font-bold text-primary mt-0.5">{selectedPlan.title}</p>
                <p className="text-xs text-secondary mt-1">{selectedPlan.desc}</p>
                <p className="text-sm text-secondary mt-2">
                  Narx: <span className="font-bold text-indigo-600">{selectedPlan.amount.toLocaleString("uz-UZ")} {PAYMENT_CONFIG.currency}</span>
                </p>
                <p className="text-sm text-secondary">
                  Yakuniy summa: <span className="font-bold text-green-600">{pricing.finalAmount.toLocaleString("uz-UZ")} {PAYMENT_CONFIG.currency}</span>
                  {pricing.discountAmount > 0 && (
                    <span className="ml-2 text-xs text-blue-600">
                      (-{pricing.discountAmount.toLocaleString("uz-UZ")} {PAYMENT_CONFIG.currency})
                    </span>
                  )}
                </p>
              </div>

              <div className="mt-3 space-y-1 text-xs text-secondary">
                <p>1. Tanlangan rejaga qarab kartaga to'lov qiling.</p>
                <p>2. Chek rasmini yuklang.</p>
                <p>3. "To'lovni botga yuborish" tugmasini bosing.</p>
                <p>4. Admin tasdiqlagach obuna yoki test paketi faollashadi.</p>
                <p>Karta: <span className="font-bold text-primary">{PAYMENT_CONFIG.cardNumber}</span></p>
              </div>
            </div>

            <div className={`px-3 py-2 rounded-xl border text-xs font-semibold ${
              isActive ? "border-green-500/20 bg-green-500/10 text-green-700" : "border-amber-500/20 bg-amber-500/10 text-amber-700"
            }`}>
              Holat: {isActive ? "Faol obuna" : "Faol emas"}
            </div>
          </div>

          {!isActive && (
            <div className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-sm text-secondary">
              Bepul limit tugaganda obuna yoki test paketdan foydalaning.
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
                  placeholder="Promo kod (masalan ABITUR20)"
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
                Promo: <span className={pricing.promo.valid ? "text-green-600 font-semibold" : "text-muted"}>
                  {pricing.promo.valid ? `${pricing.promo.code} (${pricing.promo.discountPercent}%)` : "yo'q"}
                </span>{" "}
                | Referral: <span className={pricing.referral.valid ? "text-green-600 font-semibold" : "text-muted"}>
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

        <section className="premium-card">
          <div className="flex items-center gap-2 mb-4">
            <ShieldCheck size={18} className="text-indigo-600" />
            <h3 className="text-lg font-extrabold">To'lov so'rovlari tarixi</h3>
          </div>
          {myRequests.length ? (
            <div className="space-y-2">
              {myRequests.map((request) => (
                <div
                  key={request.requestId}
                  className="rounded-xl border border-primary bg-accent px-3 py-2 flex flex-col md:flex-row md:items-center md:justify-between gap-2"
                >
                  <div className="text-sm">
                    <p className="font-semibold">{request.requestId}</p>
                    <p className="text-xs text-secondary mt-0.5">
                      Reja: {request.planId || "-"} | {Number(request.amount || 0).toLocaleString("uz-UZ")} {PAYMENT_CONFIG.currency}
                    </p>
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
      </div>
    </DashboardLayout>
  );
}
