import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Brain,
  BarChart3,
  BookOpen,
  CheckCircle2,
  FileSpreadsheet,
  Instagram,
  MessageSquareText,
  Phone,
  Send,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Star,
  Users,
} from "lucide-react";
import SiteFooter from "../components/SiteFooter";
import PublicHeader from "../components/PublicHeader";
import { applySeoMeta } from "../utils/seoTools";

const STATS = [
  { value: "3", label: "Rolga mos oqim" },
  { value: "10 daq", label: "Tez ishga tushirish" },
  { value: "PDF/Word", label: "Eksport tayyor" },
  { value: "24/7", label: "Doimiy nazorat" },
];

const FEATURES = [
  {
    icon: FileSpreadsheet,
    title: "Word/TXT/CSV import",
    desc: "Mavjud test fayllaringizni qayta yozmasdan tizimga kiriting va preview orqali tekshirib saqlang.",
  },
  {
    icon: BookOpen,
    title: "Formula-friendly savollar",
    desc: "Matematika va aniq fanlar uchun formulalar to'g'ri parse qilinadi, savollar tushunarli ko'rinadi.",
  },
  {
    icon: BarChart3,
    title: "Chuqur tahlil paneli",
    desc: "Test kesimi, o'quvchi kesimi, to'g'ri/xato dinamikasi va natijalar bo'yicha tez qaror oling.",
  },
  {
    icon: Users,
    title: "Guruh va login boshqaruvi",
    desc: "Har guruhga alohida o'quvchi qo'shing, login/parolni avtomatik yarating va nusxalang.",
  },
  {
    icon: MessageSquareText,
    title: "Teacher-Student chat",
    desc: "O'quvchilar bilan aloqani platforma ichida yuriting, savol-javoblarni yo'qotmang.",
  },
  {
    icon: Brain,
    title: "Savollar banki + smart generator",
    desc: "Pro o'qituvchi uchun AI-uslubidagi savol generatori va qayta ishlatiladigan savollar banki.",
  },
  {
    icon: ShieldCheck,
    title: "To'lov va obuna nazorati",
    desc: "Chek qabul qilish, pending so'rovlar, admin tasdiqlash va obuna aktivatsiyasi bir joyda.",
  },
  {
    icon: Smartphone,
    title: "PWA ilova rejimi",
    desc: "Saytni ilova sifatida o'rnatish, tez ochish va asosiy ekran orqali ishlash imkoniyati.",
  },
];

const WORKFLOW = [
  {
    step: "01",
    title: "Testni yuklang yoki yarating",
    desc: "Fayl import qiling yoki matndan test yarating. Preview bilan savollarni tekshiring.",
  },
  {
    step: "02",
    title: "Guruhga biriktiring va boshlang",
    desc: "O'quvchilarni guruhga kiriting, testni oching va kerak bo'lsa jonli to'xtating.",
  },
  {
    step: "03",
    title: "Natijani tahlil qilib qaror qiling",
    desc: "Natijalarni eksport qiling, qayta yechish so'rovlarini boshqaring, kuchli tarafni toping.",
  },
];

const WORKFLOW_META = [
  {
    title: "Start vaqti",
    value: "10-15 daqiqa",
    desc: "Birinchi test oqimini tez ishga tushirish.",
  },
  {
    title: "Texnik talab",
    value: "Past",
    desc: "Texnik bo'lmagan jamoa ham bemalol moslashadi.",
  },
  {
    title: "Natija formati",
    value: "Excel/PDF",
    desc: "Hisobot va monitoring uchun tayyor eksportlar.",
  },
];

const AUDIENCE = [
  {
    title: "O'qituvchi",
    focus: "Test + guruh + chat + eksport",
    path: "/teacher/login",
    points: [
      "Yangi testlar oqimi",
      "Guruh bo'yicha nazorat",
      "Natijalarni tez tahlil",
    ],
  },
  {
    title: "O'quvchi",
    focus: "Shaxsiy kabinet yoki guruh kirishi",
    path: "/student/login",
    points: [
      "Testlar ro'yxati",
      "Yechilganlar tarixi",
      "Qayta yechish so'rovi",
    ],
  },
  {
    title: "Admin",
    focus: "Tizim va to'lov boshqaruvi",
    path: "/admin/login",
    points: [
      "O'qituvchilar nazorati",
      "Obuna monitoringi",
      "Platforma statistikasi",
    ],
  },
];

