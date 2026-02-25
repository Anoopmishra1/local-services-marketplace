# 🔧 Local Services Marketplace

An Urban Company-style app for booking electricians, plumbers, tutors & more.

## 📦 Project Structure

```
local-services-marketplace/
├── backend/     → Node.js + Express REST API + Socket.io
├── mobile/      → React Native mobile app (Customer + Provider)
├── admin/       → React + Vite + Tailwind CSS Admin Dashboard
└── schema.sql   → PostgreSQL / Supabase database schema
```

## 🚀 Tech Stack

| Layer | Technology |
|---|---|
| Mobile App | React Native (Expo) |
| Backend API | Node.js + Express |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth + OTP |
| Maps | Google Maps API |
| Payments | Razorpay |
| Real-time Chat | Socket.io |
| Admin Dashboard | React + Vite + Tailwind CSS |

## 🏁 Getting Started

### 1. Backend
```bash
cd backend
npm install
cp .env.example .env   # Fill in your credentials
npm run dev
```

### 2. Mobile
```bash
cd mobile
npm install
npx expo start
```

### 3. Admin Dashboard
```bash
cd admin
npm install
npm run dev
```

## 👥 User Roles
- **Customer** — Browse, book & pay for services
- **Service Provider** — Register, manage bookings & earnings
- **Admin** — Approve providers, track revenue, resolve disputes
