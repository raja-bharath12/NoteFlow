# NoteFlow 📝

> **Premium Collaborative Notes Management Platform** — Full-Stack SaaS application built with React, Spring Boot, Firebase & MySQL.

[![Java](https://img.shields.io/badge/Java-21-orange)](https://openjdk.org/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.2-green)](https://spring.io/projects/spring-boot)
[![React](https://img.shields.io/badge/React-18-blue)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![Firebase](https://img.shields.io/badge/Firebase-10-orange)](https://firebase.google.com/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-blue)](https://www.mysql.com/)

---

## ✨ Features

- 🗂️ **Nested Folder Management** — Unlimited folder nesting, drag-and-drop organization
- 📝 **Rich Text Editor** — Microsoft Word-like editor powered by Tiptap
- 🤝 **Real-time Collaboration** — Share documents with VIEWER / COMMENTER / EDITOR roles
- 💬 **Comments & Threads** — Inline comments with resolve/unresolve
- 📜 **Version History** — Auto-saved versions, restore any previous state
- 🔍 **Full-text Search** — Search across all documents and folders
- 🔔 **Notifications** — Real-time alerts for shares, comments, invites
- 🌐 **Google Sign-In** — Firebase Auth with Email/Password + Google OAuth
- ☁️ **Cloud Storage** — Avatar and attachment uploads via Firebase Storage

---

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, TypeScript, Tailwind CSS, shadcn/ui, Framer Motion, Tiptap |
| **Backend** | Java 21, Spring Boot 3.2, Spring Security, JWT, WebSocket |
| **Database** | MySQL 8.0 (JPA/Hibernate) + Firebase Firestore |
| **Auth** | Firebase Auth (Email/Password + Google) |
| **Storage** | Firebase Storage |
| **Build** | Vite (frontend), Maven (backend) |

---

## 🚀 Quick Start

### Prerequisites
- Java 21+
- Maven 3.9+
- Node.js 18+
- MySQL 8.0+

### 1. Clone
```bash
git clone https://github.com/raja-bharath12/NoteFlow.git
cd NoteFlow
```

### 2. Database
```sql
CREATE DATABASE noteflow CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 3. Backend
```bash
cd backend
# Update src/main/resources/application.yml with your MySQL password
mvn clean package -DskipTests
java -jar target/noteflow-backend-1.0.0.jar
# Runs on http://localhost:8080
```

### 4. Frontend
```bash
cd frontend
npm install --legacy-peer-deps
npm run dev
# Runs on http://localhost:5173
```

### 5. Firebase Setup
1. Enable **Email/Password** and **Google** sign-in in Firebase Console
2. Enable **Firestore** and **Storage**
3. Run: `firebase deploy --only firestore:rules,firestore:indexes,storage`

---

## 📁 Project Structure

```
NoteFlow/
├── backend/                    # Spring Boot API
│   └── src/main/java/com/noteflow/
│       ├── controller/         # REST endpoints
│       ├── service/            # Business logic
│       ├── entity/             # JPA entities
│       ├── repository/         # Spring Data repos
│       ├── security/           # JWT filter & config
│       └── config/             # CORS, WebSocket, Security
│
├── frontend/                   # Vite + React SPA
│   └── src/
│       ├── components/         # UI components
│       ├── contexts/           # AuthContext, etc.
│       ├── hooks/              # Custom React hooks
│       ├── lib/                # Firebase services
│       ├── pages/              # Route pages
│       └── services/           # Axios API services
│
├── database/                   # MySQL schema
├── firestore.rules             # Firestore security rules
├── storage.rules               # Firebase Storage rules
├── firestore.indexes.json      # Firestore composite indexes
├── firebase.json               # Firebase CLI config
└── FIREBASE.md                 # Firebase setup guide
```

---

## 🔑 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login & get JWT |
| POST | `/api/auth/refresh` | Refresh access token |
| GET | `/api/documents/recent` | Get recent documents |
| POST | `/api/documents` | Create document |
| PUT | `/api/documents/{id}` | Update document |
| POST | `/api/folders` | Create folder |
| GET | `/api/search?q=term` | Full-text search |
| GET | `/api/notifications` | Get notifications |

Full API docs: `http://localhost:8080/swagger-ui.html`

---

## 📄 License

MIT © NoteFlow
