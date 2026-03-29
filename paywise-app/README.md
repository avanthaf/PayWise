# PayWise – Paywise app README

## Overview

The PayWise app is a **React + TypeScript** single-page application (SPA) built with **Vite**. It provides a guided user journey from authentication through debt input, strategy selection, repayment progress tracking, and data export. It communicates with an **Express + MongoDB** backend API and an optional **Flask ML service** for DQN-powered recommendations.

## Project Structure (Frontend)

```
client/src/
├── pages/
│   ├── LoginPage.tsx         # JWT login form
│   ├── RegisterPage.tsx      # New user registration
│   ├── InputPage.tsx         # Debt & financial data entry
│   ├── DashboardPage.tsx     # Summary overview & charts
│   ├── StrategyPage.tsx      # Avalanche / Snowball / DQN comparison
│   ├── ProgressPage.tsx      # Month-by-month repayment tracker
│   └── ExportPage.tsx        # Download schedule as CSV / PDF
├── components/
│   ├── PageLayout.tsx        # Shared nav + wrapper layout
│   └── ProtectedRoute.tsx    # Auth-guarded route wrapper
├── hooks/
│   └── useLogout.ts          # Clears auth state & redirects to /login
├── App.tsx                   # Route definitions
├── main.tsx                  # React entry point
├── global.css                # Global styles & CSS variables
└── index.html                # HTML shell

server/src/
├── ml_service.py             # Flask API serving the trained DQN
├── index.ts                  # Express app entry point
├── routes/
│   ├── auth.ts               # /api/auth — register & JWT issue
│   ├── login.ts              # /api/login — credential verification
│   └── finance.ts            # /api/finance — CRUD for financial data
└── models/
    └── User.ts               # Mongoose User schema
    
```

---

## Running the Frontend

### Development

```bash
# Install dependencies
npm install

# Start Vite dev server (client)
npm run dev
# Runs on http://localhost:5173

# In a separate terminal — start Express backend
cd server
npm install
npm run dev
# Runs on http://localhost:5000

# In a separate terminal — start Flask ML service (optional)
python ml_service.py
# Runs on http://localhost:5001
```

### Production Build

```bash
npm run build
# Output in dist/
```

---