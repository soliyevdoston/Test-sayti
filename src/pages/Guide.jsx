import React from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  CreditCard,
  FileSpreadsheet,
  Home,
  Key,
  School,
  ShieldAlert,
  UserCircle2,
  Users,
} from "lucide-react";
import SiteFooter from "../components/SiteFooter";

const SECTIONS = [
  {
    id: "login-roles",
    icon: Key,
    title: "1. Kirish turlari",
    intro: "Platformada 3 xil kirish bor: shaxsiy kabinet, umumiy test, guruh.",
    items: [
      "Shaxsiy kabinet: Gmail + parol orqali kiriladi.",
      "Umumiy test: o'qituvchi bergan test login/paroli bilan kiriladi.",
      "Guruh kabineti: o'qituvchi bergan guruh login/paroli bilan kiriladi.",
      "Admin va o'qituvchi o'z kabinetlariga alohida kiradi.",
    ],
  },
  {
    id: "register-flow",
    icon: UserCircle2,
    title: "2. Ro'yxatdan o'tish tartibi",
    intro: "O'quvchi ro'yxatdan o'tishi soddalashtirilgan.",
    items: [
      "F.I.Sh, telefon, parol kiriting.",
      "Gmail kiritsangiz shaxsiy kabinetga to'g'ridan-to'g'ri bog'lanadi.",
      "Ro'yxatdan o'tgandan keyin login sahifasidan `Shaxsiy kabinet` bo'limini tanlang.",
      "Batafsil ishlash ketma-ketligi shu qo'llanma sahifasida jamlangan.",
    ],
  },
  {
    id: "admin-control",
    icon: School,
    title: "3. Admin boshqaruvi",
    intro: "Admin barcha jarayonni kuzatadi va nazorat qiladi.",
    items: [
      "O'qituvchilar, guruhlar, o'quvchilar sonini ko'radi.",
      "To'lov so'rovlarini pending holatda ko'radi va tasdiqlaydi/rad etadi.",
      "Qo'lda o'quvchi yoki o'qituvchiga obuna ulab bera oladi.",
      "Shaxsiy kabinet test bazasini yo'nalish bo'yicha boshqaradi.",
      "Google/Gmail kirgan foydalanuvchilarni monitoring qiladi.",
    ],
  },
  {
    id: "teacher-flow",
    icon: Users,
    title: "4. O'qituvchi ish oqimi",
    intro: "Har bir bo'lim alohida va tushunarli ishlaydi.",
    items: [
      "Dashboard: limit, qolgan imkon va faol testlar ko'rinadi.",
      "Testlar: Word/TXT/CSV yuklash, preview, arxiv, eksport.",
      "Guruhlar: o'quvchini birma-bir yoki ro'yxat (bulk) bilan qo'shish.",
      "Natijalar: test natijalari, qayta yechish so'rovlari, eksportlar.",
      "Obuna: to'lov yuborish, holat kuzatish, tarixni ko'rish.",
    ],
  },
  {
    id: "formula-upload",
    icon: FileSpreadsheet,
    title: "5. Test yuklash va formulalar",
    intro: "Formula va matnli testlar xatosiz ishlashi uchun shu tartibdan foydalaning.",
    items: [
      "Word fayl: `.docx` yoki `.docm` tavsiya etiladi (`.doc` qo'llanmaydi).",
      "TXT/CSV fayl ham yuklash mumkin, tizim avtomatik text parserdan o'tkazadi.",
      "Formula misollari: `x^2`, `x_1`, `\\frac{a}{b}`, `\\sqrt{16}`, `$...$`.",
      "Rasmli savol uchun Wordga rasm joylang yoki `[img:https://.../image.png]` formatidan foydalaning.",
      "Saqlashdan oldin preview qiling va topilgan savollar sonini tekshiring.",
      "Format xatosi chiqsa shablon fayldan foydalaning.",
    ],
  },
  {
    id: "subscription-flow",
    icon: CreditCard,
    title: "6. Obuna va to'lov",
    intro: "Obuna bo'lmagan holatda limit tugagach yordamchi funksiyalar bloklanadi.",
    items: [
      "O'qituvchi bepul 10 testdan keyin obuna orqali davom etadi.",
      "Shaxsiy kabinet o'quvchisi bepul 10 testdan keyin obuna oladi.",
      "To'lov: karta raqamiga to'lab, chekni botga yuboradi.",
      "Admin tasdiqlagach obuna funksiyalari to'liq ochiladi.",
      "Pending so'rovlar admin panelda ko'rinadi.",
    ],
  },
  {
    id: "security-warning",
    icon: ShieldAlert,
    title: "7. Xavfsizlik ogohlantirishi",
    intro: "To'lov va akkaunt bo'yicha qat'iy qoidalar mavjud.",
    items: [
      "Soxta chek yuborgan foydalanuvchilar doimiy bloklanadi.",
      "Bir qurilmada boshqa login/emailga o'tish cheklangan.",
      "Faqat haqiqiy to'lov va haqiqiy ma'lumotlar bilan ishlang.",
    ],
  },
  {
    id: "student-flow",
    icon: BookOpen,
    title: "8. O'quvchi shaxsiy kabineti",
    intro: "Shaxsiy kabinetda yo'nalish bo'yicha testlar chiqadi.",
    items: [
      "Shaxsiy kabinet birinchi kirish turi sifatida tanlangan.",
      "Gmail orqali kiriladi va o'ziga biriktirilgan testlar ko'rinadi.",
      "Yo'nalish tanlab testlarni filtrlash mumkin.",
      "Obuna bo'limi alohida mavjud va teacher obuna bo'limiga o'xshash.",
    ],
  },
];

