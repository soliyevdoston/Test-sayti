// src/api.js
const BASE_URL = "http://localhost:5002";

// ================= LOGIN =================
export async function loginUser(role, username, password) {
  // role: 'admin', 'teacher', 'student'
  try {
    const res = await fetch(`${BASE_URL}/login/${role}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
      mode: "cors",
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.message || "Login xato");
    }

    return res.json();
  } catch (err) {
    throw err;
  }
}

// ================= TESTLAR =================
export async function fetchTests() {
  try {
    const res = await fetch(`${BASE_URL}/tests`, {
      method: "GET",
      mode: "cors",
    });
    return res.json();
  } catch (err) {
    throw err;
  }
}

// ================= NATIJALAR =================
export async function sendResult(result) {
  try {
    const res = await fetch(`${BASE_URL}/results`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(result),
      mode: "cors",
    });
    return res.json();
  } catch (err) {
    throw err;
  }
}

export async function getResults() {
  try {
    const res = await fetch(`${BASE_URL}/results`, {
      method: "GET",
      mode: "cors",
    });
    return res.json();
  } catch (err) {
    throw err;
  }
}
