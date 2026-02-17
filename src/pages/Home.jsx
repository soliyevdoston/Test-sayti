import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Rocket,
  ShieldCheck,
  BarChart3,
  FileText,
  Users,
  ArrowRight,
  Play,
  Globe,
  Instagram,
  Send,
  Check,
  Star,
  Plus,
  Minus,
  HelpCircle,
  ExternalLink,
  ChevronDown,
  Layout,
  Zap,
  Award,
  Shield,
  School,
  GraduationCap,
  BookOpen,
  UserCheck,
  Search,
  Languages,
  Key
} from "lucide-react";
import logo from "../assets/logo.svg";

const StatCard = ({ label, value, icon: Icon }) => (
  <div className="premium-card flex flex-col items-center justify-center text-center group">
    <div className="p-4 bg-indigo-500/10 rounded-2xl mb-5 text-indigo-500 group-hover:scale-110 group-hover:rotate-12 transition-all duration-500">
      <Icon size={32} />
    </div>
    <div className="text-3xl font-black text-primary mb-1">{value}</div>
    <div className="text-[10px] font-black uppercase tracking-widest text-muted">{label}</div>
  </div>
);

const OrbitBadge = ({ icon: Icon, label, className, color, delay }) => (
  <div className={`absolute z-20 flex flex-col items-center gap-2 animate-float ${className}`} style={{ animationDelay: delay }}>
    <div className="p-5 glass rounded-3xl shadow-2xl border border-primary/20 bg-white/80 dark:bg-primary/80 backdrop-blur-xl group hover:scale-110 transition-transform cursor-pointer">
      <div className={`p-3 rounded-2xl bg-primary shadow-inner ${color}`}>
        <Icon size={24} strokeWidth={3} />
      </div>
    </div>
    <span className="px-4 py-1.5 glass rounded-full text-[10px] font-black uppercase tracking-widest text-primary shadow-sm border border-primary/10">
      {label}
    </span>
  </div>
);

const PartnershipLogo = ({ name, color = "text-primary" }) => (
  <div className="flex items-center gap-4 group cursor-pointer">
    <div className={`w-12 h-12 rounded-xl border border-primary/20 flex items-center justify-center p-2 bg-white/5 shadow-premium group-hover:border-indigo-500/50 transition-colors`}>
      <img src={logo} alt={`${name} logo`} className="w-full h-full object-contain opacity-50 group-hover:opacity-100 transition-opacity" />
    </div>
    <span className={`text-[10px] font-black uppercase tracking-tighter max-w-[120px] leading-tight group-hover:text-blue-500 transition-colors ${color}`}>{name}</span>
  </div>
);

