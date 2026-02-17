import React from "react";
import { HelpCircle, ChevronRight, Check, Zap, Clipboard, Plus, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";

export default function Guide() {
  const navigate = useNavigate();

  return (
    <DashboardLayout role="teacher" userName={localStorage.getItem("teacherName") || "Ustoz"}>
      <div className="max-w-4xl mx-auto space-y-12 pb-20">
        {/* Header */}
        <section className="relative z-10 pt-12 pb-6 px-6">
          <div className="flex items-center justify-between gap-4 border-b border-primary pb-8 mb-12">
            <div>
              <button 
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-indigo-500 mb-6 hover:-translate-x-1 transition-transform"
              >
                <ArrowLeft size={14} /> Orqaga
              </button>
              <h2 className="text-4xl font-black tracking-tight text-primary mb-2 uppercase italic">
                Professional <span className="text-indigo-600 dark:text-indigo-400">Parser Qo'llanmasi</span>
              </h2>
              <p className="text-secondary font-medium uppercase tracking-widest text-xs opacity-70">
                Testlarni yuklash va tahlil qilish bo'yicha to'liq yo'riqnoma
              </p>
            </div>
          </div>
        </section>

        {/* Content Section */}
        <div className="space-y-12 px-6">
          {/* Intro */}
          <div className="p-8 bg-indigo-500/5 border border-indigo-500/10 rounded-[2.5rem] flex items-center gap-6">
            <div className="w-16 h-16 rounded-2xl bg-indigo-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
              <Zap size={32} />
            </div>
            <p className="text-sm md:text-base text-primary font-medium leading-relaxed italic">
              "osontestol.uz" platformasida testlarni Word faylidan yoki matndan yuklashda bizning professional parser savollarni avtomatik tahlil qiladi. Tizim aniq ishlashi uchun quyidagi qoidalarga amal qiling."
            </p>
          </div>

          <div className="grid gap-10">
            {/* Rule 1 */}
            <section className="premium-card group hover:border-indigo-500/50 transition-all">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 group-hover:scale-110 transition-transform">
                  <Plus size={24} />
                </div>
                <h3 className="text-xl font-black text-primary uppercase italic tracking-tighter">1. Aqlli Ketma-ketlik</h3>
              </div>
              <p className="text-sm text-secondary leading-relaxed font-medium mb-6">
                Tizim savollarni 1, 2, 3 tartibida qat'iy kuzatib boradi. Bu savol matni ichidagi boshqa raqamli ro'yxatlar bilan asosiy savolni adashtirmaslikka yordam beradi.
              </p>
              <div className="p-6 bg-secondary/50 rounded-2xl border border-primary font-mono text-xs leading-relaxed text-indigo-500">
                 1. Quyidagi shaxslarni muvofiqlashtiring:<br/>
                 1) Muhammad Rahim; 2) Doniyolbiy; 3) Shohmurod.<br/>
                 A) Variant 1<br/>
                 B) Variant 2
              </div>
            </section>

            {/* Rule 2 */}
            <section className="premium-card group hover:border-emerald-500/50 transition-all">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform">
                  <Clipboard size={24} />
                </div>
                <h3 className="text-xl font-black text-primary uppercase italic tracking-tighter">2. Katta-Kichik Harflar</h3>
              </div>
              <p className="text-sm text-secondary leading-relaxed font-medium mb-6">
                Variantlar har doim KATTA harflar (`A, B, C, D`) bilan belgilanishi shart. Kichik harfli ro'yxatlar (`a, b, c...`) savolning davomi sifatida qabul qilinadi.
              </p>
              <div className="p-6 bg-secondary/50 rounded-2xl border border-primary font-mono text-xs leading-relaxed text-emerald-600">
                 1. Noto'g'ri hukmni aniqlang:<br/>
                 a) Birinchi ma'lumot...<br/>
                 b) Ikkinchi ma'lumot...<br/>
                 A) To'g'ri javob shu yerda (Katta harfda)<br/>
                 B) Noto'g'ri javob
              </div>
            </section>

            {/* Rule 3 */}
            <section className="premium-card group hover:border-blue-500/50 transition-all">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
                  <Check size={24} />
                </div>
                <h3 className="text-xl font-black text-primary uppercase italic tracking-tighter">3. To'g'ri Javobni Belgilash</h3>
              </div>
              <p className="text-sm text-secondary leading-relaxed font-medium mb-6">
                To'g'ri javobni variant oldiga `+` belgisi qo'yish orqali YOKI matn oxiriga "Javoblar" kalitini qo'shish orqali ko'rsatishingiz mumkin.
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-6 bg-secondary/50 rounded-2xl border border-primary font-mono text-xs leading-relaxed">
                   1. Savol...<br/>
                   +A) To'g'ri javob<br/>
                   B) Variant
                </div>
                <div className="p-6 bg-secondary/50 rounded-2xl border border-primary font-mono text-xs leading-relaxed">
                   Javoblar:<br/>
                   1-A<br/>
                   2-C
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
