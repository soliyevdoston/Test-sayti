const DEFAULT_TEST_TEMPLATE = `# Test shabloni (matn format)
# Har bir savolda 1 ta to'g'ri javob bo'lishi kerak.
# Formula yozish uchun LaTeX uslubidan foydalaning: \\frac{a}{b}, x^2, x_1, \\sqrt{16}

1. Quyidagilardan qaysi biri to'g'ri?
A) 2 + 2 = 3
B) 2 + 2 = 4*
C) 2 + 2 = 5
D) 2 + 2 = 6

2. Formula savoli:
A) $\\frac{a+b}{c}$
B) $\\frac{a-b}{c}$*
C) $\\sqrt{a+b}$
D) a^2 + b^2
`;

const DEFAULT_CSV_TEMPLATE = [
  ["question", "option_a", "option_b", "option_c", "option_d", "correct_option", "points"],
  ["2+2 nechiga teng?", "3", "4", "5", "6", "B", "1"],
  ["x^2 + 2x + 1 nimaga teng?", "(x+1)^2", "(x-1)^2", "x^2+1", "2x+1", "A", "1"],
];

const DEFAULT_STUDENT_TEMPLATE = [
  ["fullName", "username", "password"],
  ["Ali Valiyev", "ali_valiyev", "Ali@2026"],
  ["Vali Karimov", "vali_karimov", "Vali@2026"],
];

const PASSWORD_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789@#$";

const toPlainText = (value) => (value == null ? "" : String(value));

export const sanitizeFileName = (value, fallback = "file") => {
  const base = toPlainText(value)
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9\s-_]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .toLowerCase();

  return base || fallback;
};

export const escapeHtml = (input = "") =>
  String(input)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const isSafeMediaSrc = (value = "") => {
  const src = String(value || "").trim();
  if (!src) return false;
  if (/^https?:\/\//i.test(src)) return true;
  if (/^data:image\//i.test(src)) return true;
  if (/^\/uploads\//i.test(src)) return true;
  if (/^uploads\//i.test(src)) return true;
  return false;
};

const buildImageHtml = (src = "", alt = "test image") => {
  if (!isSafeMediaSrc(src)) return "";
  return `<img src="${escapeHtml(src)}" alt="${escapeHtml(alt || "test image")}" class="rich-inline-image" loading="lazy" />`;
};

const formatMathTokens = (escapedText) => {
  let output = escapedText;

  output = output.replace(
    /\\\\frac\{([^{}]+)\}\{([^{}]+)\}/g,
    (_, numerator, denominator) =>
      `<span class="math-fraction"><span>${numerator}</span><span>${denominator}</span></span>`
  );

  output = output.replace(/\\\\sqrt\{([^{}]+)\}/g, (_, value) => `√(<span class="math-sqrt">${value}</span>)`);

  output = output.replace(
    /([A-Za-z0-9)\]])\^(\{([^{}]+)\}|([A-Za-z0-9+\-*/=()]+))/g,
    (_, base, fullExponent, bracketExponent, singleExponent) =>
      `${base}<sup>${bracketExponent || singleExponent || fullExponent}</sup>`
  );

  output = output.replace(
    /([A-Za-z0-9)\]])_(\{([^{}]+)\}|([A-Za-z0-9+\-*/=()]+))/g,
    (_, base, fullSub, bracketSub, singleSub) =>
      `${base}<sub>${bracketSub || singleSub || fullSub}</sub>`
  );

  return output;
};

export const normalizeFormulaInput = (text = "") =>
  toPlainText(text)
    .replace(/\\\(/g, "$")
    .replace(/\\\)/g, "$")
    .replace(/\\\[/g, "$$")
    .replace(/\\\]/g, "$$")
    .replace(/\r\n/g, "\n")
    .trim();