const PRICING = [
  {
    name: "Bepul",
    price: "0 so'm",
    tag: "Start",
    list: [
      "Faqat test oqimi (yaratish va boshlash)",
      "10 ta test limiti",
      "50 ta umumiy yechish limiti",
      "Blok imtihon yopiq",
      "Guruh, chat, natija, eksport: yopiq",
    ],
  },
  {
    name: "O'quvchi Pro",
    price: "39 000 so'm / oy",
    tag: "Student",
    list: [
      "Shaxsiy kabinetda cheksiz test",
      "Obuna ichida test paket tanlovi: 20 ta yoki 50 ta",
      "Yo'nalish bo'yicha keng baza",
      "Natijalar tarixi va tahlil",
      "Shaxsiy roadmap va progress reja",
      "Qayta yechish so'rovi",
      "Mustaqil to'lov yuborish",
    ],
  },
  {
    name: "Teacher Pro",
    price: "49 000 so'm / oy",
    tag: "Most chosen",
    list: [
      "Barcha teacher funksiyalari ochiq",
      "Blok imtihon (1-2-3+ fan)",
      "Cheksiz test va cheksiz yechish",
      "Guruh, chat, natija va sozlamalar",
      "Preview, shablon va to'liq eksport",
      "Arxiv, nusxa olish, analitika",
    ],
  },
  {
    name: "Maktab",
    price: "1 499 000 so'm / oy",
    tag: "Scale",
    list: [
      "Barcha o'qituvchilar",
      "Markazlashgan nazorat",
      "Maktab darajasida monitoring",
    ],
  },
];

const SUBSCRIPTION_FLOW = [
  {
    title: "Limit tugaydi",
    desc: "Bepul limit (10 test yoki 50 yechish) tugagach tizim obuna bo'limiga yo'naltiradi.",
  },
  {
    title: "To'lov yuboriladi",
    desc: "O'qituvchi yoki o'quvchi o'zi kirib obuna yoki test paketini sotib olib chek jo'natadi.",
  },
  {
    title: "Admin tekshiradi",
    desc: "Admin cheklar va foydalanuvchi holatini tekshiradi.",
  },
  {
    title: "Obuna faollashadi",
    desc: "Tasdiqlangach limitlar ochiladi va to'liq funksiyalar ishlaydi.",
  },
];

const PLAN_GUIDE = [
  "Bepul: faqat test oqimini sinab ko'rish (10 test / 50 yechish).",
  "O'quvchi: Student Pro yoki test paketi orqali mustaqil davom ettirish mumkin.",
  "Teacher Pro: kundalik ishlash uchun barcha teacher bo'limlari to'liq ochiq.",
  "Maktab: bir nechta o'qituvchi va markazlashgan monitoring uchun.",
];

const PRO_FEATURES_FULL = [
  "Cheksiz test yaratish va boshlash",
  "Cheksiz yechish limiti",
  "Blok imtihon (bir testda ko'p fan)",
  "Umumiy vaqtli kompleks test oqimi",
  "Guruhlar bo'limi va o'quvchi boshqaruvi",
  "Natijalar va individual tahlil",
  "Teacher-Student chat",
  "Preview va parser tekshiruvi",
  "Savollar banki va smart generator",
  "Natija sertifikati generatori",
  "Test sotuvga yuborish va bonus modeli",
  "TXT/CSV shablon yuklash",
  "JSON/TXT/CSV/WORD/PDF eksport",
  "PWA ilova sifatida o'rnatish",
  "Arxiv va nusxalash",
  "Sozlamalar bo'limi va profil boshqaruvi",
];

const TESTIMONIALS = [
  {
    text: "Oldin test jarayoni tarqoq edi. Endi guruh, natija va chat bitta panelda.",
    author: "Madina T., Matematika o'qituvchisi",
  },
  {
    text: "Shaxsiy kabinetdan kirib testlarimni tartibli yechayapman, tarix va yo'nalish bo'yicha topish juda qulay.",
    author: "Sardor A., Shaxsiy kabinet o'quvchisi",
  },
];

