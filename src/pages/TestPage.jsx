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

  const questions = [
    { id: 1, question: "What is React?", options: ["Library", "Framework", "Database", "Language"] },
    { id: 2, question: "Which hook manages state?", options: ["useState", "useEffect", "useRef", "useMemo"] },
    { id: 3, question: "What is Node.js?", options: ["Runtime", "Database", "UI Tool", "Browser"] },
    { id: 4, question: "What is MongoDB?", options: ["SQL DB", "NoSQL DB", "Frontend", "Language"] }
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
        const attemptId = localStorage.getItem("attemptId");
        if (!attemptId) return;

        const res = await checkIp(attemptId);

        if (res?.ipChanged && !warningActive) {
          warningActive = true;

          const message =
            "Network configuration change detected. Assessment will continue.";

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
  }, [examStarted]);

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

  /* ================= FULLSCREEN ================= */
  const enterFullscreen = () => {
    const elem = document.documentElement;
    if (elem.requestFullscreen) {
      elem.requestFullscreen().catch(() => {});
    }
  };

  const handleFullscreenChange = () => {
    if (!document.fullscreenElement && examStarted) {
      logEvent("FULLSCREEN_EXIT", {
        message: "User exited fullscreen mode"
      });
      showWarning("Fullscreen exited. Please return to fullscreen.");
    }
  };

  useEffect(() => {
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, [examStarted]);

  /* ================= START EXAM ================= */
  const handleStartExam = (e) => {
    e.preventDefault();

    if (!name || !surname || !email) {
      alert("Please fill all fields");
      return;
    }

    enterFullscreen();

    startExam({ firstName: name, surname, email })
      .then((data) => {
        localStorage.removeItem("examEnded");
        localStorage.setItem("attemptId", data.attemptId);

        logEvent("FULLSCREEN_ENTER", { triggeredBy: "exam_start" });
        logEvent("TIMER_STARTED");

        setExamStarted(true);
      })
      .catch((err) => {
        console.error("Start exam failed", err);
      });
  };

  /* ================= END EXAM ================= */
  const handleEndExam = async () => {
    try {
      logEvent("TIMER_ENDED");

      await flushEvents();
      await endExam(localStorage.getItem("attemptId"));

      localStorage.setItem("examEnded", "true");

      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
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
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="w-full max-w-3xl bg-white shadow-xl rounded-xl p-6 md:p-10">

        <h2 className="text-2xl font-bold text-center mb-6">
          Online Assessment
        </h2>

        {!examStarted && (
          <form className="space-y-4" onSubmit={handleStartExam}>
            <input
              className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="First Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            <input
              className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Surname"
              value={surname}
              onChange={(e) => setSurname(e.target.value)}
            />

            <input
              type="email"
              className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition"
            >
              Start Exam
            </button>
          </form>
        )}

        {examStarted && (
          <div className="space-y-6">
            <div className="text-center font-semibold text-lg text-blue-600">
              Time Left: {formatTime()}
            </div>

            {questions.map((q) => (
              <div
                key={q.id}
                className="border rounded-lg p-4 bg-gray-50"
              >
                <p className="font-semibold mb-3">{q.question}</p>

                <div className="space-y-2">
                  {q.options.map((opt) => (
                    <label
                      key={opt}
                      className="flex items-center gap-2 cursor-pointer"
                    >
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
              </div>
            ))}

            <button
              onClick={handleEndExam}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2 rounded-lg transition"
            >
              End Exam
            </button>
          </div>
        )}

        {warning && (
          <div className="mt-6 bg-red-100 text-red-700 p-3 rounded-lg text-center text-sm">
            {warning}
          </div>
        )}
      </div>
    </div>
  );
}
