import React, { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import SiteFooter from "../components/SiteFooter";
import logo from "../assets/logo.svg";
import { applySeoMeta } from "../utils/seoTools";

const LAYOUT_POINTS = [
  "Online test platforma: o'qituvchi, o'quvchi, admin uchun yagona tizim",
  "Mavzulashtirilgan test, yo'nalish test, olimpiada test oqimi",
  "Blok imtihon: 2-3+ fanli kompleks testni bitta vaqtda o'tkazish",
  "Test natijalari, analitika, obuna va to'lov nazorati bir panelda",
];

const KEYWORDS =
  "online test, test online test, mavzulashtirilgan test, yonalish test, olimpiada test, blok imtihon, abituriyent test, attestat test, online test platforma";

const SeoShell = ({ subtitle, heading, cards }) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-primary text-primary">
      <header className="sticky top-0 z-30 border-b border-primary bg-secondary/90 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between gap-3">
          <Link to="/" className="flex items-center gap-2.5">
            <img src={logo} alt="OsonTestOl" className="w-8 h-8 rounded-lg" />
            <div>
              <p className="text-[10px] uppercase tracking-[0.18em] text-muted font-bold">testonlinee.uz</p>
              <p className="text-base font-extrabold">OsonTestOl</p>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <button type="button" className="btn-secondary" onClick={() => navigate("/guide")}>Qo'llanma</button>
            <button type="button" className="btn-primary" onClick={() => navigate("/teacher/register")}>Boshlash</button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 md:px-6 py-10 md:py-14 space-y-7">
        <section className="premium-card">
          <p className="text-xs uppercase tracking-[0.18em] text-muted font-bold">SEO landing</p>
          <h1 className="text-3xl md:text-5xl font-extrabold mt-2 leading-tight">{heading}</h1>
          <p className="text-secondary mt-4 text-base md:text-lg">{subtitle}</p>

          <div className="grid md:grid-cols-2 gap-2 mt-5">
            {LAYOUT_POINTS.map((item) => (
              <p key={item} className="text-sm text-secondary flex items-start gap-2">
                <CheckCircle2 size={15} className="text-blue-600 mt-0.5 shrink-0" />
                {item}
              </p>
            ))}
          </div>
        </section>

        <section className="grid md:grid-cols-3 gap-4">
          {cards.map((card) => (
            <article key={card.title} className="premium-card">
              <h2 className="text-xl font-extrabold">{card.title}</h2>
              <p className="text-sm text-secondary mt-2">{card.desc}</p>
            </article>
          ))}
        </section>

        <section className="premium-card">
          <h2 className="text-2xl font-extrabold">Nega OsonTestOl?</h2>
          <p className="text-sm text-secondary mt-2">
            Testonlinee.uz platformasi online test, mavzulashtirilgan test, yo'nalish test va olimpiada testlar uchun
            professional boshqaruv oqimini beradi. Tariflar aniq, limitlar tushunarli, Pro rejimda barcha bo'limlar ochiq.
          </p>
          <div className="flex flex-wrap gap-2 mt-4">
            <button type="button" className="btn-primary" onClick={() => navigate("/teacher/register")}>
              O'qituvchi sifatida boshlash <ArrowRight size={14} />
            </button>
            <button type="button" className="btn-secondary" onClick={() => navigate("/student/login")}>
              O'quvchi kirishi
            </button>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
};

export function OnlineTestSeoPage() {
  useEffect(() => {
    applySeoMeta({
      title: "Online test platforma | OsonTestOl | testonlinee.uz",
      description:
        "Online test platforma: test online test, mavzulashtirilgan test, yo'nalish test va blok imtihonlar uchun OsonTestOl yechimi.",
      keywords: KEYWORDS,
      canonicalPath: "/online-test-platforma",
    });
  }, []);

  return (
    <SeoShell
      heading="Online test platforma: tez, tartibli va nazoratli"
      subtitle="O'qituvchi test yaratadi, o'quvchi yechadi, admin monitoring qiladi. Jarayonlar alohida bo'limlarda, bitta tizimda ishlaydi."
      cards={[
        {
          title: "Mavzulashtirilgan test",
          desc: "Fan va mavzu kesimida test bazasini qurish, yo'nalishlar bo'yicha saralash va biriktirish mumkin.",
        },
        {
          title: "Yo'nalish test",
          desc: "Abituriyentlar uchun yo'nalish testlar, turli fanlardan kompleks to'plamlar va vaqtli nazorat ishlaydi.",
        },
        {
          title: "Test analitikasi",
          desc: "Natijalar bo'limida individual tahlil, xatolarni ko'rish va eksport orqali qaror qabul qilish tezlashadi.",
        },
      ]}
    />
  );
}

export function OlympiadSeoPage() {
  useEffect(() => {
    applySeoMeta({
      title: "Olimpiada test va blok imtihon | OsonTestOl",
      description:
        "Olimpiada test, attestat test va blok imtihonlar uchun online platforma. 2-3+ fanli kompleks testlarni umumiy vaqt bilan o'tkazing.",
      keywords: `${KEYWORDS}, olimpiada test, attestat test, blok imtihon`,
      canonicalPath: "/olimpiada-testlar",
    });
  }, []);

  return (
    <SeoShell
      heading="Olimpiada test, attestat test va blok imtihonlar"
      subtitle="Bir nechta fandan kompleks testni umumiy vaqt bilan yuklash va o'tkazish imkoniyati Pro tarifda alohida ochiladi."
      cards={[
        {
          title: "Blok imtihon",
          desc: "2 ta, 3 ta yoki undan ko'p fan bloklarini bitta testga jamlab umumiy vaqt bilan o'tkazish mumkin.",
        },
        {
          title: "Abituriyent oqimi",
          desc: "Katta oqimdagi abituriyentlarga yo'nalish testlarini markazlashgan boshqaruv bilan berish qulay.",
        },
        {
          title: "Pro nazorat",
          desc: "Guruh, chat, natija, eksport, analitika va obuna monitoringi bir panelda professional tartibda yuradi.",
        },
      ]}
    />
  );
}
