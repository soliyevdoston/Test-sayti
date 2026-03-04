import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { Clock, FileText, RefreshCcw, Search } from "lucide-react";
import DashboardLayout from "../components/DashboardLayout";
import { getAvailableTests } from "../api/api";
import { getAssignedTestsByStudent } from "../utils/studentTestAssignments";
import {
  getActiveStudentCatalogTests,
  getStudentCatalogDirections,
} from "../utils/studentCatalogTools";
import { getBlockExamMeta, stripBlockExamMetaFromDescription } from "../utils/blockExamTools";

export default function AvailableTests() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [tests, setTests] = useState([]);
  const [assignedTestIds, setAssignedTestIds] = useState([]);
  const [selectedDirection, setSelectedDirection] = useState("all");
  const [availableDirections, setAvailableDirections] = useState([]);

  const loadTests = async () => {
    const teacherId = localStorage.getItem("teacherId");
    const groupId = localStorage.getItem("groupId");
    const studentId = localStorage.getItem("studentId");
    const accessMode = localStorage.getItem("studentAccessMode");

    try {
      setLoading(true);
      if (accessMode === "personal") {
        const catalogTests = getActiveStudentCatalogTests().map((entry) => ({
          _id: `catalog_${entry.catalogId}`,
          title: entry.title,
          description: entry.description,
          duration: entry.duration,
          isStarted: entry.isStarted,
          direction: entry.direction,
        }));
        const directions = getStudentCatalogDirections(catalogTests);
        setAssignedTestIds([]);
        setAvailableDirections(directions);
        setSelectedDirection((prev) =>
          prev === "all" || directions.includes(prev) ? prev : "all"
        );
        setTests(catalogTests);
        return;
      }

      if (!teacherId) {
        setTests([]);
        return;
      }

      const { data } = await getAvailableTests(teacherId, groupId);
      const fetched = Array.isArray(data) ? data : [];
      const assigned = studentId ? getAssignedTestsByStudent(studentId) : [];
      const assignedSet = new Set(assigned);
      const filteredBase =
        accessMode === "personal" && assigned.length
          ? fetched.filter((test) => assignedSet.has(test._id))
          : fetched;
      const sorted = [...filteredBase].sort(
        (a, b) => Number(assignedSet.has(b._id)) - Number(assignedSet.has(a._id))
      );
      setAssignedTestIds(assigned);
      setAvailableDirections([]);
      setSelectedDirection("all");
      setTests(sorted);
    } catch {
      toast.error("Testlar ro'yxatini yuklashda xatolik");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTests();
  }, []);

  const filteredTests = useMemo(() => {
    const keyword = searchTerm.toLowerCase();
    const accessMode = localStorage.getItem("studentAccessMode");
    const directionFiltered =
      accessMode === "personal" && selectedDirection !== "all"
        ? tests.filter(
            (test) =>
              String(test.direction || "").toLowerCase() === String(selectedDirection || "").toLowerCase()
          )
        : tests;
    return directionFiltered.filter((test) => (test.title || "").toLowerCase().includes(keyword));
  }, [searchTerm, tests, selectedDirection]);

  const assignedSet = useMemo(() => new Set(assignedTestIds), [assignedTestIds]);
  const accessMode = localStorage.getItem("studentAccessMode");

  return (
    <DashboardLayout role="student">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-primary uppercase italic">
              Testlar <span className="text-indigo-600">Bo'limi</span>
            </h1>
            <p className="text-xs text-muted mt-1">
              {accessMode === "personal"
                ? "Shaxsiy kabinet uchun yo'nalishli testlar."
                : "Admin biriktirgan testlar birinchi chiqadi."}
            </p>
          </div>
          <button type="button" className="btn-secondary" onClick={loadTests}>
            <RefreshCcw size={14} /> Yangilash
          </button>
        </div>

        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={18} />
          <input
            type="text"
            placeholder="Testlarni qidirish..."
            className="input-clean pl-11"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {accessMode === "personal" && (
          <div className="premium-card">
            <label className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
              Yo'nalishni tanlang
            </label>
            <select
              value={selectedDirection}
              onChange={(e) => setSelectedDirection(e.target.value)}
              className="input-clean mt-2 md:w-72"
            >
              <option value="all">Barcha yo'nalishlar</option>
              {availableDirections.map((direction) => (
                <option key={direction} value={direction}>
                  {direction}
                </option>
              ))}
            </select>
          </div>
        )}

        {loading ? (
          <div className="premium-card py-20 text-center text-muted">Yuklanmoqda...</div>
        ) : filteredTests.length ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filteredTests.map((test) => {
              const blockMeta = getBlockExamMeta(test);
              const cleanDescription = stripBlockExamMetaFromDescription(test.description);
              return (
                <div key={test._id} className="premium-card">
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="w-11 h-11 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center">
                      <FileText size={20} />
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                          test.isStarted
                            ? "bg-green-500/10 text-green-600 border-green-500/20"
                            : "bg-red-500/10 text-red-600 border-red-500/20"
                        }`}
                      >
                        {test.isStarted ? "Faol" : "Kutilmoqda"}
                      </span>
                      {assignedSet.has(test._id) && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border bg-blue-500/10 text-blue-600 border-blue-500/20">
                          Admin biriktirgan
                        </span>
                      )}
                      {blockMeta.isBlockExam && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border bg-indigo-500/10 text-indigo-600 border-indigo-500/20">
                          Blok imtihon: {blockMeta.subjects.length} fan
                        </span>
                      )}
                    </div>
                  </div>

                  <h3 className="text-lg font-black text-primary line-clamp-1">{test.title || "Nomsiz test"}</h3>
                  {accessMode === "personal" && (
                    <p className="text-[11px] text-blue-600 font-semibold mt-1 uppercase">
                      Yo'nalish: {test.direction || "Umumiy"}
                    </p>
                  )}
                  <p className="text-sm text-secondary mt-2 line-clamp-2 min-h-[40px]">
                    {cleanDescription || "Tavsif mavjud emas"}
                  </p>
                  {blockMeta.isBlockExam && (
                    <p className="text-[11px] text-secondary mt-1">
                      Fanlar: <span className="font-bold text-primary">{blockMeta.subjects.join(", ")}</span>
                    </p>
                  )}

                  <div className="mt-5 pt-4 border-t border-primary/20 flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 text-xs text-muted font-semibold">
                      <Clock size={14} className="text-indigo-500" />
                      {test.duration || "-"} daqiqa
                    </span>
                    <button type="button" className="btn-secondary" onClick={() => navigate("/student/dashboard")}>
                      Kabinetda ochish
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="premium-card py-20 text-center text-muted">
            Hozircha ko'rinadigan test topilmadi
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