const FAQS = [
  {
    q: "Platformani ishga tushirish qancha vaqt oladi?",
    a: "Agar testlaringiz tayyor bo'lsa, odatda 10-15 daqiqada birinchi test oqimini to'liq yo'lga qo'yasiz.",
  },
  {
    q: "Word/TXT/CSV fayllarni qayta ishlash bormi?",
    a: "Ha. Import, preview va saqlash oqimi bor. Formula ishlatilgan savollar ham qo'llab-quvvatlanadi.",
  },
  {
    q: "Bepul tarifdan keyin nima bo'ladi?",
    a: "10 ta test yoki 50 ta yechish tugaganda qo'shimcha bo'limlar yopiq qoladi. Pro to'lovi yuborilib admin tasdiqlagach barcha funksiyalar ochiladi.",
  },
  {
    q: "Mobil qurilmada ishlaydimi?",
    a: "Ha. Dashboard va asosiy sahifalar mobilga moslashgan, tezkor ishlash uchun optimallashtirilgan.",
  },
];

const CONTACTS = [
  {
    icon: Send,
    channel: "Telegram",
    value: "@Dostonbek_Solijonov",
    note: "Tezkor savollar uchun",
    href: "https://t.me/Dostonbek_Solijonov",
  },
  {
    icon: Instagram,
    channel: "Instagram",
    value: "@soliyev_web",
    note: "Yangiliklar va yangilanishlar",
    href: "https://instagram.com/soliyev_web",
  },
  {
    icon: Phone,
    channel: "Telefon",
    value: "+998 91 660 56 06",
    note: "Ish vaqti: 09:00 - 18:00",
    href: "tel:+998916605606",
  },
];

const CONTACT_INFO = [
  "Savollar bo'yicha odatda 5-15 daqiqada javob beriladi.",
  "Texnik muammolar bo'yicha bosqichma-bosqich yo'riqnoma beriladi.",
  "Hamkorlik va integratsiya bo'yicha alohida ish tartibi tuziladi.",
];

const SectionTitle = ({ badge, title, subtitle }) => (
  <div className="max-w-3xl">
    <p className="text-xs uppercase tracking-[0.2em] text-muted font-bold">
      {badge}
    </p>
    <h2 className="text-3xl md:text-5xl font-extrabold mt-2 leading-tight">
      {title}
    </h2>
    {subtitle && <p className="text-secondary mt-3 text-base">{subtitle}</p>}
  </div>
);

const ScreenSection = ({ id, className = "", delay = 0, children }) => {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.24 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      id={id}
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`home-screen-section ${visible ? "is-visible" : ""} ${className}`}
    >
      {children}
    </section>
  );
};

