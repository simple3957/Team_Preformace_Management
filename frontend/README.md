# Team Performance Management System

A full-stack employee performance management platform that enables organizations to manage employees, reviews, self-assessments, and manager feedback efficiently.

---

# 📌 Setup & Run Instructions

## Prerequisites

Make sure the following are installed on your system:

- Node.js (v18+ recommended)
- npm or yarn
- MongoDB (local installation or MongoDB Atlas)

---

## 1. Clone the Repository

```bash
git clone https://github.com/simple3957/Team_Preformace_Management.git
cd Team_Preformace_Management
```

---

## 2. Install Dependencies

### Backend

```bash
cd backend
npm install
```

### Frontend

```bash
cd frontend
npm install
```

---

## 3. Configure Environment Variables

Create a `.env` file inside the backend folder.

Example:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
```

---

## 4. Start the Application

### Start Backend

```bash
cd backend
npm run dev
```

### Start Frontend

```bash
cd frontend
npm start
```

---

## 5. Access the Application

Frontend:

```txt
http://localhost:3000
```

Backend API:

```txt
http://localhost:5000
```

---

# 🛠️ Tech Stack & Rationale

## Frontend

- React.js
- Tailwind CSS
- Axios
- React Router

### Why?

React was chosen for its component-based architecture and fast development workflow. Tailwind CSS enables rapid UI development with consistent styling.

---

## Backend

- Node.js
- Express.js

### Why?

Express provides a lightweight and scalable backend architecture suitable for REST APIs and rapid prototyping.

---

## Database / Storage Layer

- SQLite

### Why?

Flexible schema design helped iterate quickly. It is ideal for handling nested review/self-assessment structures and reduced setup complexity within the 6-hour implementation constraint.

---

## Authentication & Password Hashing

- JWT (JSON Web Tokens)
- bcrypt

### Why?

JWT provides stateless authentication. bcrypt was used for secure password hashing with salting to prevent plain-text storage.

---

# 🏗️ Architectural Overview

The project follows a modular MERN-stack architecture.

## Frontend Structure

- `components/` → Reusable UI components
- `pages/` → Route-level pages
- `services/` → API calls and backend communication
- `context/` → Authentication and global state management

---

## Backend Structure

- `controllers/` → Business logic
- `routes/` → API endpoints
- `models/` → MongoDB schemas
- `middleware/` → Authentication and authorization
- `config/` → Database configuration

---

# 🤖 How AI Tools Were Used

AI tools were used as productivity accelerators during development.

## AI Assistants Used

- ChatGPT
- GitHub Copilot

---

## AI-Assisted Areas

- Boilerplate API structure
- CRUD scaffolding
- React component structuring
- JWT setup
- Tailwind styling suggestions

---

## Hand-Written / Edited

- Business logic
- Role handling
- Review workflows
- Database schema decisions
- Integration debugging

---

## Validation

All AI-generated code was manually reviewed, tested, and refactored to ensure readability and proper authentication flow.

---

# 📌 Assumptions

## User Roles

Two primary roles exist:

- Employee
- Manager

Managers are identified via a role field in the user schema.

---

## Manager Assignment

Employees reference their direct manager through a `managerId` field.

---

## Review Modeling

Performance reviews and self-assessments are modeled as separate entities to maintain flexibility and clear ownership of submissions.

---

## Scope

- Single organization scope
- Internal usage only
- Basic authentication requirements

---

# ⚖️ Trade-offs

Given the 6-hour implementation constraint, the following were deprioritized:

## Advanced RBAC

A simplified role model was used instead of fine-grained permissions.

---

## UI/UX Polish

Priority was given to functionality over animations and accessibility.

---

## Automated Testing

Unit and integration tests were not fully implemented.

---

## Scalability

Database indexing and caching strategies were deferred.

---

# 🚀 Future Work

## Features

- Peer-to-peer reviews
- Automated review cycles
- Email notifications
- Analytics dashboard

---

## Security

- Rate limiting
- Security hardening
- Improved error handling
