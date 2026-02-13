const STORAGE_KEY = "exam_event_queue";

export const logEvent = (eventType, metadata = {}) => {
  // ✅ Get fresh attemptId every time
  const attemptId = localStorage.getItem("attemptId");
  const examEnded = localStorage.getItem("examEnded");

  if (!attemptId || examEnded === "true") return;

  const event = {
    eventType,
    attemptId,
    timestamp: new Date().toISOString(),
    questionId: metadata.questionId || null,
    metadata: {
      ...metadata,
      userAgent: navigator.userAgent,
      focusState: document.hidden ? "HIDDEN" : "VISIBLE"
    }
  };

  const existing =
    JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];

  existing.push(event);

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(existing)
  );
};

const BASE_URL = "https://exam-secure-environment.onrender.com";

export const flushEvents = async () => {
  const events =
    JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];

  if (!events.length) return;

  await fetch(`${BASE_URL}/events/log`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(events)
  });

  localStorage.removeItem(STORAGE_KEY);
};

