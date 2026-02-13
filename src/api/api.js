const BASE_URL = "https://exam-secure-environment.onrender.com";

export const startExam = async (userData) => {
  const res = await fetch(`${BASE_URL}/attempt/start`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(userData)
  });
  return res.json();
};

export const endExam = async (attemptId) => {
  const res = await fetch(`${BASE_URL}/attempt/end`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ attemptId })
  });
  return res.json();
};

export const checkIp = async (attemptId) => {
  const res = await fetch(`${BASE_URL}/attempt/check-ip`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ attemptId })
  });
  return res.json();
};
