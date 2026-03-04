const STORAGE_KEY = "teacher_question_bank_v1";

const safeParse = (raw, fallback) => {
  try {
    const parsed = JSON.parse(raw);
    return parsed == null ? fallback : parsed;
  } catch {
    return fallback;
  }
};

const readStore = () => {
  const parsed = safeParse(localStorage.getItem(STORAGE_KEY) || "{}", {});
  return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
};

const writeStore = (value) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(value || {}));
};

const buildQuestionId = () =>
  `QB-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

const toArray = (value) => (Array.isArray(value) ? value : []);

const clampCount = (count) => {
  const numeric = Number(count || 1);
  if (!Number.isFinite(numeric)) return 1;
  return Math.max(1, Math.min(20, Math.round(numeric)));
};

const normalizeDifficulty = (value = "") => {
  const normalized = String(value || "").trim().toLowerCase();
  if (["easy", "medium", "hard"].includes(normalized)) return normalized;
  return "medium";
};

const createOptionSet = ({ correct, wrong = [] }) => {
  const options = [correct, ...wrong].filter(Boolean).map((item) => String(item).trim());
  const unique = Array.from(new Set(options));
  return unique.slice(0, 4);
};

export const getTeacherQuestionBank = (teacherId) => {
  const id = String(teacherId || "").trim();
  if (!id) return [];
  const store = readStore();
  const rows = toArray(store[id]);
  return rows.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
};

export const saveTeacherQuestion = (teacherId, payload = {}) => {
  const id = String(teacherId || "").trim();
  if (!id) throw new Error("Teacher ID topilmadi");

  const text = String(payload.text || "").trim();
  const options = toArray(payload.options).map((item) => String(item || "").trim()).filter(Boolean);
  const correctOption = String(payload.correctOption || "").trim();
  if (!text || options.length < 2 || !correctOption) {
    throw new Error("Savol matni, variantlar va to'g'ri javob majburiy");
  }

  const store = readStore();
  const current = toArray(store[id]);
  const row = {
    id: buildQuestionId(),
    subject: String(payload.subject || "Umumiy").trim() || "Umumiy",
    topic: String(payload.topic || "").trim(),
    difficulty: normalizeDifficulty(payload.difficulty),
    text,
    options: options.slice(0, 6),
    correctOption,
    explanation: String(payload.explanation || "").trim(),
    generated: Boolean(payload.generated),
    createdAt: new Date().toISOString(),
  };

  store[id] = [row, ...current];
  writeStore(store);
  return row;
};

export const removeTeacherQuestion = (teacherId, questionId) => {
  const id = String(teacherId || "").trim();
  const qid = String(questionId || "").trim();
  if (!id || !qid) return false;
  const store = readStore();
  const current = toArray(store[id]);
  const next = current.filter((item) => String(item.id || "") !== qid);
  if (next.length === current.length) return false;
  store[id] = next;
  writeStore(store);
  return true;
};

const mathGenerator = (topic, index, difficulty) => {
  const seed = index + 1;
  const base = seed * 2 + (difficulty === "hard" ? 9 : difficulty === "easy" ? 3 : 6);
  const correct = base + seed;
  return {
    text: `${topic || "Algebra"}: ${base} + ${seed} = ?`,
    options: createOptionSet({
      correct: String(correct),
      wrong: [String(correct + 1), String(correct - 1), String(correct + 2)],
    }),
    correctOption: String(correct),
    explanation: "Qo'shish amalida sonlarni to'g'ri jamlash kerak.",
  };
};

const languageGenerator = (topic, index) => {
  const rows = [
    {
      question: `${topic || "Ingliz tili"}: "I ___ to school every day."`,
      correct: "go",
      wrong: ["goes", "went", "gone"],
      explanation: "I bilan odatda fe'lning birinchi shakli ishlatiladi.",
    },
    {
      question: `${topic || "Ingliz tili"}: "She ___ a book now."`,
      correct: "is reading",
      wrong: ["read", "reads", "was read"],
      explanation: "Hozir davom etayotgan ish uchun Present Continuous ishlatiladi.",
    },
  ];
  const item = rows[index % rows.length];
  return {
    text: item.question,
    options: createOptionSet({ correct: item.correct, wrong: item.wrong }),
    correctOption: item.correct,
    explanation: item.explanation,
  };
};

const historyGenerator = (topic, index) => {
  const rows = [
    {
      question: `${topic || "Tarix"}: O'zbekiston mustaqilligi qachon e'lon qilingan?`,
      correct: "1991-yil 1-sentabr",
      wrong: ["1990-yil 1-sentabr", "1992-yil 1-sentabr", "1989-yil 1-sentabr"],
      explanation: "Mustaqillik 1991-yil 1-sentabrda e'lon qilingan.",
    },
    {
      question: `${topic || "Tarix"}: Amir Temur davlati poytaxti qaysi shahar bo'lgan?`,
      correct: "Samarqand",
      wrong: ["Buxoro", "Xiva", "Toshkent"],
      explanation: "Amir Temur saltanatining asosiy markazi Samarqand bo'lgan.",
    },
  ];
  const item = rows[index % rows.length];
  return {
    text: item.question,
    options: createOptionSet({ correct: item.correct, wrong: item.wrong }),
    correctOption: item.correct,
    explanation: item.explanation,
  };
};

const scienceGenerator = (topic, index) => {
  const rows = [
    {
      question: `${topic || "Tabiiy fan"}: Suvning kimyoviy formulasi qaysi?`,
      correct: "H2O",
      wrong: ["CO2", "O2", "NaCl"],
      explanation: "Suv ikkita vodorod va bitta kislorod atomidan tashkil topgan.",
    },
    {
      question: `${topic || "Tabiiy fan"}: Yerning tabiiy yo'ldoshi nima deb ataladi?`,
      correct: "Oy",
      wrong: ["Quyosh", "Mars", "Venera"],
      explanation: "Yerning yagona tabiiy yo'ldoshi Oydir.",
    },
  ];
  const item = rows[index % rows.length];
  return {
    text: item.question,
    options: createOptionSet({ correct: item.correct, wrong: item.wrong }),
    correctOption: item.correct,
    explanation: item.explanation,
  };
};

const pickGenerator = (subject = "") => {
  const normalized = String(subject || "").trim().toLowerCase();
  if (["matematika", "algebra", "geometriya", "math"].includes(normalized)) return mathGenerator;
  if (["ingliz tili", "english", "ona tili", "til"].includes(normalized)) return languageGenerator;
  if (["tarix", "history"].includes(normalized)) return historyGenerator;
  return scienceGenerator;
};

export const generateSmartQuestions = ({
  subject = "Umumiy",
  topic = "",
  difficulty = "medium",
  count = 5,
} = {}) => {
  const total = clampCount(count);
  const level = normalizeDifficulty(difficulty);
  const generator = pickGenerator(subject);

  return Array.from({ length: total }).map((_, index) => {
    const generated = generator(topic, index, level);
    return {
      id: buildQuestionId(),
      subject: String(subject || "Umumiy").trim() || "Umumiy",
      topic: String(topic || "").trim(),
      difficulty: level,
      text: generated.text,
      options: toArray(generated.options),
      correctOption: generated.correctOption,
      explanation: generated.explanation,
      generated: true,
      createdAt: new Date().toISOString(),
    };
  });
};

