const BASE_URL = "http://localhost:4000";

export const startExam = async (candidateData) => {
  const res = await fetch("http://localhost:4000/attempt/start", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(candidateData)
  });

  return res.json();
};


export const endExam = async (attemptId) => {
  await fetch(`${BASE_URL}/attempt/end`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ attemptId })
  });
};

export const checkIp = async (attemptId) => {
  const res = await fetch(`${BASE_URL}/attempt/check-ip`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ attemptId })
  });
  return res.json();
};
