import React, { useState } from "react";
import DashboardLayout from "../components/DashboardLayout";
import { CreditCard, Check, Shield, Zap, Info, ArrowRight, Minus, Plus, Loader2 } from "lucide-react";
import { toast } from "react-toastify";
import { createSubscription, getSubscriptionStatus } from "../api/api";

export default function Payments() {
  const [loading, setLoading] = useState(false);
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [counts, setCounts] = useState({
    testKitobi: 100,
    onlineTest: 100,
    aiTest: 25,
    pdfWord: 25
  });

  const basePrice = 99000;

  useEffect(() => {
    const fetchStatus = async () => {
      const teacherId = localStorage.getItem("teacherId");
      if (teacherId) {
        try {
          const res = await getSubscriptionStatus(teacherId);
          setCurrentSubscription(res.data);
        } catch (error) {
          console.error("Status check failed:", error);
        }
      }
    };
    fetchStatus();
  }, []);
  
  const updateCount = (key, delta) => {
    setCounts(prev => ({
      ...prev,
      [key]: Math.max(0, prev[key] + delta)
    }));
  };

  const handleSubscribe = async (plan) => {
    if (plan.price === "Bepul") {
      return toast.info("Siz hozirda bepul tarifdasiz");
    }
    
    if (plan.title === "Korxona tarifi") {
      window.open("https://t.me/soliyev_d", "_blank");
      return;
    }

    try {
      setLoading(true);
      const teacherId = localStorage.getItem("teacherId");
      
      if (!teacherId) {
        toast.error("Iltimos, avval tizimga kiring");
        return;
      }

      await createSubscription({
        teacherId,
        planType: plan.title,
        amount: plan.price
      });

      toast.success("To'lov so'rovi yuborildi. Tezpisi siz bilan bog'lanamiz!");
    } catch (error) {
      toast.error("Xatolik yuz berdi: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const features = [
    "Test kitobchasini yaratish (Word orqali)",
    "Online test o'tkazish (Xona tizimi)",
    "Guruhlar va Shaxsiy o'quvchi kabinetlari",
    "Savollarni qo'lda (manual) kiritish imkoniyati",
    "O'qituvchi va o'quvchi o'rtasida shaxsiy Chat",
    "Hisobotlar va natijalar tahlili",
    "Sun'iy intellekt (AI) yordamida testlar",
    "PDFdan Wordga o'tkazish",
    "Do'kon bo'limidan foydalanish"
  ];

  const plans = [
    {
      title: "Boshlang'ich tarifi",
      price: "Bepul",
      features: [
        "50 ta Test kitobchasini yaratish",
        "50 ta Onlayn test o'tkazish",
        "Manual test yaratish imkoniyati",
        "Cheksiz Guruhlar",
        "10 ta Shaxsiy o'quvchi akkaunti",
        "Cheklangan Chat funksiyasi",
        "10 ta AI yordamida savollar",
        "10 ta PDF dan Wordga o'tkazish",
        "Do'kon bo'limidan foydalanish"
      ],
      buttonText: "Obuna bo'lish",
      color: "border-primary"
    },
    {
      title: "Asosiy tarifi",
      price: "99 000 uzs/yil",
      recommended: true,
      features: [
        "100 ta Test kitobchasini yaratish",
        "100 ta Onlayn test o'tkazish",
        "Cheksiz Manual test yaratish",
        "Cheksiz Guruhlar",
        "Cheksiz Shaxsiy o'quvchi akkaunti",
        "To'liq Chat funksiyasi",
        "25 ta AI yordamida savollar",
        "25 ta PDF dan Wordga o'tkazish",
        "Do'kon bo'limidan foydalanish"
      ],
      buttonText: "Obuna bo'lish",
      color: "border-indigo-500 shadow-indigo-500/20 shadow-xl"
    },
    {
      title: "Korxona tarifi",
      price: "Kelishiladi",
      features: [
        "Test savollari bazasini yaratish",
        "Test kitobchasini yaratish",
        "Testlarni ulashish",
        "Titul tekshirish",
        "Guruh va talabalar bazasi",
        "Hisobotlar yaratish",
        "Natijalarni ko'rish imkoniyati",
        "Savollarni ko'chirish va ulashish",
        "Xato savollarni tuzatish",
        "Do'kon bo'limidan foydalanish",
        "Onlayn test yaratish",
        "Su'niy intellekt yordamida savollar",
        "PDF dan Wordga o'tkazish",
        "API integratsiya",
        "Shaxsiylashtirilgan brending",
        "Maxsus qo'llab-quvvatlash"
      ],
      buttonText: "Bog'lanish",
      color: "border-primary"
    }
  ];

  return (
    <DashboardLayout role="teacher">
      <div className="max-w-7xl mx-auto">
        <div className="mb-16 text-center">
          <h1 className="text-4xl font-black text-primary italic uppercase tracking-tighter mb-4">Tarif <span className="text-indigo-500">Rejalari</span></h1>
          <p className="text-sm text-muted font-bold uppercase tracking-widest">O'zingizga mos tarifni tanlang va imkoniyatlarni kengaytiring</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {plans.map((plan, i) => (
            <div key={i} className={`premium-card relative flex flex-col ${plan.color} ${plan.recommended ? 'scale-105 z-10' : ''}`}>
              {plan.recommended && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-[10px] font-black px-6 py-2 rounded-full uppercase tracking-widest shadow-lg">
                  Tavsiya qilamiz
                </div>
              )}
              
              <div className="mb-10 text-center">
                <h3 className="text-2xl font-black text-primary uppercase tracking-tighter italic mb-8">{plan.title}</h3>
                <div className="space-y-4">
                  {plan.features.map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-3 text-left">
                      <div className="w-5 h-5 rounded-md bg-indigo-500/10 flex items-center justify-center text-indigo-500 shrink-0">
                        <Check size={12} strokeWidth={3} />
                      </div>
                      <span className="text-xs font-bold text-muted group-hover:text-primary transition-colors">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-auto pt-10 border-t border-primary/10">
                <div className="text-center mb-8">
                  <p className="text-2xl font-black text-primary tracking-tighter">{plan.price}</p>
                </div>
                <button 
                  disabled={loading || currentSubscription?.planType === plan.title}
                  onClick={() => handleSubscribe(plan)}
                  className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${plan.recommended ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-600/30 shadow-xl' : 'bg-secondary text-primary hover:bg-indigo-600 hover:text-white'} ${(currentSubscription?.planType === plan.title && plan.price !== "Bepul") ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {loading ? <Loader2 size={16} className="animate-spin" /> : (currentSubscription?.planType === plan.title && plan.price !== "Bepul" ? "Faol" : plan.buttonText)}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Existing Calculator as an Optional Tool */}
        <div className="mt-32 premium-card bg-gradient-to-br from-indigo-500/5 to-blue-600/5 border-indigo-500/20">
          <h3 className="text-xl font-black text-primary uppercase tracking-tighter mb-10 text-center">Yillik asosiy tarifning aniq narxini hisoblang</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
            {[
              { label: "Test kitobini yaratish", key: "testKitobi" },
              { label: "Online test o'tkazish", key: "onlineTest" },
              { label: "AI test savollari", key: "aiTest" },
              { label: "PDFdan Wordga", key: "pdfWord" }
            ].map((item) => (
              <div key={item.key} className="space-y-4">
                <label className="text-[10px] font-black text-muted uppercase tracking-widest block text-center truncate">{item.label}</label>
                <div className="flex items-center justify-between glass p-2 rounded-2xl border border-primary">
                  <button 
                    onClick={() => updateCount(item.key, -5)}
                    className="w-10 h-10 rounded-xl bg-primary text-primary hover:bg-red-500 hover:text-white transition-all flex items-center justify-center"
                  >
                    <Minus size={16} />
                  </button>
                  <span className="text-lg font-black text-primary">{counts[item.key]}</span>
                  <button 
                    onClick={() => updateCount(item.key, 5)}
                    className="w-10 h-10 rounded-xl bg-primary text-primary hover:bg-indigo-500 hover:text-white transition-all flex items-center justify-center"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-8 border-t border-primary/10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <p className="text-4xl font-black text-primary tracking-tighter">{basePrice.toLocaleString()} <span className="text-xl text-muted font-bold">so'm/yil</span></p>
              <div className="flex items-center gap-2 mt-2">
                <span className="px-2 py-1 rounded-lg bg-green-500/10 text-green-600 text-[10px] font-black uppercase tracking-widest">Aksiya vaqtida</span>
                <Zap size={14} className="text-indigo-500 animate-pulse" />
              </div>
            </div>
            <button 
              disabled={loading}
              onClick={() => handleSubscribe({ title: "Maxsus tarif (Calculator)", price: `${basePrice.toLocaleString()} so'm/yil` })}
              className="w-full md:w-auto px-12 py-5 bg-indigo-600 text-white rounded-[2rem] font-black text-sm uppercase tracking-widest shadow-xl shadow-indigo-600/30 hover:scale-[1.05] transition-all flex items-center justify-center gap-3"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <>To'lov <ArrowRight size={18} /></>}
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
