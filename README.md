# TrackED 📚

A comprehensive **Education Management System** built with the MERN stack (MongoDB, Express, React, Node.js), featuring role-based dashboards for Teachers, Mentors, and Students.

---

## ✨ Features

### 👨‍🏫 Teacher Login
- Manage Students & Mentors (create / delete accounts)
- Assign Mentor ↔ Student relationships
- **Finance Control**: Assign fees to students, manage mentor salaries
- Generate AI-powered exams (Gemini API)
- Mark / verify student payments (online UPI & offline cash code)

### 🧑‍🏫 Mentor Login
- Daily Attendance marking for assigned students
- Assign tasks with deadlines to students
- Schedule next meeting times per student
- View salary & payout history

### 🎓 Student Login
- Live attendance stats (Present / Absent / Total breakdown)
- Real-time pending & completed task tracker
- Fee details with UPI online payment submission
- Instant Cash Code verification for offline payments
- Next mentor meeting display
- **Notification bell** — alerts for new tasks, fee assignments, attendance marking

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, TailwindCSS (Vanilla CSS), Lucide Icons |
| Backend | Node.js, Express.js |
| Database | MongoDB (Atlas or in-memory for dev) |
| Auth | JWT (JSON Web Tokens) |
| AI | Google Gemini API (exam generation) |

---

## 🚀 Getting Started

### Prerequisites
- Node.js v18+
- MongoDB Atlas account (or runs in-memory automatically if no URI provided)

### 1. Clone the repo
```bash
git clone https://github.com/YOUR_USERNAME/TrackED.git
cd TrackED
```

### 2. Backend Setup
```bash
cd backend
npm install
```

Create a `.env` file in the `backend/` folder:
```env
JWT_SECRET=your_secret_key_here
GEMINI_API_KEY=your_gemini_api_key_here
MONGO_URI=mongodb+srv://your_connection_string   # Optional - runs in-memory if not set
```

Start the backend:
```bash
npm run dev
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

---

## 🔑 Demo Accounts

When running without a MongoDB URI (in-memory mode), these accounts are auto-seeded:

| Role | Email | Password |
|------|-------|----------|
| Teacher | teacher@tracked.com | password |
| Mentor | mentor@tracked.com | password |
| Student | student@tracked.com | password |
| Developer | developer@tracked.com | password |

---

## 📁 Project Structure

```
TrackED/
├── backend/
│   ├── models/          # Mongoose schemas
│   ├── routes/          # Express API routes
│   ├── middleware/       # JWT auth middleware
│   └── server.js        # Entry point
└── frontend/
    ├── src/
    │   ├── pages/       # Role-specific pages
    │   ├── components/  # Shared components (Sidebar etc.)
    │   └── App.jsx      # Router & protected routes
    └── index.html
```

---

## 📜 License
MIT
