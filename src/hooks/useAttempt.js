import { useEffect, useRef } from "react";
import { startAttempt, checkIp } from "../api/api";

export function useAttempt(setShowWarning) {
  const warningShownRef = useRef(false);

  // Start attempt
  useEffect(() => {
    async function initAttempt() {
      try {
        const data = await startAttempt();
        localStorage.setItem("attemptId", data.attemptId);
      console.log("Attempt started:", data.attemptId);
      } catch (error) {
        console.error("Failed to start attempt", error);
      }
    }
    initAttempt();
  }, []);

  // Periodic IP check
  useEffect(() => {
    const interval = setInterval(async () => {
      const attemptId = localStorage.getItem("attemptId");
      if (!attemptId) return;

      try {
        const res = await checkIp(attemptId);

        if (res?.ipChanged && !warningShownRef.current) {
          warningShownRef.current = true;
          setShowWarning(true);
        }
      } catch (error) {
        console.error("IP check failed", error);
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [setShowWarning]);
}
