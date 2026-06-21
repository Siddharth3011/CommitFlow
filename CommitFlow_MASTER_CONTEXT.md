# DEVCOLLAB MASTER CONTEXT

## Project Overview

Project Name: DevCollab (temporary name)

Project Type:
Real-Time Developer Collaboration Platform

Target:
Portfolio project for software engineering roles.

Primary Goal:
Build one production-grade project that demonstrates strong full-stack engineering, system design thinking, scalable architecture, and modern backend practices.

This project is NOT intended to be a Trello clone.

Instead, it combines ideas inspired by:

* Trello (task boards)
* Jira (project management)
* Notion (project documentation)
* Slack (team collaboration)
* GitHub Projects (developer workflow)

The objective is to create a unified workspace for software teams.

---

# Student Constraints

Developer:
Siddharth Pandey

Background:

* B.Tech CSE Student
* Final Year
* Preparing for placements
* DSA preparation is a major priority

Because of this:

* Project complexity must be controlled
* Development should be phased
* High ROI technologies only
* Avoid unnecessary complexity

---

# Existing Skills

Already Learned:

Frontend:

* React
* React Router
* Redux Toolkit
* Context API
* Custom Hooks
* Axios

Backend:

* Node.js
* Express.js
* JWT Authentication
* Authorization
* REST APIs
* Middleware
* Error Handling

Database:

* MongoDB
* Mongoose
* Aggregation Pipelines
* Indexing

---

# Technologies To Learn During Development

High Priority:

* Redis
* Socket.io
* Docker
* CI/CD
* Basic System Design

Low Priority:

* AWS Concepts

---

# AWS Constraint

The project should be AWS-ready but not necessarily deployed on AWS.

Reason:

Student budget constraints.

Actual Deployment:

Frontend:

* Vercel

Backend:

* Render

Database:

* MongoDB Atlas

Caching:

* Redis Cloud

File Storage:

* Cloudinary

Architecture Documentation:

Must include:

* EC2 Design
* S3 Design
* CloudFront Design
* IAM Design

for interview discussions and README documentation.

---

# Core Features

Phase 1:

Authentication
Authorization
RBAC
Project CRUD
Member Management
Redux Toolkit
Custom Hooks

Phase 2:

Task Board
Task CRUD
Comments
Attachments

Phase 3:

Analytics Dashboard
MongoDB Aggregation Pipelines
MongoDB Indexing Strategy

Phase 4:

Socket.io
Live Updates
Presence System

Phase 5:

Redis
Caching
Rate Limiting

Phase 6:

Docker
CI/CD
Deployment

---

# What DevCollab Actually Does

Example:

A team of students is building:

"AI Resume Analyzer"

Instead of using:

* WhatsApp
* Google Docs
* Trello
* GitHub Issues

separately,

they use DevCollab.

Inside DevCollab they can:

* Create Projects
* Manage Team Members
* Assign Roles
* Create Tasks
* Move Tasks
* Comment on Tasks
* Upload Attachments
* View Team Analytics
* Track Activity
* See Online Members

All inside one platform.

---

# Roles

Admin

Can:

* Edit Project
* Delete Project
* Add Members
* Remove Members
* Change Roles

Editor

Can:

* View Project
* Create Tasks
* Edit Tasks
* Comment

Viewer

Can:

* View Only

---

# MongoDB Concepts To Demonstrate

* Aggregation Pipelines
* Single Indexes
* Compound Indexes
* Data Modeling

Example Analytics:

* Tasks Completed Per User
* Project Progress
* Team Activity
* Most Active Members

---

# Redis Concepts To Demonstrate

* Cache Aside Pattern
* Rate Limiting
* Presence Tracking

---

# Socket.io Concepts To Demonstrate

* Real-Time Task Updates
* Presence System
* Notifications

---

# Deployment Strategy

Current Deployment:

Frontend:
Vercel

Backend:
Render

Database:
MongoDB Atlas

Redis:
Redis Cloud

Files:
Cloudinary

Future Production Architecture:

CloudFront
↓
Load Balancer
↓
Node.js Servers
↓
Redis
↓
MongoDB
↓
S3

---

# Resume Goal

Target Resume Bullet:

Built a real-time developer collaboration platform featuring JWT authentication, RBAC, MongoDB aggregation analytics, Redis caching, Socket.io live updates, Dockerized deployment, and CI/CD workflows.

---

# AI Assistant Instructions

When helping with this project:

1. Prioritize practical implementation.
2. Avoid unnecessary enterprise complexity.
3. Keep student constraints in mind.
4. Do not recommend microservices.
5. Do not recommend Kubernetes.
6. Do not recommend Kafka.
7. Build features incrementally.
8. Explain concepts simply when introducing new technologies.
9. Focus on resume value and interview value.
10. Prefer implementation speed over architectural perfection.

---

# Current Status

Current Phase:
Phase 1

Current Focus:

* Authentication
* Authorization
* RBAC
* Project CRUD
* Member Management
* Redux Toolkit
* Custom Hooks

Do not discuss Redis, Socket.io, Docker, CI/CD, or AWS implementation until Phase 1 is completed.


# UI / Design Guidelines

## Design Philosophy

DevCollab should look like a modern SaaS product rather than a student project.

Inspiration:

* Linear
* Notion
* GitHub Projects
* Vercel Dashboard
* Jira
* ClickUp

Preferred Style:

* Dark Mode First
* Clean Layout
* Modern SaaS Design
* Rounded Corners
* Minimal Color Palette
* Professional Appearance
* Responsive Design

Avoid:

* Bootstrap-looking layouts
* Outdated admin templates
* Excessive gradients
* Excessive animations
* Cluttered interfaces

---

## UI Stack

Frontend Styling:

* Tailwind CSS

Component Library:

* shadcn/ui

Icons:

* Lucide React

Optional:

* Framer Motion (later)

Do not use:

* Bootstrap
* Ant Design
* Material UI

unless there is a strong reason.

---

## Core Pages

### Dashboard

Contains:

* Project Summary
* Analytics Cards
* Recent Activity
* Recent Projects

---

### Project Workspace

Contains:

* Kanban Board
* Team Members
* Activity Feed
* Project Overview

---

### Analytics

Contains:

* Charts
* Team Performance
* Task Metrics
* Project Progress

---

### Team Management

Contains:

* Members Table
* Role Management
* Invite Members

---

## AI Assistant UI Instructions

When generating UI:

1. Use React.
2. Use Tailwind CSS.
3. Use shadcn/ui.
4. Use Lucide icons.
5. Follow modern SaaS design principles.
6. Generate production-quality UI.
7. Prefer reusable components.
8. Keep the design consistent across pages.
9. Use dark mode by default.
10. Design should resemble modern startup products.
