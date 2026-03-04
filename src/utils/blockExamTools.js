const BLOCK_MARKER_START = "[[BLOCK_EXAM::";
const BLOCK_MARKER_END = "]]";
const LEGACY_LABEL = "blok imtihon fanlari:";

const normalizeWhitespace = (value) => String(value || "").replace(/\s+/g, " ").trim();

export const normalizeBlockSubjects = (subjects = []) => {
  if (!Array.isArray(subjects)) return [];
  const unique = new Set();
  subjects.forEach((item) => {
    const normalized = normalizeWhitespace(item);
    if (!normalized) return;
    unique.add(normalized);
  });
  return Array.from(unique);
};

export const buildBlockExamMarker = (subjects = []) => {
  const normalizedSubjects = normalizeBlockSubjects(subjects);
  if (!normalizedSubjects.length) return "";
  return `${BLOCK_MARKER_START}${normalizedSubjects.join("||")}${BLOCK_MARKER_END}`;
};

const extractSubjectsFromMarker = (description = "") => {
  const raw = String(description || "");
  const startIndex = raw.indexOf(BLOCK_MARKER_START);
  if (startIndex < 0) return [];
  const markerPayload = raw.slice(startIndex + BLOCK_MARKER_START.length);
  const endIndex = markerPayload.indexOf(BLOCK_MARKER_END);
  if (endIndex < 0) return [];
  const subjectString = markerPayload.slice(0, endIndex);
  return normalizeBlockSubjects(subjectString.split("||"));
};

const extractSubjectsFromLegacy = (description = "") => {
  const raw = String(description || "");
  const match = raw.match(/blok\s+imtihon\s+fanlari:\s*([^\n|]+)/i);
  if (!match) return [];
  const subjectPart = String(match[1] || "");
  return normalizeBlockSubjects(subjectPart.split(","));
};

export const stripBlockExamMetaFromDescription = (description = "") => {
  const raw = String(description || "");
  const withoutMarker = raw.replace(
    /\[\[BLOCK_EXAM::[\s\S]*?\]\]/gi,
    " "
  );
  const withoutLegacyPipe = withoutMarker.replace(
    /\s*\|\s*blok\s+imtihon\s+fanlari:[^|]*/gi,
    " "
  );
  const withoutLegacyPlain = withoutLegacyPipe.replace(
    /blok\s+imtihon\s+fanlari:[^\n]*/gi,
    " "
  );
  return normalizeWhitespace(withoutLegacyPlain);
};

export const buildBlockExamDescription = (description = "", subjects = []) => {
  const marker = buildBlockExamMarker(subjects);
  const clean = stripBlockExamMetaFromDescription(description);
  return normalizeWhitespace([marker, clean].filter(Boolean).join(" "));
};

export const getBlockExamMeta = (test = {}) => {
  const directSubjects = normalizeBlockSubjects(test?.blockExam?.subjects);
  if (directSubjects.length) {
    return {
      isBlockExam: true,
      subjects: directSubjects,
    };
  }

  const description = String(test?.description || "");
  const markerSubjects = extractSubjectsFromMarker(description);
  if (markerSubjects.length) {
    return {
      isBlockExam: true,
      subjects: markerSubjects,
    };
  }

  const legacySubjects = extractSubjectsFromLegacy(description);
  if (legacySubjects.length) {
    return {
      isBlockExam: true,
      subjects: legacySubjects,
    };
  }

  return {
    isBlockExam: false,
    subjects: [],
  };
};