export const validateFormulaSyntax = (text = "") => {
  const source = toPlainText(text);
  const issues = [];

  let braceBalance = 0;
  for (let i = 0; i < source.length; i += 1) {
    const ch = source[i];
    const prev = source[i - 1];
    if (ch === "{" && prev !== "\\") braceBalance += 1;
    if (ch === "}" && prev !== "\\") braceBalance -= 1;
  }

  if (braceBalance !== 0) {
    issues.push("Qavslar soni mos emas: '{' va '}' tekshiring.");
  }

  const dollarMatches = source.match(/\$/g) || [];
  if (dollarMatches.length % 2 !== 0) {
    issues.push("Formula belgisi '$' yopilmagan.");
  }

  return {
    isValid: issues.length === 0,
    issues,
  };
};

export const renderRichMathText = (text = "", options = {}) => {
  const { preserveLines = true } = options;
  if (!text) return "";

  const raw = toPlainText(text).replace(
    /!\[([^\]]*)\]\(([^)\s]+(?:\s+"[^"]*")?)\)/g,
    (_, altText, rawSrc) => {
      const srcPart = String(rawSrc || "").trim().replace(/\s+"[^"]*"$/, "");
      const altPart = String(altText || "").trim();
      return `[img:${srcPart}${altPart ? `|${altPart}` : ""}]`;
    }
  );

  const parts = raw.split(/(\$\$[^$]+\$\$|\$[^$]+\$|\[img:[^\]]+\])/g);

  const html = parts
    .map((part) => {
      if (!part) return "";
      if (part.startsWith("[img:") && part.endsWith("]")) {
        const payload = part.slice(5, -1).trim();
        const [src, ...altRest] = payload.split("|");
        const imageHtml = buildImageHtml(src, altRest.join("|") || "test image");
        return imageHtml || escapeHtml(part);
      }
      const escaped = escapeHtml(part);
      if (part.startsWith("$$") && part.endsWith("$$")) {
        return `<span class="math-inline math-block">${formatMathTokens(escapeHtml(part.slice(2, -2)))}</span>`;
      }
      if (part.startsWith("$") && part.endsWith("$")) {
        return `<span class="math-inline">${formatMathTokens(escapeHtml(part.slice(1, -1)))}</span>`;
      }
      return formatMathTokens(escaped);
    })
    .join("");

  if (!preserveLines) return html;
  return html.replace(/\n/g, "<br />");
};

const triggerDownload = (filename, content, mimeType) => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

const buildWatermarkLayer = (label = "testonlinee.uz") =>
  Array.from({ length: 10 })
    .map(
      (_, idx) =>
        `<span style="
          position:absolute;
          left:${(idx % 3) * 32 + 4}%;
          top:${Math.floor(idx / 3) * 28 + 6}%;
          font-size:26px;
          font-weight:800;
          color:rgba(15,23,42,0.07);
          transform:rotate(-26deg);
          text-transform:lowercase;
          letter-spacing:0.12em;
          user-select:none;
          white-space:nowrap;
        ">${escapeHtml(label)}</span>`
    )
    .join("");

const buildExportDocument = ({ title = "Hisobot", bodyHtml = "", watermark = "testonlinee.uz" }) => `<!doctype html>
<html lang="uz">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>${escapeHtml(title)}</title>
    <style>
      body {
        margin: 0;
        background: #f7f8fb;
        font-family: "Segoe UI", Arial, sans-serif;
        color: #0f172a;
      }
      .page {
        width: 210mm;
        min-height: 297mm;
        margin: 0 auto;
        background: #ffffff;
        padding: 18mm 16mm;
        position: relative;
        box-sizing: border-box;
        overflow: hidden;
      }
      .watermark-layer {
        position: absolute;
        inset: 0;
        pointer-events: none;
      }
      h1, h2, h3 {
        margin: 0;
      }
      .meta {
        margin-top: 6px;
        color: #475569;
        font-size: 12px;
      }
      .question-card {
        border: 1px solid #dbe2f0;
        border-radius: 10px;
        padding: 10px 12px;
        margin-top: 10px;
        background: #ffffff;
      }
      .option-row {
        margin-top: 4px;
        font-size: 13px;
      }
      .ok {
        color: #0f766e;
        font-weight: 700;
      }
      .table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 10px;
      }
      .table th, .table td {
        border: 1px solid #dbe2f0;
        padding: 8px;
        font-size: 12px;
        text-align: left;
      }
      .table th {
        background: #eef3ff;
      }
      .badge {
        display: inline-block;
        padding: 2px 8px;
        border-radius: 999px;
        font-size: 11px;
        font-weight: 700;
      }
      .badge.public { background: #dcfce7; color: #166534; }
      .badge.group { background: #dbeafe; color: #1d4ed8; }
      .math-fraction { display:inline-flex; flex-direction:column; align-items:center; line-height:1; margin:0 2px; }
      .math-fraction > span:first-child { border-bottom:1px solid currentColor; padding:0 2px; }
      .math-fraction > span:last-child { padding:0 2px; }
      .math-inline { display:inline-block; font-family:"Times New Roman", serif; padding:0 2px; }
      .math-block { display:block; margin:4px 0; }
      @media print {
        body { background: #fff; }
        .page { margin: 0; box-shadow: none; width: auto; min-height: auto; }
      }
    </style>
  </head>
  <body>
    <div class="page">
      <div class="watermark-layer">${buildWatermarkLayer(watermark)}</div>
      ${bodyHtml}
    </div>
  </body>
</html>`;

