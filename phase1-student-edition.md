# DevCollab - Phase 1 (Student Edition)

## Goal

Build a working foundation as quickly as possible.

Focus on:

* Authentication
* Authorization
* RBAC
* Project Management
* Member Management
* Redux Toolkit
* Custom Hooks

Ignore advanced scalability features for now.

---

# What We Are NOT Building In Phase 1

Move these to later phases:

* Redis
* Socket.io
* Docker
* CI/CD
* AWS Deployment
* Bull Queues
* Email Workers
* Refresh Token Reuse Detection
* Jest
* Supertest

These provide little value during the first build.

---

# Phase 1 Deliverable

At the end of Phase 1:

A user should be able to:

1. Register
2. Login
3. Create a project
4. Invite members
5. Assign roles
6. View projects
7. Edit projects
8. Delete projects
9. Logout

---

# Backend Folder Structure

```text
backend/
│
├── src/
│   ├── config/
│   │   └── db.js
│   │
│   ├── models/
│   │   ├── User.js
│   │   ├── Project.js
│   │   └── ProjectMember.js
│   │
│   ├── routes/
│   │   ├── auth.routes.js
│   │   └── project.routes.js
│   │
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   └── project.controller.js
│   │
│   ├── middleware/
│   │   ├── auth.middleware.js
│   │   ├── role.middleware.js
│   │   └── error.middleware.js
│   │
│   ├── utils/
│   │   ├── jwt.js
│   │   └── ApiResponse.js
│   │
│   └── app.js
│
├── server.js
└── package.json
```

---

# Frontend Folder Structure

```text
frontend/
│
├── src/
│   ├── api/
│   │   ├── axios.js
│   │   ├── authApi.js
│   │   └── projectApi.js
│   │
│   ├── app/
│   │   └── store.js
│   │
│   ├── features/
│   │   ├── auth/
│   │   └── projects/
│   │
│   ├── hooks/
│   │   ├── useAuth.js
│   │   └── usePermission.js
│   │
│   ├── pages/
│   │   ├── Login.jsx
│   │   ├── Register.jsx
│   │   ├── Dashboard.jsx
│   │   └── Project.jsx
│   │
│   └── routes/
│       └── ProtectedRoute.jsx
│
└── package.json
```

---

# Database Collections

## User

```js
{
  name,
  email,
  password,
  createdAt
}
```

---

## Project

```js
{
  name,
  description,
  ownerId,
  createdAt
}
```

---

## ProjectMember

```js
{
  projectId,
  userId,
  role
}
```

Roles:

```text
admin
editor
viewer
```

---

# Authentication

Use:

```text
JWT Access Token
```

Store in:

```text
httpOnly Cookie
```

For now:

* Login
* Register
* Logout

No advanced token rotation.

---

# RBAC

## Admin

Can:

* Edit project
* Delete project
* Add member
* Remove member

## Editor

Can:

* View project
* Update project

## Viewer

Can:

* View project only

---

# API Endpoints

## Auth

```text
POST /api/auth/register

POST /api/auth/login

POST /api/auth/logout

GET /api/auth/me
```

---

## Projects

```text
GET /api/projects

POST /api/projects

GET /api/projects/:id

PATCH /api/projects/:id

DELETE /api/projects/:id
```

---

## Members

```text
GET /api/projects/:id/members

POST /api/projects/:id/members

PATCH /api/projects/:id/members/:userId

DELETE /api/projects/:id/members/:userId
```

---

# Frontend Screens

## Authentication

* Login Page
* Register Page

---

## Dashboard

Show:

```text
My Projects
```

Card layout:

```text
Project Name
Description
Members Count
```

---

## Project Page

Show:

```text
Project Name

Members

Role
```

Task board comes later.

---

# Redux Toolkit

## Auth Slice

Store:

```js
user
isAuthenticated
loading
error
```

---

## Project Slice

Store:

```js
projects
selectedProject
loading
error
```

---

# Custom Hooks

## useAuth()

Returns:

```js
user
login()
logout()
```

---

## usePermission()

Returns:

```js
hasPermission()
```

---

# Completion Criteria

Phase 1 is complete when:

✅ User can register

✅ User can login

✅ User can logout

✅ User can create project

✅ User can invite member

✅ Roles work

✅ Protected routes work

✅ Redux state works

✅ Custom hooks work

Only then move to Phase 2.

---

# Phase 2 Preview

Next we add:

* Task Board
* Task CRUD
* Comments
* Attachments

Do not start Redis, Socket.io, Docker, or AWS before Phase 1 is fully working.
