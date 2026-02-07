
# CHAPTER 4: IMPLEMENTATION

## 4.1 Tools and Technologies

| Component | Technology | Reasoning |
|-----------|------------|-----------|
| **Frontend** | React 18 (TypeScript) | Component-based, type-safe UI development. |
| **Backend** | Node.js (Express) | Event-driven, scalable for real-time apps. |
| **Database** | Supabase (PostgreSQL) | Relational integrity with modern API features. |
| **Real-time** | Socket.io | Low-latency bi-directional communication. |
| **Styling** | Tailwind CSS | Utility-first CSS for rapid, responsive design. |

## 4.2 Module Description

### 4.2.1 Authentication Module
Secure login for parents using JWT (JSON Web Tokens). Child login uses a simplified PIN/Pattern mechanism for ease of use.

### 4.2.2 Screen Time Service
A background service running on the server that periodically recalculates usage stats and triggers "Time's Up" events via WebSockets.

### 4.2.3 Gamification Engine
Tracks "Completed Videos" and awards XP. Levelling up unlocks badge assets.

## 4.3 Code Structure
```
root/
├── backend/
│   ├── src/
│   │   ├── controllers/ (Request Handlers)
│   │   ├── services/ (Business Logic)
│   │   └── models/ (DB Schema)
├── frontend/
│   ├── src/
│   │   ├── components/ (Reusable UI)
│   │   ├── contexts/ (State Management)
│   │   └── pages/ (Routes)
└── submission/ (Documentation)
```
