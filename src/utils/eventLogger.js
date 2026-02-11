const STORAGE_KEY = "exam_event_queue";

/**
 * Add event to local queue
 */
export const logEvent = (eventType, metadata = {}) => {
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

  console.log("Event queued:", event); // 🔥 DEBUG
};


/**
 * Send events to backend
 */
export const flushEvents = async () => {
  const events =
    JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];

  if (!events.length) {
    console.log("No events to flush");
    return;
  }

  try {
    const response = await fetch("http://localhost:4000/events/log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(events)
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("Flush failed:", error);
      return;
    }

    console.log("Events flushed to backend:", events);

    localStorage.removeItem(STORAGE_KEY);

  } catch (err) {
    console.error("Flush error:", err);
  }
};
