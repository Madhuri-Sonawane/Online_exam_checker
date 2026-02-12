# Secure Online Assessment – Frontend

## 📌 Overview

This is the frontend application for a Secure Test Environment system.

It provides a controlled online exam interface that integrates with a secure backend to:

- Capture candidate details
- Monitor browser behavior
- Detect suspicious actions
- Log structured audit events
- Enforce full-screen mode
- Monitor IP changes

The frontend does not make security decisions — the backend remains the source of truth.

---

## 🚀 Features

### 📝 Candidate Registration
- First Name
- Surname
- Email

These details are linked to the assessment attempt.

---

### ⏱ 60-Minute Countdown Timer
- Timer starts only after "Start Exam."
- Auto-submit when time reaches 0
- Logs:
  - `TIMER_STARTED`
  - `TIMER_ENDED`

---

### 🖥 Fullscreen Enforcement
- Exam forces full-screen mode
- Exit from full screen is detected
- Events logged:
  - `FULLSCREEN_ENTER`
  - `FULLSCREEN_EXIT`

---

### 🚨 Activity Monitoring

During the assessment, the following actions are detected and logged:

- Copy attempt → `COPY_ATTEMPT`
- Paste attempt → `PASTE_ATTEMPT`
- Tab switch/focus loss → `TAB_SWITCH.`
- Question selection → `QUESTION_ANSWERED`

All logs follow a unified event schema.

---

### 🌐 IP Monitoring Integration

- Periodic IP validation via backend
- If IP changes:
  - Non-blocking warning displayed
  - Event logged: `IP_CHANGE_WARNING_SHOWN`
- Warning is neutral and does not interrupt exam flow

---

### 📦 Event Logging Architecture

All events include:

- eventType
- attemptId
- timestamp
- questionId (if applicable)
- metadata (browser, focus state, etc.)

Events are:

- Temporarily stored in localStorage
- Batched before sending to backend
- Persisted during refresh
- Flushed on exam submission
- Blocked after exam ends

---

## 🛠 Tech Stack

- React (Vite)
- JavaScript
- Fetch API
- Fullscreen API
- LocalStorage

---

## ⚙️ Setup Instructions

### 1️⃣ Clone Repository

```bash
git clone https://github.com/Madhuri-Sonawane/Online_exam_checker
cd Online_exam_checker
2️⃣ Install Dependencies
npm install
3️⃣ Configure Backend URL
Open:

src/api/api.js
Replace API base URL with your deployed backend URL.

Example:

const BASE_URL = "https://your-backend-url.com";
4️⃣ Run Locally
npm run dev
🌍 Deployment
This project can be deployed on:

Vercel

Netlify

GitHub Pages

Before deploying, ensure:

Backend is deployed

API URL updated

CORS enabled on backend

🔐 Security Design Notes
Backend validates IP changes

Frontend only reports browser activity

Logs become immutable after submission

The employer dashboard provides a complete audit trail

👤 Author
Madhuri Rajendra Sonawane
