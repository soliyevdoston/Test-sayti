import React, { useState, useEffect } from "react";
import {
  FaShoppingCart,
  FaBolt,
  FaGem,
  FaStore
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";
import { toast } from "react-toastify";
import { createSubscription } from "../api/api";
import { Loader2 } from "lucide-react";

export default function TeacherShop() {
  const navigate = useNavigate();
  const [teacherName, setTeacherName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const name = localStorage.getItem("teacherName");
    const id = localStorage.getItem("teacherId");
    if (!name || !id) navigate("/teacher/login");
    else setTeacherName(name);
  }, [navigate]);

  const handlePurchase = async (item) => {
    try {
      setLoading(true);
      const teacherId = localStorage.getItem("teacherId");
      
      await createSubscription({
        teacherId,
        packType: item.title,
        amount: item.price
      });

      toast.success(`${item.title} uchun so'rov yuborildi!`);
    } catch (error) {
      toast.error("Xaridda xatolik: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const items = [
    { title: "Premium Pack", price: "uzs 50,000", icon: <FaGem />, desc: "Cheksiz test yuklash va tahlil", color: "from-indigo-500 to-blue-600" },
    { title: "Speed Boost", price: "uzs 20,000", icon: <FaBolt />, desc: "Tezkor grading va OCR", color: "from-blue-600 to-indigo-700" },
    { title: "Extra Storage", price: "uzs 15,000", icon: <FaStore />, desc: "+500 test uchun qo'shimcha joy", color: "from-indigo-400 to-blue-500" },
  ];

  return (
    <DashboardLayout role="teacher" userName={teacherName}>
      <section className="relative z-10 pt-12 pb-6 px-6 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-primary pb-8 mb-12">
          <div>
            <h2 className="text-4xl font-black tracking-tight text-primary mb-2 uppercase italic">
              Oson<span className="text-indigo-600 dark:text-indigo-400">TestOl</span> Shop
            </h2>
            <p className="text-secondary font-medium uppercase tracking-widest text-xs opacity-70">
              Platforma imkoniyatlarini kengaytiring va premium xizmatlarni xarid qiling
            </p>
          </div>
        </div>
      </section>

      <main className="relative z-10 px-6 max-w-7xl mx-auto pb-20">
        <div className="grid lg:grid-cols-3 gap-8">
          {items.map((item, idx) => (
            <div key={idx} className="premium-card group hover:border-indigo-500/50 transition-all text-center flex flex-col items-center">
               <div className={`w-20 h-20 rounded-[2rem] bg-gradient-to-br ${item.color} flex items-center justify-center text-white mb-8 shadow-xl shadow-indigo-500/20 group-hover:scale-110 transition-transform`}>
                 <div className="text-3xl">{item.icon}</div>
               </div>
               <h3 className="text-2xl font-black text-primary uppercase tracking-tighter mb-2 italic">{item.title}</h3>
               <p className="text-xs text-muted font-bold uppercase tracking-widest mb-6">{item.desc}</p>
               <div className="text-3xl font-black text-indigo-500 mb-8">{item.price}</div>
               <button 
                 disabled={loading}
                 onClick={() => handlePurchase(item)}
                 className="w-full py-4 rounded-2xl bg-secondary border border-primary text-[10px] font-black uppercase tracking-[0.2em] text-primary hover:bg-indigo-500 hover:text-white hover:border-indigo-500 transition-all shadow-sm flex items-center justify-center gap-2"
               >
                 {loading ? <Loader2 size={14} className="animate-spin" /> : "Sotib Olish"}
               </button>
            </div>
          ))}
        </div>
      </main>
    </DashboardLayout>
  );
}
