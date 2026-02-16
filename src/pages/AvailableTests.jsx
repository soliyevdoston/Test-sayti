import React, { useState } from "react";
import DashboardLayout from "../components/DashboardLayout";
import { Search, CreditCard, ChevronRight, Filter } from "lucide-react";

export default function AvailableTests() {
  const [searchTerm, setSearchTerm] = useState("");

  const tests = [
    { id: 1, title: "Ingliz tili + ona tili va adabiyoti+bepul", price: 0, paid: false },
    { id: 2, title: "Ingliz tili + Matematika+bepul", price: 0, paid: false },
    { id: 3, title: "Kimyo + biologiya+bepul", price: 0, paid: false },
    { id: 4, title: "Matematika+Fizika+bepul", price: 0, paid: false },
    { id: 5, title: "Matematika+Fizika", price: 5000, paid: false },
    { id: 6, title: "Matematika+Ingliz tili", price: 5000, paid: false },
  ];

  return (
    <DashboardLayout role="student">
      <div className="max-w-7xl mx-auto">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-muted mb-8">
          <span className="text-primary">Asosiy</span>
          <ChevronRight size={14} />
          <span className="text-purple-500">Testlar</span>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-grow">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={18} />
            <input
              type="text"
              placeholder="Testlar bo'yicha qidirish..."
              className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white border border-primary outline-none focus:border-purple-500 transition-all text-sm font-bold"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="flex items-center gap-2 px-6 py-4 bg-white border border-primary rounded-2xl text-primary font-bold text-sm hover:bg-secondary transition-all">
            <Filter size={18} />
            Saralash
          </button>
        </div>

        {/* Tests Table Container */}
        <div className="bg-white rounded-[2rem] border border-primary shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-primary/50 text-[10px] font-black uppercase tracking-[0.2em] text-muted bg-secondary/30">
                  <th className="px-8 py-5 w-16">
                    <input type="checkbox" className="w-4 h-4 rounded border-primary" />
                  </th>
                  <th className="px-6 py-5">Sarlavha</th>
                  <th className="px-6 py-5">Narxi</th>
                  <th className="px-6 py-5 text-center">To'lov</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary/10">
                {tests.map((test) => (
                  <tr key={test.id} className="hover:bg-purple-500/[0.02] transition-colors group">
                    <td className="px-8 py-5">
                      <input type="checkbox" className="w-4 h-4 rounded border-primary" />
                    </td>
                    <td className="px-6 py-5">
                      <p className="text-sm font-bold text-primary group-hover:text-purple-600 transition-colors uppercase tracking-tight">
                        {test.title}
                      </p>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <span className="text-sm font-black text-primary">
                        {test.price.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex justify-center">
                        <button className="p-2.5 rounded-xl bg-[#00D094]/10 text-[#00D094] hover:bg-[#00D094] hover:text-white transition-all shadow-sm">
                          <CreditCard size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination/Bottom Info */}
        <div className="mt-12 flex flex-col md:flex-row justify-between items-center gap-6 p-8 bg-white/50 border border-primary rounded-[2.5rem] backdrop-blur-xl">
           <div className="text-[10px] font-black uppercase tracking-[0.2em] text-center md:text-left text-gray-500 max-w-2xl leading-relaxed">
             Mualliflik huquqi © 2025 O'zR FA V.I. Romanovskiy nomidagi Matematika instituti va Testchi jamoasi tomonidan ishlab chiqilgan. Barcha huquqlar himoyalangan.
           </div>
           <div className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 whitespace-nowrap">
             Tarqatgan: <span className="text-purple-500">Testchi</span>
           </div>
        </div>
      </div>
      
      {/* Target Logo Float (matching Image 1) */}
      <div className="fixed bottom-8 right-8 w-16 h-16 bg-white border border-primary rounded-full shadow-2xl flex items-center justify-center p-2 group hover:scale-110 transition-transform cursor-pointer">
        <div className="w-full h-full bg-blue-600 rounded-full flex items-center justify-center text-white">
          <div className="w-8 h-8 relative">
             <div className="absolute inset-0 border-4 border-white rounded-full"></div>
             <div className="absolute inset-2 bg-white rounded-full"></div>
             <div className="absolute inset-1 border-2 border-blue-600 rounded-full"></div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