const downloadHtmlBlob = (filename, html, mimeType) => {
  triggerDownload(filename, html, mimeType);
};

const openPrintWindow = (title, html) => {
  const printWindow = window.open("", "_blank", "width=1024,height=768");
  if (!printWindow) {
    throw new Error("Brauzer pop-up ni blokladi. Pop-up ga ruxsat bering.");
  }
  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.document.title = title;
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
  }, 350);
};

export const downloadTextFile = (filename, content) => {
  triggerDownload(filename, content, "text/plain;charset=utf-8");
};

export const downloadJsonFile = (filename, data) => {
  triggerDownload(filename, JSON.stringify(data, null, 2), "application/json;charset=utf-8");
};

export const toCsvCell = (value) => {
  const str = toPlainText(value);
  if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
};

export const toCsvLine = (values = []) => values.map(toCsvCell).join(",");

export const downloadCsvFile = (filename, rows = []) => {
  const content = rows.map((row) => toCsvLine(row)).join("\n");
  triggerDownload(filename, content, "text/csv;charset=utf-8");
};

const getQuestionsFromTest = (test = {}) => {
  if (Array.isArray(test.questions)) return test.questions;
  if (Array.isArray(test.parsedQuestions)) return test.parsedQuestions;
  return [];
};

const toOptionText = (option) => {
  if (option == null) return "";
  if (typeof option === "string") return option;
  return option.text || "";
};

const getCorrectOptionLetter = (question = {}) => {
  const options = Array.isArray(question.options) ? question.options : [];
  const idx = options.findIndex((opt) => Boolean(opt?.isCorrect));
  return idx === -1 ? "" : String.fromCharCode(65 + idx);
};

