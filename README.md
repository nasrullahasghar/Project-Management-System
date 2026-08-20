# Project Management System

A full-stack project management application (mini Jira/Asana) supporting project creation, task management, team collaboration, and reporting.

**Stack:** Angular 21 (frontend) · FastAPI (backend) · PostgreSQL (database)

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Features](#features)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
  - [1. Database Setup](#1-database-setup)
  - [2. Backend Setup (FastAPI)](#2-backend-setup-fastapi)
  - [3. Frontend Setup (Angular)](#3-frontend-setup-angular)
- [Environment Variables](#environment-variables)
- [API Overview](#api-overview)
- [Authentication & Roles](#authentication--roles)
- [Reports](#reports)
- [Running Tests](#running-tests)
- [Deployment](#deployment)
- [Roadmap / Nice-to-Have](#roadmap--nice-to-have)
- [License](#license)

---

## Overview

This application allows organizations to manage projects, assign and track tasks, organize teams, and generate reports on progress and performance. It was originally built with a .NET 8 backend and has since been fully ported to **FastAPI**, while keeping the same Angular frontend and PostgreSQL schema unchanged — so the API contract (JSON shapes, routes, and behavior) mirrors what the frontend already expects.

## Tech Stack

**Frontend**
- Angular 21 — standalone components, zoneless change detection (signals-based state)
- Angular Material v3 (Material 3) with a custom brand theme
- Chart.js for report visualizations
- jsPDF + html2canvas-pro for PDF export
- CSV export via a lightweight helper

**Backend**
- FastAPI
- SQLAlchemy (async, `asyncpg` driver)
- Pydantic v2 with `pydantic-settings`
- `python-jose` for JWT (HS256)
- `passlib` / `bcrypt` for password hashing
- Uvicorn as the ASGI server

**Database**
- PostgreSQL 18

**Tooling**
- Git / GitHub
- Conda environment for Python dependency management

## Features

- **Authentication Module** — Registration, login, JWT-based authentication, role-based access control
- **Dashboard Module** — Overview of project statistics and key metrics
- **Project Management Module** — Full CRUD for projects
- **Task Management Module** — Full CRUD for tasks within projects
- **Team Management Module** — Add/manage team members and per-project roles
- **Reports Module** — Project Progress, Task Completion (over time), Team Performance, and Global Breakdown reports, with PDF and CSV export

## Project Structure

```
ProjectManagementApp/
├── ProjectManagementApiFastAPI/     # FastAPI backend
│   └── app/
│       ├── core/                    # config, security, dependencies
│       ├── database/                # database.py, models.py
│       ├── utils/                   # datetime_utils.py, etc.
│       ├── schemas/                 # Pydantic schemas (one file per resource)
│       └── routers/                 # API routes (one file per resource)
└── ProjectManagementFrontEnd/       # Angular frontend
    └── src/app/
        ├── auth/
        ├── dashboard/
        ├── projects/
        ├── tasks/
        ├── team/
        └── reports/
```

## Prerequisites

- Python 3.11+
- Node.js and Angular CLI 21+
- PostgreSQL 18
- Git

## Getting Started

### 1. Database Setup

1. Install PostgreSQL and ensure the server is running.
2. Create the database:
   ```sql
   CREATE DATABASE projectmanagementdb;
   ```
3. Update the connection details in the backend `.env` file (see [Environment Variables](#environment-variables)).
4. Run migrations / table creation and, optionally, seed initial data (see backend README/scripts for the seed command).

### 2. Backend Setup (FastAPI)

```bash
cd ProjectManagementApiFastAPI

# create and activate a virtual environment (conda example)
conda create -n fastapi_env python=3.11
conda activate fastapi_env

# install dependencies
pip install -r requirements.txt

# copy and configure environment variables
cp .env.example .env

# run the development server
uvicorn app.main:app --reload
```

The API will be available at `http://localhost:8000`, with interactive docs at `http://localhost:8000/docs`.

### 3. Frontend Setup (Angular)

```bash
cd ProjectManagementFrontEnd

npm install

ng serve
```

The app will be available at `http://localhost:4200`.

## Environment Variables

Backend `.env` (example):

```
DATABASE_URL=postgresql+asyncpg://postgres:<password>@localhost:5432/projectmanagementdb
JWT_SECRET_KEY=<your-secret-key>
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
```

## API Overview

All endpoints return camelCase JSON to match the Angular frontend's existing services.

| Resource     | Endpoints |
|--------------|-----------|
| Auth         | `POST /auth/register`, `POST /auth/login` |
| Projects     | `GET /projects`, `GET /projects/{id}`, `POST /projects`, `PUT /projects/{id}`, `DELETE /projects/{id}` |
| Tasks        | `GET /tasks`, `GET /tasks/{id}`, `POST /tasks`, `PUT /tasks/{id}`, `DELETE /tasks/{id}` |
| Team Members | `GET /team-members`, `POST /team-members`, `PUT /team-members/{id}`, `DELETE /team-members/{id}` |
| Users        | `GET /users`, `GET /users/{id}`, `PUT /users/{id}` |
| Reports      | `GET /reports/project-progress`, `GET /reports/task-completion`, `GET /reports/team-performance`, `GET /reports/global-breakdown` |

Full interactive documentation is available at `/docs` (Swagger UI) once the backend is running.

## Authentication & Roles

- Authentication uses **JWT** (HS256), issued on login and validated on protected routes.
- Two layers of role-based access control:
  - **Global role** on `Users`: `Admin`, `ProjectManager`, `TeamMember`
  - **Per-project role** on `TeamMembers`: scoped permissions within a specific project
- Protected routes use dependency-based checks equivalent to `[Authorize]` / `[Authorize(Roles = "...")]` in a typical ASP.NET setup — implemented in FastAPI via `get_current_user_claims` and `require_roles(*roles)` dependencies.

## Reports

Four report types are available, viewed per-project from the Projects list:

1. **Project Progress**
2. **Task Completion** (over time)
3. **Team Performance**
4. **Global Breakdown**

Reports are rendered with Chart.js and can be exported as:
- **PDF** (via jsPDF + html2canvas-pro)
- **CSV**

## Running Tests

```bash
cd ProjectManagementApiFastAPI
pytest
```

## Deployment

- Backend: deploy the FastAPI app with Uvicorn/Gunicorn behind a reverse proxy (e.g., Nginx), or containerize with Docker.
- Frontend: build with `ng build` and serve the static output via any static file host or reverse proxy.
- Ensure environment variables (database URL, JWT secret) are set securely for production.

## Roadmap / Nice-to-Have

- [ ] Docker containerization
- [ ] CI/CD pipeline (GitHub Actions)
- [ ] Cloud deployment (Azure / AWS / GCP)
- [ ] Gantt charts for project timelines
- [ ] Notifications
- [ ] Role-based dashboards
- [ ] Forgot-password flow
- [ ] Advanced search and filtering
- [ ] Third-party integrations (Slack, email)

## License

This project was developed as an internship deliverable at Netsole Technologies.
