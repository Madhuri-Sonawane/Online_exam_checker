import { useEffect, useState } from "react";
import { startExam, endExam, checkIp } from "../api/api";
import { logEvent, flushEvents } from "../utils/eventLogger";

export default function TestPage() {
  
  const [examStarted, setExamStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60 * 60);
  const [warning, setWarning] = useState("");

  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [email, setEmail] = useState("");

  const [answers, setAnswers] = useState({});
  const [ipWarningShown, setIpWarningShown] = useState(false);

  const attemptId = localStorage.getItem("attemptId");

  const questions = [
    {
      id: 1,
      question: "What is React?",
      options: ["Library", "Framework", "Database", "Language"]
    },
    {
      id: 2,
      question: "Which hook manages state?",
      options: ["useState", "useEffect", "useRef", "useMemo"]
    },
    {
      id: 3,
      question: "What is Node.js?",
      options: ["Runtime", "Database", "UI Tool", "Browser"]
    },
    {
      id: 4,
      question: "What is MongoDB?",
      options: ["SQL DB", "NoSQL DB", "Frontend", "Language"]
    }
  ];

  /* ================= TIMER ================= */
  useEffect(() => {
    if (!examStarted) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleEndExam();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [examStarted]);

/* ================= IP MONITORING ================= */

useEffect(() => {
  if (!examStarted) return;

  let warningActive = false;

  const interval = setInterval(async () => {
    try {
      const res = await checkIp(attemptId);

      if (res?.ipChanged && !warningActive) {
        warningActive = true;

        const message =
          "Network configuration change detected. Assessment will continue.";

        // Log warning event
        logEvent("IP_CHANGE_WARNING_SHOWN", {
          message,
          severity: "INFO"
        });

        setWarning(message);

        setTimeout(() => {
          setWarning("");
          warningActive = false;
        }, 4000);
      }
    } catch (err) {
      console.error("IP monitoring error", err);
    }
  }, 60000);

  return () => clearInterval(interval);
}, [examStarted, attemptId]);

  /* ================= COPY / PASTE / TAB ================= */
  useEffect(() => {
    if (!examStarted) return;

    const handleCopy = () => {
      logEvent("COPY_ATTEMPT");
      showWarning("Copy detected");
    };

    const handlePaste = () => {
      logEvent("PASTE_ATTEMPT");
      showWarning("Paste detected");
    };

    const handleTab = () => {
      if (document.hidden) {
        logEvent("TAB_SWITCH");
        showWarning("Tab switch detected");
      }
    };

    document.addEventListener("copy", handleCopy);
    document.addEventListener("paste", handlePaste);
    document.addEventListener("visibilitychange", handleTab);

    return () => {
      document.removeEventListener("copy", handleCopy);
      document.removeEventListener("paste", handlePaste);
      document.removeEventListener("visibilitychange", handleTab);
    };
  }, [examStarted]);

  const showWarning = (msg) => {
    setWarning(msg);
    setTimeout(() => setWarning(""), 3000);
  };

const enterFullscreen = () => {
  const elem = document.documentElement;

  if (elem.requestFullscreen) {
    elem.requestFullscreen();
  }
};

const handleFullscreenChange = () => {
  if (!document.fullscreenElement && examStarted) {
    logEvent("FULLSCREEN_EXIT", {
      message: "User exited fullscreen mode"
    });

    showWarning("Fullscreen mode exited. Please return to fullscreen.");
  } else if (document.fullscreenElement) {
    logEvent("FULLSCREEN_ENTER");
  }
};
useEffect(() => {
  document.addEventListener("fullscreenchange", handleFullscreenChange);

  return () => {
    document.removeEventListener("fullscreenchange", handleFullscreenChange);
  };
}, [examStarted]);


  /* ================= START EXAM ================= */
 const handleStartExam = async () => {
  if (!name || !surname || !email) {
    alert("Please fill all fields");
    return;
  }

  try {
    const data = await startExam();
    localStorage.setItem("attemptId", data.attemptId);

    enterFullscreen();

    logEvent("FULLSCREEN_ENTER", {
      triggeredBy: "exam_start"
    });

    logEvent("TIMER_STARTED");

    setExamStarted(true);
  } catch (err) {
    console.error("Start exam failed", err);
  }
};

  /* ================= END EXAM ================= */
 const handleEndExam = async () => {
  try {
    logEvent("TIMER_ENDED");

    await flushEvents();
    await endExam(localStorage.getItem("attemptId"));
    localStorage.setItem("examEnded", "true");
    
    if (document.fullscreenElement) {
      document.exitFullscreen();
    }

    setExamStarted(false);
    alert("Exam submitted");
  } catch (err) {
    console.error("End exam failed", err);
  }
};


  const formatTime = () => {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  const handleAnswer = (qId, value) => {
    setAnswers({ ...answers, [qId]: value });
    logEvent("QUESTION_ANSWERED", {
      questionId: qId,
      selectedOption: value
    });
  };

  return (
    <div style={styles.wrapper}>
      <div style={styles.card}>
        <h2 style={{ textAlign: "center" }}>
          Welcome to Online Assessment
        </h2>

        {!examStarted && (
          <>
            <input
              style={styles.input}
              placeholder="First Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            <input
              style={styles.input}
              placeholder="Surname"
              value={surname}
              onChange={(e) => setSurname(e.target.value)}
            />

            <input
              style={styles.input}
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <button style={styles.primaryBtn} onClick={handleStartExam}>
              Start Exam
            </button>
          </>
        )}

        {examStarted && (
          <>
            <div style={styles.timer}>
              Time Left: {formatTime()}
            </div>

            {questions.map((q) => (
              <div key={q.id} style={styles.questionBox}>
                <p><strong>{q.question}</strong></p>

                {q.options.map((opt) => (
                  <label key={opt} style={styles.option}>
                    <input
                      type="radio"
                      name={`q${q.id}`}
                      value={opt}
                      onChange={() => handleAnswer(q.id, opt)}
                    />
                    {opt}
                  </label>
                ))}
              </div>
            ))}

            <button style={styles.endBtn} onClick={handleEndExam}>
              End Exam
            </button>
          </>
        )}

        {warning && (
          <div style={styles.warning}>{warning}</div>
        )}
      </div>
    </div>
  );
}

/* ================= STYLES ================= */

const styles = {
  wrapper: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "100vh",
    background: "#f3f4f6"
  },
  card: {
    width: "100%",
    maxWidth: 650,
    background: "#ffffff",
    padding: 30,
    borderRadius: 10,
    boxShadow: "0 4px 15px rgba(0,0,0,0.08)"
  },
  input: {
    width: "100%",
    padding: 10,
    marginBottom: 15,
    borderRadius: 6,
    border: "1px solid #d1d5db"
  },
  primaryBtn: {
    width: "100%",
    padding: 10,
    background: "#2563eb",
    color: "white",
    border: "none",
    borderRadius: 6,
    cursor: "pointer"
  },
  endBtn: {
    marginTop: 20,
    width: "100%",
    padding: 10,
    background: "#dc2626",
    color: "white",
    border: "none",
    borderRadius: 6,
    cursor: "pointer"
  },
  timer: {
    textAlign: "center",
    fontWeight: "bold",
    marginBottom: 15
  },
  questionBox: {
    marginBottom: 15,
    padding: 12,
    border: "1px solid #e5e7eb",
    borderRadius: 6
  },
  option: {
    display: "block",
    marginTop: 5
  },
  warning: {
    marginTop: 15,
    padding: 10,
    background: "#fee2e2",
    borderRadius: 6,
    color: "#b91c1c",
    textAlign: "center"
  }
};