export const exportTestByFormat = (test, format = "json") => {
  const questions = getQuestionsFromTest(test);
  const baseName = sanitizeFileName(test?.title || "test");

  if (format === "json") {
    downloadJsonFile(`${baseName}.json`, {
      title: test?.title,
      description: test?.description || "",
      duration: test?.duration,
      accessType: test?.accessType || "public",
      questions,
    });
    return;
  }

  if (format === "csv") {
    const rows = [
      ["question", "option_a", "option_b", "option_c", "option_d", "correct_option", "points"],
      ...questions.map((question) => {
        const options = Array.isArray(question.options) ? question.options : [];
        return [
          question.text || "",
          toOptionText(options[0]),
          toOptionText(options[1]),
          toOptionText(options[2]),
          toOptionText(options[3]),
          getCorrectOptionLetter(question),
          question.points || 1,
        ];
      }),
    ];
    downloadCsvFile(`${baseName}.csv`, rows);
    return;
  }

  if (format === "word" || format === "pdf") {
    const body = `
      <h1>${escapeHtml(test?.title || "Noma'lum test")}</h1>
      <p class="meta">Tavsif: ${escapeHtml(test?.description || "-")}</p>
      <p class="meta">Vaqt: ${escapeHtml(test?.duration || "-")} daqiqa</p>
      <p class="meta">Login: ${escapeHtml(test?.testLogin || "-")}</p>
      <p class="meta">Kirish turi: <span class="badge ${test?.accessType === "group" ? "group" : "public"}">${escapeHtml(
        test?.accessType === "group" ? "Faqat guruh" : "Umumiy"
      )}</span></p>
      ${questions
        .map((question, idx) => {
          const options = Array.isArray(question.options) ? question.options : [];
          return `
            <div class="question-card">
              <p><strong>${idx + 1}. </strong>${renderRichMathText(question.text || "Savol matni yo'q")}</p>
              ${options
                .map((option, optionIdx) => {
                  const label = String.fromCharCode(65 + optionIdx);
                  return `<div class="option-row ${option?.isCorrect ? "ok" : ""}">${label}) ${renderRichMathText(
                    toOptionText(option),
                    { preserveLines: false }
                  )}${option?.isCorrect ? " (to'g'ri)" : ""}</div>`;
                })
                .join("")}
            </div>
          `;
        })
        .join("")}
    `;
    const html = buildExportDocument({
      title: test?.title || "Test",
      bodyHtml: body,
    });

    if (format === "word") {
      downloadHtmlBlob(`${baseName}.doc`, html, "application/msword;charset=utf-8");
      return;
    }
    openPrintWindow(test?.title || "Test", html);
    return;
  }

  const lines = [];
  lines.push(`Test: ${test?.title || "Noma'lum test"}`);
  lines.push(`Tavsif: ${test?.description || "-"}`);
  lines.push(`Vaqt: ${test?.duration || "-"} daqiqa`);
  lines.push(`Kirish: ${test?.testLogin || "-"}`);
  lines.push("");

  questions.forEach((question, index) => {
    lines.push(`${index + 1}. ${question.text || "Savol matni yo'q"}`);
    const options = Array.isArray(question.options) ? question.options : [];
    options.forEach((option, optionIndex) => {
      const label = String.fromCharCode(65 + optionIndex);
      const correctMark = option?.isCorrect ? " *" : "";
      lines.push(`${label}) ${toOptionText(option)}${correctMark}`);
    });
    lines.push("");
  });

  downloadTextFile(`${baseName}.txt`, lines.join("\n"));
};

export const exportResultsByFormat = ({
  test = null,
  rows = [],
  format = "excel",
  title = "",
}) => {
  const safeRows = Array.isArray(rows) ? rows : [];
  const testTitle = title || test?.title || "Natijalar";
  const baseName = sanitizeFileName(`${testTitle}-natijalar`, "natijalar");

  const headers = ["#", "O'quvchi", "Ball", "To'g'ri", "Xato", "Foiz", "Vaqt", "Kirish turi"];
  const mappedRows = safeRows.map((item, idx) => {
    const totalScore = Number(item?.totalScore || 0);
    const maxScore = Number(item?.maxScore || 0);
    const percent = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;
    const submittedAt = item?.submittedAt ? new Date(item.submittedAt).toLocaleString("uz-UZ") : "-";
    return [
      idx + 1,
      item?.studentName || "-",
      `${totalScore}/${maxScore || 0}`,
      item?.correctAnswersCount ?? "-",
      item?.wrongAnswersCount ?? "-",
      `${percent}%`,
      submittedAt,
      test?.accessType === "group" ? "Guruh" : "Umumiy",
    ];
  });

  if (format === "excel") {
    const htmlTable = `
      <table>
        <thead>
          <tr>${headers.map((h) => `<th>${escapeHtml(h)}</th>`).join("")}</tr>
        </thead>
        <tbody>
          ${mappedRows
            .map((row) => `<tr>${row.map((col) => `<td>${escapeHtml(col)}</td>`).join("")}</tr>`)
            .join("")}
        </tbody>
      </table>
    `;
    const html = buildExportDocument({
      title: `${testTitle} (Excel)`,
      bodyHtml: `<h1>${escapeHtml(testTitle)}</h1><p class="meta">Natijalar jadvali</p>${htmlTable}`,
    });
    downloadHtmlBlob(`${baseName}.xls`, html, "application/vnd.ms-excel;charset=utf-8");
    return;
  }

  if (format === "word" || format === "pdf") {
    const body = `
      <h1>${escapeHtml(testTitle)}</h1>
      <p class="meta">Kirish turi: ${escapeHtml(test?.accessType === "group" ? "Guruh" : "Umumiy")}</p>
      <table class="table">
        <thead>
          <tr>${headers.map((h) => `<th>${escapeHtml(h)}</th>`).join("")}</tr>
        </thead>
        <tbody>
          ${mappedRows
            .map((row) => `<tr>${row.map((col) => `<td>${escapeHtml(col)}</td>`).join("")}</tr>`)
            .join("")}
        </tbody>
      </table>
    `;
    const html = buildExportDocument({ title: testTitle, bodyHtml: body });
    if (format === "word") {
      downloadHtmlBlob(`${baseName}.doc`, html, "application/msword;charset=utf-8");
      return;
    }
    openPrintWindow(testTitle, html);
    return;
  }

  const csvRows = [headers, ...mappedRows];
  downloadCsvFile(`${baseName}.csv`, csvRows);
};

