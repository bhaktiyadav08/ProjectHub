# ProjectHub 🚀

> Real-time Collaboration Platform for Project Management and Team Communication

[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=node.js)](https://nodejs.org)
[![MongoDB](https://img.shields.io/badge/MongoDB-7.0-47A248?style=flat-square&logo=mongodb)](https://mongodb.com)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-4.0-010101?style=flat-square&logo=socket.io)](https://socket.io)
[![Express](https://img.shields.io/badge/Express-4.0-000000?style=flat-square&logo=express)](https://expressjs.com)
[![Render](https://img.shields.io/badge/Deployed-Render-46E3B7?style=flat-square&logo=render)](https://projecthub-cg7d.onrender.com)

🔗 **Live Demo:** [https://projecthub-cg7d.onrender.com](https://projecthub-cg7d.onrender.com)

---

## 📌 Overview

ProjectHub is a real-time collaboration platform that streamlines project management and team communication. It overcomes the limitations of traditional static management tools by enabling instant updates, file sharing, and progress tracking — all in one place.

---

## ✨ Features

- **Real-time Updates** — instant communication using Socket.IO, no page refresh needed
- **Role-based Access** — three roles: Admin, Leader, and Member with separate permissions
- **Project Management** — create, assign, and track projects and tasks
- **Progress Tracking** — automated progress monitoring with visual indicators
- **File Sharing** — centralized file management within projects
- **Team Communication** — real-time messaging between team members
- **Secure Authentication** — protected routes with session-based access control

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js |
| Framework | Express.js |
| Database | MongoDB |
| Real-time | Socket.IO |
| Frontend | HTML, CSS, JavaScript |
| Deployment | Render |

---

## 👥 Roles

| Role | Permissions |
|------|-------------|
| Admin | Full control — manage users, projects, and system settings |
| Leader | Create and manage projects, assign tasks to members |
| Member | View assigned tasks, update progress, communicate with team |

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- MongoDB running locally or MongoDB Atlas URI

### Installation

```bash
# Clone the repository
git clone https://github.com/bhaktiyadav08/ProjectHub.git
cd ProjectHub

# Install dependencies
npm install

# Create .env file
cp .env.example .env
# Fill in your MongoDB URI and session secret
```

### Environment Variables

```env
MONGO_URI=mongodb://localhost:27017/projecthub
SESSION_SECRET=your_secret_key
PORT=3000
```

### Run Locally

```bash
npm start
```

Open `http://localhost:3000`
---

## 🔭 Future Scope

- Email notifications for task assignments and deadlines
- Gantt chart for project timeline visualization
- Mobile responsive UI
- Cloud file storage integration
- Analytics dashboard for project insights