export default function Guide() {
  const navigate = useNavigate();

  const go = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="min-h-screen bg-primary text-primary flex flex-col">
      <header className="sticky top-0 z-40 border-b border-primary bg-secondary/90 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <div className="text-left">
            <p className="text-[10px] uppercase tracking-[0.2em] text-muted font-bold">To'liq qo'llanma</p>
            <p className="text-lg font-extrabold">OsonTestOl</p>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" className="btn-secondary" onClick={() => navigate(-1)}>
              <ArrowLeft size={14} /> Orqaga
            </button>
            <button type="button" className="btn-primary" onClick={() => navigate("/")}>
              <Home size={14} /> Asosiy
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-10 w-full">
        <div className="mb-8">
          <p className="text-xs uppercase tracking-[0.18em] text-muted font-bold">To'liq qo'llanma</p>
          <h1 className="text-3xl md:text-5xl font-extrabold mt-2">Barcha jarayonlar bitta sahifada</h1>
          <p className="text-secondary mt-3 max-w-3xl">
            Login, test yuklash, obuna, to'lov, admin nazorati va xavfsizlik bo'yicha to'liq yo'riqnoma.
          </p>
        </div>

        <div className="grid lg:grid-cols-[280px_1fr] gap-5">
          <aside className="lg:sticky lg:top-20 h-fit premium-card p-3">
            <p className="px-2 py-1 text-xs uppercase tracking-[0.18em] text-muted font-bold">Bo'limlar</p>
            <div className="mt-2 space-y-1">
              {SECTIONS.map((section) => (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => go(section.id)}
                  className="w-full text-left px-2.5 py-2 rounded-lg text-sm font-semibold text-secondary hover:text-primary hover:bg-accent transition-colors"
                >
                  {section.title}
                </button>
              ))}
            </div>
          </aside>

          <section className="space-y-4">
            {SECTIONS.map((section) => {
              const Icon = section.icon;
              return (
                <article key={section.id} id={section.id} className="premium-card scroll-mt-24">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-blue-500/10 text-blue-700 border border-blue-500/20 flex items-center justify-center shrink-0">
                      <Icon size={18} />
                    </div>
                    <div>
                      <h2 className="text-xl md:text-2xl font-extrabold">{section.title}</h2>
                      <p className="text-sm text-secondary mt-1">{section.intro}</p>
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    {section.items.map((item, idx) => (
                      <div key={`${section.id}-${idx}`} className="flex items-start gap-2.5 rounded-xl border border-primary bg-primary px-3 py-2.5">
                        <div className="w-6 h-6 rounded-md bg-blue-600 text-white text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                          {idx + 1}
                        </div>
                        <p className="text-sm text-secondary font-medium">{item}</p>
                      </div>
                    ))}
                  </div>
                </article>
              );
            })}

            <article className="premium-card border border-green-500/20 bg-green-500/5">
              <h3 className="font-extrabold text-lg flex items-center gap-2">
                <CheckCircle2 size={16} className="text-green-600" /> Ishga tayyor check-list
              </h3>
              <div className="mt-3 space-y-2 text-sm text-secondary">
                <p>1. Kirish turlari va ro'yxatdan o'tish tekshirildi.</p>
                <p>2. Test yuklash preview orqali tekshirildi.</p>
                <p>3. Obuna va to'lov oqimi sinovdan o'tkazildi.</p>
                <p>4. Eksportlar (Word/PDF/Excel) test qilindi.</p>
              </div>
            </article>
          </section>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
