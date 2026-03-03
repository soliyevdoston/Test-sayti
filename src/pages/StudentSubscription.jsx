import React, { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { CreditCard, RefreshCcw, ShieldAlert, ShieldCheck } from "lucide-react";
import DashboardLayout from "../components/DashboardLayout";
import { getMyResults } from "../api/api";
import {
  getAllPaymentRequests,
  hasActiveStudentSubscription,
  PAYMENT_CONFIG,
  submitPaymentRequest,
} from "../utils/billingTools";

const PERSONAL_FREE_LIMIT = 10;

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
  const [submitting, setSubmitting] = useState(false);
  const [lastRequestId, setLastRequestId] = useState("");

  const isActive = hasActiveStudentSubscription(studentId);

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

    try {
      setSubmitting(true);
      const requestId = await submitPaymentRequest({
        userType: "student",
        userId: studentId,
        planId: "student_monthly",
        amount: PAYMENT_CONFIG.studentMonthlyAmount,
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
              Tarif, limit va to'lov holatini shu yerda boshqarasiz.
            </p>
          </div>
          <button type="button" onClick={refresh} className="btn-secondary">
            <RefreshCcw size={14} /> Yangilash
          </button>
        </div>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="premium-card">
            <p className="text-[11px] uppercase tracking-wider text-muted font-bold">Joriy reja</p>
            <p className="text-2xl font-extrabold text-primary mt-2">
              {isActive ? "Shaxsiy Pro" : "Bepul"}
            </p>
            <p className="text-xs text-secondary mt-2">Bepul limit: {PERSONAL_FREE_LIMIT} test</p>
          </div>
          <div className="premium-card">
            <p className="text-[11px] uppercase tracking-wider text-muted font-bold">Ishlatilgan test</p>
            <p className="text-2xl font-extrabold text-primary mt-2">{loading ? "..." : solvedCount}</p>
            <p className={`text-xs mt-2 font-semibold ${solvedCount >= PERSONAL_FREE_LIMIT && !isActive ? "text-red-600" : "text-secondary"}`}>
              {isActive ? "Obuna faol, cheksiz foydalanish" : `Qolgan: ${Math.max(PERSONAL_FREE_LIMIT - solvedCount, 0)}`}
            </p>
          </div>
          <div className="premium-card">
            <p className="text-[11px] uppercase tracking-wider text-muted font-bold">Holat</p>
            <p className={`text-2xl font-extrabold mt-2 ${isActive ? "text-green-600" : "text-amber-600"}`}>
              {isActive ? "Faol" : "Obuna kerak"}
            </p>
            <p className="text-xs text-secondary mt-2">
              Kirish turi: {accessMode === "personal" ? "Shaxsiy kabinet" : "Guruh/Test"}
            </p>
          </div>
        </section>

        <section className="premium-card">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h2 className="text-xl font-extrabold">Oylik o'quvchi obunasi</h2>
              <p className="text-sm text-secondary mt-1">
                Narx:{" "}
                <span className="font-bold text-indigo-600">
                  {PAYMENT_CONFIG.studentMonthlyAmount.toLocaleString("uz-UZ")} {PAYMENT_CONFIG.currency}
                </span>
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
                <p>4. Admin tasdiqlagach obuna xizmatlari ochiladi.</p>
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
              Bepul limit tugaganda qo'shimcha funksiyalar uchun obuna yuboring.
            </div>
          )}

          {pendingRequest ? (
            <div className="mt-4 rounded-xl border border-blue-500/20 bg-blue-500/10 p-3 text-sm text-secondary">
              Pending so'rov: <span className="font-bold">{pendingRequest.requestId}</span>. Admin tasdiqlashini kuting.
            </div>
          ) : (
            <div className="mt-4 space-y-3">
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