export const downloadTestTemplate = (format = "txt") => {
  if (format === "csv") {
    downloadCsvFile("test-template.csv", DEFAULT_CSV_TEMPLATE);
    return;
  }
  downloadTextFile("test-template.txt", DEFAULT_TEST_TEMPLATE);
};

export const downloadStudentsTemplate = () => {
  downloadCsvFile("students-template.csv", DEFAULT_STUDENT_TEMPLATE);
};

const parseCsvLine = (line = "") => {
  const cells = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    const next = line[i + 1];

    if (ch === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if ((ch === "," || ch === ";" || ch === "\t") && !inQuotes) {
      cells.push(current.trim());
      current = "";
      continue;
    }

    current += ch;
  }

  cells.push(current.trim());
  return cells;
};

export const parseBulkStudents = (inputText = "") => {
  const lines = toPlainText(inputText)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (!lines.length) return [];

  const normalized = lines.map((line) => {
    const columns = parseCsvLine(line);
    return {
      fullName: columns[0] || "",
      username: columns[1] || "",
      password: columns[2] || "",
    };
  });

  const first = normalized[0];
  const headerTokens = [first.fullName, first.username, first.password]
    .join(" ")
    .toLowerCase();

  const hasHeader = headerTokens.includes("fullname") || headerTokens.includes("full name") || headerTokens.includes("username");
  return hasHeader ? normalized.slice(1) : normalized;
};

export const generatePassword = (length = 8) => {
  let output = "";
  for (let i = 0; i < length; i += 1) {
    const idx = Math.floor(Math.random() * PASSWORD_CHARS.length);
    output += PASSWORD_CHARS[idx];
  }
  return output;
};

const normalizeUsernameToken = (value = "") =>
  value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9\s]/g, " ")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");

export const generateUsername = (fullName = "", usedSet = new Set(), prefix = "st") => {
  const parts = normalizeUsernameToken(fullName).split("_").filter(Boolean);
  const base = parts.length >= 2 ? `${parts[0]}_${parts[parts.length - 1]}` : parts[0] || prefix;

  let candidate = base;
  let counter = 1;
  while (usedSet.has(candidate)) {
    counter += 1;
    candidate = `${base}${counter}`;
  }

  usedSet.add(candidate);
  return candidate;
};

export const prepareStudentRecord = (record, usedSet = new Set()) => {
  const fullName = toPlainText(record?.fullName).trim();
  const username = toPlainText(record?.username).trim() || generateUsername(fullName, usedSet);
  if (!usedSet.has(username)) usedSet.add(username);

  return {
    fullName,
    username,
    password: toPlainText(record?.password).trim() || generatePassword(8),
  };
};

export const buildCredentialsText = (records = []) =>
  records
    .map((record, idx) => `${idx + 1}. ${record.fullName} | login: ${record.username} | parol: ${record.password}`)
    .join("\n");