export default function Home() {
  const navigate = useNavigate();

  const scrollTo = (id) => {
    const section = document.getElementById(id);
    section?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  useEffect(() => {
    document.body.classList.add("home-scroll-snap");
    return () => document.body.classList.remove("home-scroll-snap");
  }, []);

  useEffect(() => {
    const target = String(sessionStorage.getItem("homeScrollTarget") || "").trim();
    if (!target) return;
    sessionStorage.removeItem("homeScrollTarget");
    setTimeout(() => scrollTo(target), 80);
  }, []);

  useEffect(() => {
    applySeoMeta({
      title: "OsonTestOl | testonlinee.uz - Online test boshqaruv platformasi",
      description:
        "Online test, mavzulashtirilgan test, yo'nalish test, olimpiada test va blok imtihonlar uchun OsonTestOl platformasi.",
      keywords:
        "online test, test online test, mavzulashtirilgan test, yonalish test, olimpiada test, blok imtihon, attestat test, abituriyent test",
      canonicalPath: "/",
    });
  }, []);

  return (
    <div className="min-h-screen bg-primary text-primary relative overflow-hidden">
      <div className="pointer-events-none absolute -top-28 -left-24 w-80 h-80 rounded-full bg-blue-500/10 blur-3xl animate-blob" />
      <div className="pointer-events-none absolute top-16 -right-20 w-[22rem] h-[22rem] rounded-full bg-cyan-500/10 blur-3xl animate-blob [animation-delay:1.5s]" />
      <div className="pointer-events-none absolute bottom-6 left-1/2 -translate-x-1/2 w-[40rem] h-[20rem] rounded-full bg-indigo-500/10 blur-3xl" />

      <PublicHeader onNavigateSection={scrollTo} />

      <main className="relative z-10 max-w-7xl mx-auto px-4 md:px-4 pt-0 md:pt-0 pb-16 md:pb-20">
        <ScreenSection
          id="hero"
          className="grid lg:grid-cols-[1.05fr_0.95fr] gap-8 xl:gap-10 items-center"
        >
          <div>
            <p className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] uppercase tracking-[0.2em] font-bold border border-blue-500/20 bg-blue-500/10 text-blue-700">
              <Sparkles size={12} /> Zamonaviy online test ekotizimi
            </p>
            <h1 className="text-4xl md:text-6xl font-extrabold leading-tight mt-4">
              Test jarayonini
              <span className="block text-gradient">
                pro darajaga olib chiqing
              </span>
            </h1>
            <p className="text-secondary mt-5 max-w-2xl text-base md:text-lg">
              O'qituvchi, o'quvchi va admin uchun yagona platforma: test
              yaratish, guruh boshqarish, chat, tahlil, to'lov va obuna nazorati
              bitta joyda.
            </p>

            <div className="flex flex-wrap gap-3 mt-7">
              <button
                type="button"
                className="btn-primary"
                onClick={() => navigate("/teacher/register")}
              >
                Bepul boshlash <ArrowRight size={14} />
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => navigate("/student/login")}
              >
                Student kirishi
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-8">
              {STATS.map((item) => (
                <div
                  key={item.label}
                  className="rounded-xl border border-primary bg-secondary/80 p-3"
                >
                  <p className="text-lg font-extrabold text-primary">
                    {item.value}
                  </p>
                  <p className="text-[11px] text-secondary mt-0.5">
                    {item.label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="premium-card">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.16em] text-muted font-bold">
                Live qiymat taklifi
              </p>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold border border-green-500/20 bg-green-500/10 text-green-700">
                Active
              </span>
            </div>

            <div className="mt-4 space-y-3">
              <div className="rounded-xl border border-primary bg-accent p-4">
                <p className="text-xs uppercase tracking-widest text-muted font-bold">
                  Qanday foyda beradi?
                </p>
                <p className="text-sm text-secondary mt-2">
                  Test tayyorlash va tekshirishga ketadigan vaqtni qisqartiradi,
                  nazoratni markazlashtiradi.
                </p>
              </div>
              <div className="rounded-xl border border-primary bg-accent p-4">
                <p className="text-xs uppercase tracking-widest text-muted font-bold">
                  Kimlar uchun?
                </p>
                <p className="text-sm text-secondary mt-2">
                  O'quv markaz, maktab, xususiy mentorlar va onlayn test sotish
                  modeli uchun tayyor.
                </p>
              </div>
              <div className="rounded-xl border border-primary bg-accent p-4">
                <p className="text-xs uppercase tracking-widest text-muted font-bold">
                  Natija
                </p>
                <div className="grid grid-cols-2 gap-2 mt-2 text-[11px] font-semibold text-secondary">
                  <p className="inline-flex items-center gap-1.5">
                    <CheckCircle2 size={13} className="text-blue-600" /> Tez
                    ishga tushirish
                  </p>
                  <p className="inline-flex items-center gap-1.5">
                    <CheckCircle2 size={13} className="text-blue-600" /> Nazorat
                    kuchayadi
                  </p>
                  <p className="inline-flex items-center gap-1.5">
                    <CheckCircle2 size={13} className="text-blue-600" /> Vaqt
                    tejaladi
                  </p>
                  <p className="inline-flex items-center gap-1.5">
                    <CheckCircle2 size={13} className="text-blue-600" /> Ishonch
                    ortadi
                  </p>
                </div>
              </div>
            </div>
          </div>
        </ScreenSection>

        <ScreenSection id="features" className="space-y-6" delay={60}>
          <SectionTitle
            badge="Asosiy imkoniyatlar"
            title="Har bir bo'lim amaliy natijaga yo'naltirilgan"
            subtitle="Platforma test jarayonini markazlashtirish, tezlashtirish va nazoratni kuchaytirish uchun ishlab chiqilgan."
          />
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4 items-stretch">
            {FEATURES.map((item) => (
              <article key={item.title} className="premium-card h-full">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center">
                  <item.icon size={18} />
                </div>
                <h3 className="text-lg font-extrabold mt-3">{item.title}</h3>
                <p className="text-sm text-secondary mt-2">{item.desc}</p>
              </article>
            ))}
          </div>
        </ScreenSection>

        <ScreenSection id="workflow" className="space-y-6" delay={100}>
          <SectionTitle
            badge="Qanday ishlaydi"
            title="3 qadamda to'liq test ekotizimi"
            subtitle="Soddalashtirilgan ish jarayoni sababli texnik bo'lmagan jamoalar ham tez moslashadi."
          />
          <div className="grid md:grid-cols-3 gap-4 items-stretch">
            {WORKFLOW.map((item) => (
              <article
                key={item.step}
                className="premium-card h-full flex flex-col"
              >
                <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-600">
                  {item.step}
                </p>
                <h3 className="text-xl font-extrabold mt-2">{item.title}</h3>
                <p className="text-sm text-secondary mt-2">{item.desc}</p>
              </article>
            ))}
          </div>

          <div className="grid md:grid-cols-3 gap-4 items-stretch">
            {WORKFLOW_META.map((item) => (
              <article key={item.title} className="premium-card h-full">
                <p className="text-xs uppercase tracking-[0.14em] text-muted font-bold">
                  {item.title}
                </p>
                <p className="text-2xl font-extrabold mt-2 text-blue-600">
                  {item.value}
                </p>
                <p className="text-sm text-secondary mt-1.5">{item.desc}</p>
              </article>
            ))}
          </div>
        </ScreenSection>

        <ScreenSection className="space-y-6" delay={120}>
          <SectionTitle
            badge="Rolga mos echim"
            title="Har foydalanuvchi o'z vazifasi bo'yicha ishlaydi"
            subtitle="Kabinetlar mustaqil ishlaydi, lekin barcha jarayonlar yagona tizimda boshqariladi."
          />
          <div className="grid md:grid-cols-3 gap-4 items-stretch">
            {AUDIENCE.map((item) => (
              <article
                key={item.title}
                className="premium-card h-full flex flex-col"
              >
                <h3 className="text-xl font-extrabold">{item.title}</h3>
                <p className="text-xs uppercase tracking-[0.16em] text-blue-600 font-bold mt-1">
                  {item.focus}
                </p>
                <div className="space-y-2 mt-4 flex-1">
                  {item.points.map((point) => (
                    <p
                      key={point}
                      className="text-sm text-secondary flex items-start gap-2"
                    >
                      <CheckCircle2
                        size={14}
                        className="mt-0.5 text-blue-600 shrink-0"
                      />
                      {point}
                    </p>
                  ))}
                </div>
                <button
                  type="button"
                  className="btn-secondary mt-5"
                  onClick={() => navigate(item.path)}
                >
                  Kirish <ArrowRight size={14} />
                </button>
              </article>
            ))}
          </div>
        </ScreenSection>

        <ScreenSection id="pricing" className="space-y-6" delay={140}>
          <SectionTitle
            badge="Tariflar"
            title="Aniq narx, tushunarli limit"
            subtitle="Bepul rejimdan keyin o'qituvchi Pro tarifga, o'quvchi esa Student Pro yoki test paketga o'tib mustaqil davom etishi mumkin."
          />
          <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4 items-stretch">
            {PRICING.map((plan) => (
              <article key={plan.name} className="premium-card h-full">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-xl font-extrabold">{plan.name}</h3>
                  <span className="px-2.5 py-1 rounded-lg text-[10px] uppercase tracking-[0.12em] font-bold border border-primary bg-accent">
                    {plan.tag}
                  </span>
                </div>
                <p className="text-2xl font-extrabold mt-2 text-blue-600">
                  {plan.price}
                </p>
                <div className="space-y-2 mt-4">
                  {plan.list.map((point) => (
                    <p
                      key={point}
                      className="text-sm text-secondary flex items-start gap-2"
                    >
                      <CheckCircle2
                        size={14}
                        className="mt-0.5 text-blue-600 shrink-0"
                      />
                      {point}
                    </p>
                  ))}
                </div>
              </article>
            ))}
          </div>

          <div className="grid lg:grid-cols-[1.15fr_0.85fr] gap-4 items-stretch">
            <article className="premium-card h-full">
              <p className="text-xs uppercase tracking-[0.16em] text-muted font-bold">
                Obuna jarayoni
              </p>
              <h3 className="text-2xl font-extrabold mt-2">
                4 qadamli aniq tartib
              </h3>
              <div className="grid sm:grid-cols-2 gap-3 mt-4">
                {SUBSCRIPTION_FLOW.map((step) => (
                  <div
                    key={step.title}
                    className="rounded-xl border border-primary bg-accent p-3"
                  >
                    <p className="text-sm font-bold text-primary">
                      {step.title}
                    </p>
                    <p className="text-xs text-secondary mt-1">{step.desc}</p>
                  </div>
                ))}
              </div>
            </article>

            <article className="premium-card h-full flex flex-col">
              <p className="text-xs uppercase tracking-[0.16em] text-muted font-bold">
                Qaysi tarif sizga mos?
              </p>
              <div className="space-y-2 mt-3 flex-1">
                {PLAN_GUIDE.map((item) => (
                  <p
                    key={item}
                    className="text-sm text-secondary flex items-start gap-2"
                  >
                    <CheckCircle2
                      size={14}
                      className="mt-0.5 text-blue-600 shrink-0"
                    />
                    {item}
                  </p>
                ))}
              </div>
              <div className="grid sm:grid-cols-2 gap-2 mt-4">
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => navigate("/teacher/register")}
                >
                  Bepul boshlash
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => navigate("/guide")}
                >
                  Qo'llanma ochish
                </button>
              </div>
            </article>
          </div>

          <article className="premium-card">
            <p className="text-xs uppercase tracking-[0.16em] text-muted font-bold">
              Teacher Pro funksiyalari
            </p>
            <h3 className="text-2xl font-extrabold mt-2">
              Birma-bir to'liq ro'yxat
            </h3>
            <div className="grid md:grid-cols-2 gap-2 mt-4">
              {PRO_FEATURES_FULL.map((item, index) => (
                <p
                  key={item}
                  className="text-sm text-secondary flex items-start gap-2"
                >
                  <CheckCircle2
                    size={14}
                    className="mt-0.5 text-blue-600 shrink-0"
                  />
                  {index + 1}. {item}
                </p>
              ))}
            </div>
          </article>
        </ScreenSection>

        <ScreenSection className="space-y-6" delay={160}>
          <SectionTitle
            badge="Ishonch"
            title="Foydalanuvchi fikrlari va tez-tez beriladigan savollar"
            subtitle="Platformadan foydalanish bo'yicha asosiy savollar uchun qisqa va aniq javoblar."
          />

          <div className="grid lg:grid-cols-[1fr_1fr] gap-4 items-start">
            <div className="space-y-4">
              {TESTIMONIALS.map((item) => (
                <article key={item.author} className="premium-card h-full">
                  <div className="flex items-center gap-1 text-amber-500">
                    <Star size={14} fill="currentColor" />
                    <Star size={14} fill="currentColor" />
                    <Star size={14} fill="currentColor" />
                    <Star size={14} fill="currentColor" />
                    <Star size={14} fill="currentColor" />
                  </div>
                  <p className="text-sm text-secondary mt-3">"{item.text}"</p>
                  <p className="text-xs font-bold text-primary mt-3 uppercase tracking-[0.12em]">
                    {item.author}
                  </p>
                </article>
              ))}
            </div>

            <div className="premium-card h-fit">
              <div className="space-y-2">
                {FAQS.map((item) => (
                  <details
                    key={item.q}
                    className="group rounded-xl border border-primary bg-accent px-4 py-3"
                  >
                    <summary className="cursor-pointer list-none text-sm font-bold flex items-center justify-between gap-3">
                      {item.q}
                      <span className="text-blue-600 group-open:rotate-90 transition-transform">
                        ›
                      </span>
                    </summary>
                    <p className="text-sm text-secondary mt-2">{item.a}</p>
                  </details>
                ))}
              </div>
            </div>
          </div>
        </ScreenSection>

        <ScreenSection id="contact" className="space-y-6" delay={180}>
          <SectionTitle
            badge="Bog'lanish"
            title="Hamkorlik va qo'llab-quvvatlash uchun aloqalar"
            subtitle="Loyiha bo'yicha savollar, texnik yordam va hamkorlik takliflari uchun quyidagi kanallar ochiq."
          />
          <div className="grid md:grid-cols-3 gap-4 items-stretch">
            {CONTACTS.map((item) => (
              <a
                key={item.channel}
                href={item.href}
                target={item.href.startsWith("http") ? "_blank" : undefined}
                rel={
                  item.href.startsWith("http")
                    ? "noopener noreferrer"
                    : undefined
                }
                className="premium-card h-full group"
              >
                <div className="w-11 h-11 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <item.icon size={19} />
                </div>
                <p className="text-xs uppercase tracking-[0.16em] text-muted font-bold mt-4">
                  {item.channel}
                </p>
                <p className="text-xl font-extrabold mt-1">{item.value}</p>
                <p className="text-sm text-secondary mt-2">{item.note}</p>
              </a>
            ))}
          </div>

          <div className="grid lg:grid-cols-[1fr_1fr] gap-4 items-stretch">
            <article className="premium-card h-full">
              <p className="text-xs uppercase tracking-[0.16em] text-muted font-bold">
                Aloqa tartibi
              </p>
              <h3 className="text-xl font-extrabold mt-2">
                Javob vaqti va qo'llab-quvvatlash
              </h3>
              <div className="space-y-2 mt-4">
                {CONTACT_INFO.map((item) => (
                  <p
                    key={item}
                    className="text-sm text-secondary flex items-start gap-2"
                  >
                    <CheckCircle2
                      size={14}
                      className="mt-0.5 text-blue-600 shrink-0"
                    />
                    {item}
                  </p>
                ))}
              </div>
            </article>

            <article className="premium-card h-full">
              <p className="text-xs uppercase tracking-[0.16em] text-muted font-bold">
                Platforma yo'nalishlari
              </p>
              <h3 className="text-xl font-extrabold mt-2">
                Qaysi mavzuda yozishingiz mumkin?
              </h3>
              <div className="grid sm:grid-cols-2 gap-2 mt-4">
                <div className="rounded-xl border border-primary bg-accent p-3">
                  <p className="text-sm font-bold text-primary">
                    Texnik yordam
                  </p>
                  <p className="text-xs text-secondary mt-1">
                    Kirish, test, eksport va obuna oqimi bo'yicha yordam.
                  </p>
                </div>
                <div className="rounded-xl border border-primary bg-accent p-3">
                  <p className="text-sm font-bold text-primary">Hamkorlik</p>
                  <p className="text-xs text-secondary mt-1">
                    O'quv markaz va maktablar uchun hamkorlik takliflari.
                  </p>
                </div>
                <div className="rounded-xl border border-primary bg-accent p-3">
                  <p className="text-sm font-bold text-primary">Integratsiya</p>
                  <p className="text-xs text-secondary mt-1">
                    Katta jamoalar uchun moslash va ishga tushirish rejasi.
                  </p>
                </div>
                <div className="rounded-xl border border-primary bg-accent p-3">
                  <p className="text-sm font-bold text-primary">
                    Konsultatsiya
                  </p>
                  <p className="text-xs text-secondary mt-1">
                    Qaysi tarif va qaysi oqim sizga mosligi bo'yicha maslahat.
                  </p>
                </div>
              </div>
            </article>
          </div>
        </ScreenSection>
      </main>

      <SiteFooter />
    </div>
  );
}