const PricingCard = ({ title, price, features, recommended, path, navigate }) => (
  <div className={`premium-card flex flex-col h-full group ${recommended ? 'ring-4 ring-indigo-500/10 border-indigo-500/50 scale-[1.02]' : ''}`}>
    {recommended && (
      <div className="absolute top-6 right-6 bg-indigo-500 text-white text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-lg shadow-indigo-500/30">
        Tavsiya
      </div>
    )}
    <h3 className="text-2xl font-black text-primary mb-2 uppercase tracking-tighter italic">{title}</h3>
    <div className="flex items-baseline gap-1 mb-8">
      <span className="text-5xl font-black text-primary tracking-tighter">{price}</span>
      <span className="text-muted font-bold text-xs">/oyiga</span>
    </div>
    <ul className="space-y-4 mb-10 flex-grow">
      {features.map((f, i) => (
        <li key={i} className="flex items-center gap-3 text-sm font-bold text-muted group-hover:text-primary transition-colors">
          <div className="p-1 rounded-lg bg-indigo-500/10 text-indigo-500"><Check size={14} /></div>
          {f}
        </li>
      ))}
    </ul>
    <button
      onClick={() => navigate(path)}
      className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-xl ${recommended ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-indigo-600/30' : 'bg-primary border border-primary text-primary hover:bg-secondary'}`}
    >
      Boshlash
    </button>
  </div>
);

const FAQItem = ({ index, q, a }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className={`border rounded-[1.5rem] bg-white/50 dark:bg-primary/20 backdrop-blur-xl overflow-hidden mb-4 transition-all duration-500 ${isOpen ? 'border-indigo-500 shadow-lg shadow-indigo-500/10' : 'border-primary'}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-6 text-left hover:bg-indigo-500/5 transition-colors"
      >
        <span className="text-sm md:text-base font-black text-primary uppercase tracking-tight">
          <span className="text-indigo-500">{index}-Savol:</span> {q}
        </span>
        <div className={`p-1.5 rounded-lg border border-primary transition-all duration-500 ${isOpen ? 'bg-indigo-500 border-indigo-500 rotate-180' : ''}`}>
          {isOpen ? <Minus size={18} className="text-white" /> : <Plus size={18} className="text-indigo-500" />}
        </div>
      </button>
      <div className={`transition-all duration-500 ease-in-out ${isOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'} overflow-hidden`}>
        <div className="p-6 pt-0 text-sm md:text-base text-secondary leading-relaxed border-t border-indigo-500/10 mt-2">
          <span className="font-black text-primary">Javob:</span> {a}
        </div>
      </div>
    </div>
  );
};

const FeatureCard = ({ title, desc, icon: Icon, className = "" }) => (
  <div className={`premium-card group ${className}`}>
    <div className="w-14 h-14 flex items-center justify-center bg-gradient-to-br from-indigo-500 to-blue-600 rounded-2xl mb-8 text-white shadow-lg shadow-indigo-500/20 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
      <Icon size={28} />
    </div>
    <h3 className="text-2xl font-black text-primary mb-4 tracking-tighter uppercase italic">{title}</h3>
    <p className="text-muted font-medium leading-relaxed opacity-80">{desc}</p>
  </div>
);

const StepCard = ({ number, title, desc }) => (
  <div className="premium-card group">
    <div className="text-5xl font-black text-indigo-500/10 group-hover:text-indigo-500/20 transition-colors mb-4">{number}</div>
    <h4 className="text-xl font-black text-primary mb-3 uppercase tracking-tighter italic">{title}</h4>
    <p className="text-muted font-medium opacity-80">{desc}</p>
  </div>
);

const FeatureHighlight = ({ title, desc, features, image, reversed, badge }) => (
  <div className={`flex flex-col lg:flex-row items-center gap-16 py-24 relative ${reversed ? 'lg:flex-row-reverse' : ''}`}>
    {/* Illustration Side */}
    <div className="w-full lg:w-1/2 relative group">
      <div className="absolute inset-0 bg-indigo-500/10 rounded-[3rem] blur-3xl group-hover:bg-indigo-500/20 transition-all duration-700" />
      <div className="relative p-2 glass rounded-[3rem] shadow-2xl overflow-hidden aspect-[4/3] border border-primary/20">
        <img 
          src={image} 
          alt={`osontestol.uz - ${title}`} 
          loading="lazy"
          className="w-full h-full object-cover rounded-[2.5rem] group-hover:scale-105 transition-transform duration-1000" 
        />
        {badge && (
          <div className="absolute top-6 right-6 p-4 glass rounded-2xl shadow-xl animate-bounce">
            {badge}
          </div>
        )}
      </div>
    </div>

    {/* Content Side */}
    <div className="w-full lg:w-1/2 space-y-8">
      <h2 className="text-4xl md:text-5xl font-black text-primary tracking-tighter leading-tight uppercase italic">
        {title}
      </h2>
      <p className="text-secondary font-medium leading-relaxed max-w-xl">
        {desc}
      </p>
      <div className="space-y-4">
        {features.map((f, i) => (
          <div key={i} className="flex items-start gap-4 group/item">
            <div className="mt-1 w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30 group-hover/item:scale-110 transition-transform">
              <Check size={14} strokeWidth={3} />
            </div>
            <div>
              <p className="text-sm md:text-base font-black text-primary transition-colors group-hover/item:text-indigo-600">
                {f.split(' - ')[0]} - <span className="text-secondary font-medium">{f.split(' - ')[1]}</span>
              </p>
            </div>
          </div>
        ))}
      </div>
      <button
        onClick={() => document.getElementById("roles")?.scrollIntoView({ behavior: "smooth" })}
        className="px-10 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-600/30 transition-all transform hover:scale-105 active:scale-95"
      >
        Ishlatib ko'rish
      </button>
    </div>

    {/* Vertical Timeline Connection Pin */}
    <div className="absolute left-1/2 top-0 bottom-0 w-px bg-dashed bg-gradient-to-b from-transparent via-indigo-500/30 to-transparent hidden lg:block" />
    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-indigo-600 rounded-full border-4 border-primary shadow-lg shadow-indigo-600/50 hidden lg:block" />
  </div>
);

const GuideStep = ({ number, title, desc, icon: Icon }) => (
  <div className="flex gap-6 group/step">
    <div className="flex flex-col items-center">
      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 group-hover/step:scale-110 transition-transform relative z-10">
        <Icon size={24} />
      </div>
      <div className="w-px h-full bg-indigo-500/20 my-2 group-last/step:hidden"></div>
    </div>
    <div className="pb-10 group-last/step:pb-0">
      <h4 className="text-xl font-black text-primary uppercase tracking-tighter italic mb-2">{number}. {title}</h4>
      <p className="text-sm text-secondary font-medium leading-relaxed max-w-md">{desc}</p>
    </div>
  </div>
);

const GuideSection = () => {
  const [activeTab, setActiveTab] = useState("teacher");

  return (
    <section id="guide" className="py-32 px-6 bg-secondary/10">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-20 space-y-4">
          <h2 className="text-4xl md:text-6xl font-black text-primary tracking-tighter uppercase italic">
            Platformadan <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-blue-600 underline decoration-indigo-500/30 decoration-8 underline-offset-8">foydalanish</span>
          </h2>
          <p className="text-muted font-bold uppercase tracking-widest text-xs">Eng oddiy va mayda qadamlar bilan tanishasiz</p>
        </div>

        <div className="flex justify-center mb-16">
          <div className="inline-flex p-1.5 bg-primary/20 backdrop-blur-xl rounded-[2rem] border border-primary/20">
            <button
              onClick={() => setActiveTab("teacher")}
              className={`px-10 py-4 rounded-[1.8rem] font-black text-xs uppercase tracking-widest transition-all ${activeTab === 'teacher' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/30' : 'text-secondary hover:text-primary'}`}
            >
              O'qituvchi uchun
            </button>
            <button
              onClick={() => setActiveTab("student")}
              className={`px-10 py-4 rounded-[1.8rem] font-black text-xs uppercase tracking-widest transition-all ${activeTab === 'student' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/30' : 'text-secondary hover:text-primary'}`}
            >
              O'quvchi uchun
            </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-2 animate-in fade-in slide-in-from-left duration-700">
            {activeTab === "teacher" ? (
              <div className="space-y-2">
                <GuideStep 
                  number="01" 
                  title="Kirish" 
                  desc="Tizimga o'qituvchi sifatida kiring. Agar akkountingiz bo'lmasa, Adminstrator sizga login va parolni taqdim etadi." 
                  icon={Shield} 
                />
                <GuideStep 
                  number="02" 
                  title="Fan yaratish" 
                  desc="Asosiy panelda 'Fanlar' bo'limiga o'ting va 'Yangi fan' tugmasini bosing. Fan nomini kiriting." 
                  icon={Plus} 
                />
                <GuideStep 
                  number="03" 
                  title="Test yuklash" 
                  desc="Word (.docx) faylidagi testlaringizni tizimga yuklang. Savollar avtomatik tarzda tahlil qilinadi va bazaga saqlanadi." 
                  icon={ArrowRight} 
                />
                <GuideStep 
                  number="04" 
                  title="Testni boshlash" 
                  desc="Testni ikki xil usulda o'tkazishingiz mumkin: 1) Ommaviy xona kodi (ID) orqali hamma uchun; 2) Faqat ma'lum bir guruhga biriktirib, faqat shu o'quvchilardan test olish." 
                  icon={Rocket} 
                />
                <GuideStep 
                  number="05" 
                  title="Tahlil va Natija" 
                  desc="O'quvchilar testni yechishni boshlashi bilan natijalarni real vaqt rejimida kuzatib boring. Shaxsiy kabinet orqali kirgan o'quvchilarning natijalari ularning profilida saqlanadi." 
                  icon={BarChart3} 
                />
              </div>
            ) : (
              <div className="space-y-2">
                <GuideStep 
                  number="01" 
                  title="Login" 
                  desc="O'qituvchingiz bergan login va parol orqali o'quvchi kabinetiga kiring." 
                  icon={Users} 
                />
                <GuideStep 
                  number="02" 
                  title="Testga kirish" 
                  desc="O'qituvchi bergan xona kodi (ID) orqali kiring YOKI agar guruhga biriktirilgan bo'lsangiz, shaxsiy kabinetingizdagi 'Mening testlarim' bo'limidan kirishingiz mumkin." 
                  icon={Key} 
                />
                <GuideStep 
                  number="03" 
                  title="Testni yechish" 
                  desc="Test savollarini diqqat bilan o'qib chiqing va to'g'ri javoblarni belgilang." 
                  icon={FileText} 
                />
                <GuideStep 
                  number="04" 
                  title="Yakunlash" 
                  desc="Barcha savollarga javob bergach, 'Testni yakunlash' tugmasini bosing." 
                  icon={Check} 
                />
                <GuideStep 
                  number="05" 
                  title="Natija" 
                  desc="Sizga darhol necha ball to'plaganingiz va qaysi savollarda xato qilganingiz ko'rsatiladi." 
                  icon={Award} 
                />
              </div>
            )}
          </div>

          <div className="relative group">
             <div className="absolute inset-0 bg-indigo-500/10 rounded-[3rem] blur-3xl" />
             <div className="relative p-2 glass rounded-[3rem] shadow-2xl overflow-hidden border border-primary/20 aspect-video flex items-center justify-center bg-primary/40">
                <div className="text-center space-y-6">
                  <div className="w-20 h-20 rounded-full bg-indigo-600/20 flex items-center justify-center mx-auto text-indigo-500 animate-pulse">
                    <Play size={40} fill="currentColor" />
                  </div>
                  <p className="text-sm font-black uppercase tracking-widest text-primary italic">Video qo'llanma tez orada...</p>
                </div>
             </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default function Home() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const roles = [
    { title: "ADMIN", desc: "Tizimni nazorat qilish va boshqarish", path: "/admin/login", color: "from-indigo-500 to-blue-600" },
    { title: "O'QITUVCHI", desc: "Testlar yaratish va natijalarni tahlil qilish", path: "/teacher/login", color: "from-blue-600 to-indigo-700" },
    { title: "O'QUVCHI", desc: "Bilimlarni sinab ko'rish va rivojlantirish", path: "/student/login", color: "from-indigo-400 to-blue-500" },
  ];

  return (
    <div className="min-h-screen bg-primary text-primary selection:bg-indigo-500/30">
      {/* Navigation */}
      <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-700 ${scrolled ? "glass border-b border-primary py-3" : "py-6"}`}>
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          <div className="flex items-center gap-3 group cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="relative">
              <div className="absolute inset-0 bg-indigo-500 blur-lg opacity-0 group-hover:opacity-40 transition-opacity" />
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-indigo-500/20 group-hover:rotate-12 transition-transform duration-500 relative">
                T
              </div>
            </div>
            <span className="text-2xl font-black tracking-tighter uppercase text-primary">osontestol<span className="text-indigo-600">.uz</span></span>
          </div>
          <div className="hidden md:flex gap-10 text-xs font-bold text-primary italic">
            <a href="#features" className="hover:text-indigo-600 transition-colors uppercase tracking-widest">Imkoniyatlar</a>
            <a href="#how-it-works" className="hover:text-indigo-600 transition-colors uppercase tracking-widest">Qanday ishlaydi?</a>
            <a href="#guide" className="hover:text-indigo-600 transition-colors uppercase tracking-widest">Qo'llanma</a>
            <a href="#pricing" className="hover:text-indigo-600 transition-colors uppercase tracking-widest">Tariflar</a>
            <a href="#faq" className="hover:text-indigo-600 transition-colors uppercase tracking-widest">Savollar</a>
            <a href="#roles" className="hover:text-indigo-600 transition-colors uppercase tracking-widest text-indigo-500 font-black">Kirish</a>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 glass rounded-xl cursor-not-allowed">
              <Languages size={14} className="text-indigo-500" />
              <span className="text-[10px] font-black uppercase text-secondary">O'zbek</span>
              <ChevronDown size={12} className="text-secondary" />
            </div>
            <button 
              onClick={() => document.getElementById('roles')?.scrollIntoView({ behavior: 'smooth' })}
              className="px-6 py-2.5 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20"
            >
              Tizimga kirish
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-48 pb-24 overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-indigo-500/5 dark:bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left: Text Content */}
          <div className="text-left space-y-10">
            <h1 className="text-5xl md:text-7xl font-black tracking-tight text-primary leading-[1.1]">
              Bilimlarni <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-blue-600 underline decoration-indigo-500/30 decoration-8 underline-offset-10">osontestol.uz</span> bilan loyihalang va baholang
            </h1>
            <p className="max-w-xl text-lg text-secondary font-medium leading-relaxed">
              Professional test platformasi: o'qituvchilar uchun qulay boshqaruv, o'quvchilar uchun shaffof va tezkor natijalar.
            </p>
            <div className="flex flex-wrap items-center gap-6">
              <button
                onClick={() => document.getElementById('roles')?.scrollIntoView({ behavior: 'smooth' })}
                className="px-10 py-5 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-[2rem] text-sm uppercase tracking-widest shadow-xl shadow-indigo-600/30 transition-all active:scale-95"
              >
                Tizimga kirish
              </button>
            </div>
          </div>

          {/* Right: Original Composition (Replaced Orbit Illustration) */}
          <div className="relative flex items-center justify-center min-h-[500px]">
            <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/10 to-blue-500/10 blur-[100px] rounded-full animate-pulse" />
            
            {/* abstract composition instead of direct orbit copy */}
            <div className="relative z-10 w-full max-w-lg aspect-square">
               <div className="absolute top-0 right-0 w-64 h-64 bg-white/40 dark:bg-white/5 backdrop-blur-3xl rounded-[3rem] border border-white/20 shadow-2xl rotate-12 transition-transform hover:rotate-6 duration-700 p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-indigo-600 rounded-xl text-white shadow-lg"><BarChart3 size={24} /></div>
                    <div className="h-3 w-32 bg-indigo-600/20 rounded-full" />
                  </div>
                  <div className="space-y-4">
                    <div className="h-2 w-full bg-primary/20 rounded-full" />
                    <div className="h-2 w-3/4 bg-primary/20 rounded-full" />
                    <div className="h-2 w-1/2 bg-primary/20 rounded-full" />
                  </div>
               </div>
               
               <div className="absolute bottom-0 left-0 w-72 h-48 bg-white/40 dark:bg-white/5 backdrop-blur-3xl rounded-[3rem] border border-white/20 shadow-2xl -rotate-6 transition-transform hover:rotate-0 duration-700 p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-blue-600 rounded-xl text-white shadow-lg"><Users size={24} /></div>
                    <div className="h-4 w-24 bg-blue-600/10 rounded-full flex items-center justify-center"><span className="text-[10px] font-black text-blue-600">+12k Users</span></div>
                  </div>
                  <div className="flex -space-x-3">
                    {[1,2,3,4].map(i => <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-secondary/50" />)}
                  </div>
               </div>

               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 p-6 glass rounded-[3rem] shadow-2xl border border-indigo-500/30 flex items-center justify-center animate-float">
                  <div className="text-center">
                    <div className="text-4xl font-black text-indigo-600 mb-2">99%</div>
                    <div className="text-[10px] font-black uppercase text-muted tracking-widest text-secondary">Ishonchli</div>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Feature Highlights */}
      <section className="py-24 px-6 relative overflow-hidden bg-primary/30">
        <div className="max-w-7xl mx-auto relative px-4 sm:px-6 lg:px-8">
          <FeatureHighlight
            title="Masofaviy Bilim Baholash EkOTizimi"
            desc="Ta'lim jarayonini chegaralardan ozod qiling. Dunyoning istalgan nuqtasidan, har qanday zamonaviy qurilma yordamida akademik nazoratni yuqori darajada amalga oshiring."
            features={[
              "Universal Erkinlik - Brauzerga ega istalgan smartfon yoki kompyuterda uzilishlarsiz ishlash.",
              "Sinxron Nazorat - Test topshirish jarayonini real vaqt rejimida monitor qilish va boshqarish imkoniyati.",
              "Instant-Validatsiya - Yakuniy natijalarni o'quvchi tomonidan yakunlash tugmasi bosilgan soniyadayoq taqdim etish."
            ]}
            image="https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&q=80&w=2070"
            badge={<ShieldCheck size={32} className="text-indigo-500" />}
          />

          <FeatureHighlight
            title="Intellektual Talabalar Boshqaruvi"
            desc="Qog'ozbozlik va tartibsiz jadvallar davri o'tdi. O'z o'quv markazingiz yoki maktabingizni raqamli boshqaruv platformasi orqali tizimlashtiring va jarayonlarni avtomatlashtiring."
            features={[
              "Yagona Raqamli Arxiv - Barcha talabalar kontaktlari va o'zlashtirish tarixi yaxlit xavfsiz tizimda.",
              "Dinamik Segmentatsiya - Fanlar, o'qituvchilar va qabul vaqtlariga ko'ra oson guruhlash va saralash.",
              "Shaxsiy Progress-Kartochka - Har bir foydalanuvchi uchun alohida dinamik statistik sahifa va monitoring."
            ]}
            image="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=2071"
            reversed
            badge={<Users size={32} className="text-blue-500" />}
          />

          <FeatureHighlight
            title="Vizual Ma'lumotlar va Strategik Analitika"
            desc="Oddiy natijalarni chuqur tushunchalarga (insights) aylantiring. O'quvchining potensialini aniqlash uchun murakkab algoritmlar va ma'lumotlar tahlilidan foydalaning."
            features={[
              "Mavzuli Diagnostika - Qaysi mavzu yoki paragrafda oqsoqlik borligini ko'rsatuvchi vizual 'Heatmap' tahlillari.",
              "Akademik Progressiya - Vaqt o'tishi bilan bilim darajasining ko'tarilish yoki pasayish dinamikasini kuzatish.",
              "Eksport-Tayyor Hisobotlar - Ota-onalar va rahbariyat uchun bir marta bosishda tayyor bo'ladigan professional PDF hujjatlar."
            ]}
            image="https://images.unsplash.com/photo-1551288049-bbdac8a28a1e?auto=format&fit=crop&q=80&w=2070"
            badge={<BarChart3 size={32} className="text-green-500" />}
          />

          <FeatureHighlight
            title="Sun'iy Intellekt va Optik Tanib Olish (OCR)"
            desc="Tekshirish jarayonidagi inson omili va xatolarini nolga tushiring. Kamerangiz yordamida javoblar varaqasini skanerlang va natijani 'Aqlli' tizimga bir zumda topshiring."
            features={[
              "Milli-Sekundlar Tezligi - Bir necha o'nlab varaqalarni bir daqiqadan kamroq vaqt ichida tahlil qilish va baholash.",
              "Nol Xatolik Korreksiyasi - Inson ko'zi ilg'amas belgilarni ham aniqlovchi neyron tarmoqlar algoritmi.",
              "Avto-Sinxronizatsiya - Skanerlangan ma'lumotlarni to'g'ridan-to'g'ri umumiy reyting jadvali va profilga kiritish."
            ]}
            image="https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&q=80&w=2070"
            reversed
            badge={<Zap size={32} className="text-yellow-500" />}
          />
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-20 border-y border-primary/10 bg-secondary/10">
        <div className="max-w-7xl mx-auto px-6 overflow-hidden relative">
          <div className="flex items-center justify-center gap-16 opacity-40 grayscale hover:grayscale-0 transition-all duration-1000">
            <span className="text-2xl font-black uppercase tracking-tighter whitespace-nowrap italic text-secondary">osontestol.uz</span>
            <span className="text-2xl font-black uppercase tracking-tighter whitespace-nowrap italic text-secondary">Elite Education</span>
            <span className="text-2xl font-black uppercase tracking-tighter whitespace-nowrap italic text-secondary">Pro Academy</span>
            <span className="text-2xl font-black uppercase tracking-tighter whitespace-nowrap italic text-secondary">Digital School</span>
            <span className="text-2xl font-black uppercase tracking-tighter whitespace-nowrap italic text-secondary">Global Learning</span>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 relative z-10 grid grid-cols-2 md:grid-cols-4 gap-6">
          <StatCard label="Faol Testlar" value="500+" icon={FileText} />
          <StatCard label="O'quvchilar" value="12k+" icon={Users} />
          <StatCard label="Tahlillar" value="25k+" icon={BarChart3} />
          <StatCard label="Aniqlik" value="99.9%" icon={ShieldCheck} />
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-32 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-20 text-center space-y-4">
            <h2 className="text-4xl md:text-6xl font-black text-primary tracking-tighter uppercase italic">
              Bu qanday <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-blue-600 underline decoration-indigo-500/30 decoration-8 underline-offset-8">ishlaydi?</span>
            </h2>
            <p className="text-secondary font-medium italic">
              Ushbu videoda tizim qanday ishlashi tushuntirilgan, <span className="text-indigo-600 font-bold">ko'rishni tavsiya qilamiz.</span>
            </p>
          </div>

          <div className="relative group max-w-5xl mx-auto">
            <div className="absolute inset-0 bg-indigo-600/10 rounded-[3rem] blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            
            {/* Dark Video Grid Container */}
            <div className="relative p-8 bg-[#0F0F0F] rounded-[3rem] shadow-2xl border border-white/5 overflow-hidden">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { title: "Tayyorlash", img: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=400" },
                  { title: "Kirish", img: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=400" },
                  { title: "Test Topshirish", img: "https://images.unsplash.com/photo-1551288049-bbdac8a28a1e?auto=format&fit=crop&q=80&w=400" },
                  { title: "Nazorat", img: "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&q=80&w=400" },
                  { title: "Statistika", img: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=400" },
                  { title: "Mobil Ilova", img: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&q=80&w=400" },
                  { title: "Baholash", img: "https://images.unsplash.com/photo-1454165833772-d996d49510d1?auto=format&fit=crop&q=80&w=400" },
                  { title: "Yordam", img: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&q=80&w=400" }
                ].map((vid, idx) => (
                  <div key={idx} className="relative aspect-video rounded-xl overflow-hidden group/vid cursor-pointer border border-white/10 hover:border-indigo-500/50 transition-all">
                    <img src={vid.img} alt={vid.title} className="w-full h-full object-cover opacity-60 group-hover/vid:scale-110 group-hover/vid:opacity-100 transition-all duration-700" />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/vid:opacity-100 transition-opacity">
                      <div className="p-3 bg-white/20 backdrop-blur-md rounded-full text-white">
                        <Play size={16} fill="white" />
                      </div>
                    </div>
                    <div className="absolute bottom-2 left-2 right-2">
                       <p className="text-[8px] font-black uppercase text-white truncate drop-shadow-lg">{vid.title}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Central Large Play Overlay (Hover state) */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none group-hover:opacity-100 opacity-0 transition-opacity duration-500">
                 <div className="w-24 h-24 glass rounded-full flex items-center justify-center border border-white/20 shadow-2xl bg-white/10">
                    <Play size={32} className="text-white fill-white ml-1" />
                 </div>
              </div>
            </div>
          </div>

          {/* Sequential Steps */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20">
            <div className="p-8 glass rounded-[2rem] border border-primary/20 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-black text-xl">1</div>
              <h4 className="text-lg font-black text-primary uppercase italic">Tayyorlash</h4>
              <p className="text-sm text-secondary font-medium">Word faylingizni odatdagidek tayyorlang va tizimga yuklang.</p>
            </div>
            <div className="p-8 glass rounded-[2rem] border border-primary/20 space-y-4">
               <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-black text-xl">2</div>
               <h4 className="text-lg font-black text-primary uppercase italic">O'tkazish</h4>
               <p className="text-sm text-secondary font-medium">O'quvchilarga kodni ulashing va ular xohlagan qurilmadan kirsinlar.</p>
            </div>
            <div className="p-8 glass rounded-[2rem] border border-primary/20 space-y-4">
               <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-black text-xl">3</div>
               <h4 className="text-lg font-black text-primary uppercase italic">Tahlil</h4>
               <p className="text-sm text-secondary font-medium">Natijalarni soniyalar ichida ko'ring va xatolar hisobotini oling.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-20">
            <h2 className="text-4xl md:text-6xl font-black mb-6 text-primary tracking-tighter uppercase italic">
              Nima uchun <br /> <span className="text-indigo-500">bizni tanlashadi?</span>
            </h2>
            <p className="text-muted font-bold uppercase tracking-widest text-xs">Kelajak ta'limi texnologiyalari bilan</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FeatureCard
              icon={Rocket}
              title="Tezkor Import"
              desc="Word (.docx) fayllaringizni bir necha soniya ichida to'liq test tizimiga aylantiring. Hech qanday murakkab formalar kerak emas."
              className="md:col-span-2"
            />
            <FeatureCard
              icon={BarChart3}
              title="Chuqur Tahlil"
              desc="O'quvchilarning xatolari ustida ishlash uchun batafsil tahlillar."
            />
            <FeatureCard
              icon={ShieldCheck}
              title="Xavfsiz Tizim"
              desc="Suhbatlar va testlar shifrlangan holatda saqlanadi. Anti-cheat tizimi orqali adolatli natijalarni ta'minlaymiz."
            />
            <FeatureCard
              icon={Zap}
              title="AI Integration"
              desc="Sun'iy intellekt orqali test savollarini avtomatik yaratish va tahlil qilish imkoniyati."
              className="md:col-span-2"
            />
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-32 bg-secondary/20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-20 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-black mb-8 text-primary leading-tight">Biz haqimizda <br /> nima deyishadi?</h2>
              <div className="flex gap-1 mb-8">
                {[1,2,3,4,5].map(i => <Star key={i} size={20} className="fill-indigo-500 text-indigo-500" />)}
              </div>
              <p className="text-xl text-secondary leading-relaxed italic">
                "TestOnlinee bizning maktabimizda test o'tkazish madaniyatini butunlay o'zgartirdi. O'qituvchilar endi test tayyorlashga soatlab vaqt sarflashmaydi."
              </p>
              <div className="mt-8 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-indigo-500/20 border border-indigo-500/20" />
                <div>
                  <h4 className="font-black text-primary uppercase text-sm">Aziza Rahimova</h4>
                  <p className="text-xs text-muted uppercase tracking-widest">Matematika o'qituvchisi</p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="p-6 bg-secondary/50 border border-primary rounded-3xl h-48 flex items-center justify-center text-center">
                  <p className="text-sm font-bold opacity-40 uppercase tracking-widest italic">Excellent Solution</p>
                </div>
                  <div className="p-6 bg-indigo-600 text-white rounded-3xl h-64 flex flex-col justify-end">
                  <Award size={32} className="mb-4" />
                  <p className="font-bold text-lg">Yilning eng yaxshi ta'lim startapi</p>
                  <p className="text-xs opacity-70">EduAwards 2024</p>
                </div>
              </div>
              <div className="space-y-4 pt-12">
                <div className="p-6 bg-secondary border border-primary rounded-3xl h-64 flex flex-col justify-between">
                   <div className="flex gap-1">
                    {[1,2,3,4,5].map(i => <Star key={i} size={12} className="fill-indigo-500 text-indigo-500" />)}
                  </div>
                  <p className="text-sm font-medium">"O'quvchilarim natijalarni darhol ko'rishayotganidan xursand."</p>
                  <p className="text-xs font-black uppercase text-muted">A. Karimov</p>
                </div>
                <div className="p-6 bg-secondary/50 border border-primary rounded-3xl h-48 flex items-center justify-center">
                   <p className="text-sm font-bold opacity-40 uppercase tracking-widest italic">Premium Support</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <GuideSection />

      {/* Pricing Section */}
      <section id="pricing" className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-20 text-center">
            <h2 className="text-4xl md:text-6xl font-black mb-6 text-primary tracking-tighter uppercase italic">
              Platforma <span className="text-indigo-500">rejalari</span>
            </h2>
            <p className="text-muted font-bold uppercase tracking-widest text-xs">Ehtiyojingizga qarab o'zingizga mos rejaning tanlang</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <PricingCard
              title="Individual"
              price="0"
              features={["Cheksiz test topshirish", "Shaxsiy profil", "Natijalar tarixi", "Mobil ilova"]}
              path="/student/login"
              navigate={navigate}
            />
            <PricingCard
              title="O'qituvchi"
              price="0"
              recommended
              features={["Word & Manual import", "Guruhlar va Shaxsiy kabinetlar", "Shaxsiy Chat tizimi", "Chuqur statistika", "PDF eksport"]}
              path="/teacher/login"
              navigate={navigate}
            />
            <PricingCard
              title="Maktab"
              price="499k"
              features={["Cheksiz o'qituvchilar", "Butun maktab boshqaruvi", "Ota-onalar paneli (Tez orada)", "24/7 Premium yordam", "Maxsus subdomen (Tez orada)"]}
              path="/admin/login"
              navigate={navigate}
            />
          </div>
        </div>
      </section>

      <section id="faq" className="py-32 px-6 max-w-4xl mx-auto">
        <div className="text-center mb-20">
          <h2 className="text-4xl font-black mb-6 text-primary tracking-tighter uppercase italic">Tez-tez beriladigan <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-blue-600 underline decoration-indigo-500/30 decoration-8 underline-offset-8">savollar</span></h2>
          <p className="text-secondary font-bold uppercase tracking-widest text-[10px]">Bilimingiz uchun kerakli javoblar</p>
        </div>
        <FAQItem
          index={1}
          q="Platformada test yaratish uchun nimalar kerak?"
          a="osontestol.uz platformasida test yaratish uchun sizga faqatgina tayyor savollar to'plami (Word yoki matn ko'rinishida) kerak bo'ladi. Tizimimiz Word (.docx) fayllarini avtomatik tahlil qilib, soniyalar ichida testga aylantiradi."
        />
        <FAQItem
          index={2}
          q="O'quvchilar platformadan foydalanishi uchun pul to'lashlari kerakmi?"
          a="Yo'q, o'quvchilar uchun platformadan foydalanish va test topshirish mutlaqo bepul. Ularga faqat o'qituvchi tomonidan taqdim etilgan test kodi yoki havola kerak bo'ladi."
        />
        <FAQItem
          index={3}
          q="Sun'iy intellekt (AI) tizimi qanday yordam beradi?"
          a="AI tizimi siz yuklagan murakkab matnlardan savollarni ajratib olish, savollarning qiyinlik darajasini aniqlash va xatolar ustida avtomatik tahlil yuritishda yordam beradi."
        />
        <FAQItem
          index={4}
          q="Natijalar xavfsizligi va shaffofligi qanday ta'minlanadi?"
          a="Har bir test topshirish jarayoni anti-cheat tizimi orqali nazorat qilinadi. Natijalar shifrlangan bazada saqlanadi va ularni faqat test yaratuvchisi (o'qituvchi yoki admin) ko'ra oladi."
        />
        <FAQItem
          index={5}
          q="Platformani mobil qurilmalarda ishlatsa bo'ladimi?"
          a="Albatta! osontestol.uz platformasi to'liq moslashuvchan (responsive) qilib yaratilgan. U kompyuter, planshet va smartfonlarda birdek mukammal ishlaydi."
        />
      </section>

      {/* Roles Section */}
      <section id="roles" className="py-32 px-6 scroll-mt-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-indigo-600/5 dark:bg-indigo-600/10 -skew-y-3 origin-center scale-110" />
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-black mb-16 text-primary uppercase tracking-tighter italic">Tizimga <span className="text-indigo-500">kirish</span></h2>

          <div className="grid md:grid-cols-3 gap-8">
            {roles.map((role, i) => (
              <div
                key={i}
                onClick={() => navigate(role.path)}
                className="group relative cursor-pointer overflow-hidden p-1 bg-gradient-to-br from-primary via-primary to-secondary rounded-[2.5rem] border border-primary hover:scale-[1.02] transition-all duration-500 shadow-xl"
              >
                <div className="p-10 rounded-[2.4rem] bg-primary/40 backdrop-blur-xl h-full flex flex-col">
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${role.color} flex items-center justify-center text-white mb-8 shadow-xl group-hover:scale-110 transition-transform`}>
                    {role.title === "ADMIN" ? <Shield size={28} /> : role.title === "O'QITUVCHI" ? <Layout size={28} /> : <Zap size={28} />}
                  </div>
                  <h3 className="text-3xl font-black mb-4 tracking-tighter text-primary">{role.title}</h3>
                  <p className="text-secondary mb-12 flex-grow">{role.desc}</p>

                  <div className="flex items-center gap-3 text-indigo-500 font-bold uppercase text-[10px] tracking-[0.2em]">
                    Boshqaruv paneli <ArrowRight size={14} className="group-hover:translate-x-2 transition-transform" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-24 px-6 border-t border-primary bg-[#0A080F] text-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16 mb-20">
            {/* Column 1: Brand & Contacts */}
            <div className="space-y-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-indigo-500/20">
                  T
                </div>
                <span className="text-2xl font-black uppercase tracking-tighter">osontestol<span className="text-indigo-600">.uz</span></span>
              </div>
              <ul className="space-y-6 text-sm font-medium text-gray-400">
                <li className="flex items-start gap-3">
                  <Send size={18} className="text-indigo-500 mt-1" />
                  <span>dostonbek@soliyev.uz</span>
                </li>
                <li className="flex items-start gap-3">
                  <Zap size={18} className="text-indigo-500 mt-1" />
                  <span>+998 91 660 56 06</span>
                </li>
                <li className="flex items-start gap-3">
                  <Globe size={18} className="text-indigo-500 mt-1" />
                  <span className="leading-relaxed text-xs">
                    O'zbekiston, Farg'ona viloyati
                  </span>
                </li>
              </ul>
            </div>

            {/* Column 2: Quick Links */}
            <div>
              <h5 className="text-base font-black uppercase tracking-widest mb-10 text-white italic">Platforma</h5>
              <ul className="space-y-6 text-sm font-bold text-gray-400">
                <li><a href="/" className="hover:text-indigo-500 transition-colors uppercase tracking-widest text-[10px]">Asosiy</a></li>
                <li><a href="#features" className="hover:text-indigo-500 transition-colors uppercase tracking-widest text-[10px]">Xizmatlar</a></li>
                <li><a href="#pricing" className="hover:text-indigo-500 transition-colors uppercase tracking-widest text-[10px]">Tariflar</a></li>
                <li><a href="#faq" className="hover:text-indigo-500 transition-colors uppercase tracking-widest text-[10px]">Savollar</a></li>
                <li><a href="#roles" className="hover:text-indigo-500 transition-colors uppercase tracking-widest text-indigo-500 font-black text-[10px]">Kirish</a></li>
              </ul>
            </div>

            {/* Column 3: Socials */}
            <div>
              <h5 className="text-base font-black uppercase tracking-widest mb-10 text-white italic">Ijtimoiy</h5>
              <div className="flex gap-4">
                {[Instagram, Send, Play, Globe].map((Icon, i) => (
                  <a key={i} href="#" className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center hover:bg-indigo-600 transition-all border border-white/10 group">
                    <Icon size={20} className="text-gray-400 group-hover:text-white transition-colors" />
                  </a>
                ))}
              </div>
            </div>

            {/* Column 4: App Store (Minimalist) */}
            <div className="space-y-8">
              <h5 className="text-base font-black uppercase tracking-widest text-white italic text-xs">Mobil Ilova</h5>
              <div className="flex flex-col gap-3">
                <div className="p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-3 cursor-pointer hover:bg-white/10 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center"><Zap size={18} /></div>
                  <div>
                    <p className="text-[7px] font-black opacity-50 uppercase">Yuklab olish</p>
                    <p className="text-sm font-black italic">Google Play</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] font-black uppercase tracking-widest text-gray-500">
            <p>© {new Date().getFullYear()} osontestol.uz Platformasi. Barcha huquqlar himoyalangan.</p>
            <p>Developed by <a href="https://soliyev.uz" target="_blank" rel="noopener noreferrer" className="text-indigo-500 underline">Soliyev.uz</a></p>
          </div>
        </div>
      </footer>
    </div>
  );
}
