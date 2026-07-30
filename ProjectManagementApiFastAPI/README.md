# ProjectManagementApiFastAPI

FastAPI port of the `ProjectManagementApi` .NET backend. Shares the same
PostgreSQL database (`projectmanagementdb`) — no schema changes, no data
migration needed. The Angular frontend is unaffected by this backend swap.

## Status: Foundation phase complete

- [x] SQLAlchemy models (User, Project, TaskItem, TeamMember, ActivityLog) — mirror the existing DB schema exactly
- [x] JWT auth (HS256) — same issuer/audience/expiry pattern as the .NET config
- [x] Password hashing — bcrypt, compatible with existing `BCrypt.Net-Next` hashes
- [x] `/api/auth/register` and `/api/auth/login` — direct port of `AuthController.cs`
- [x] CORS configured for the Angular dev server
- [x] Unit tests (no DB required) + integration tests (require live Postgres)
- [ ] Projects CRUD
- [ ] Tasks CRUD
- [ ] TeamMembers endpoints
- [ ] Reports/analytics endpoints

## Setup

```bash
cd ProjectManagementApiFastAPI
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env
# Edit .env: set your real Postgres password and a real JWT secret
```

## Run

```bash
uvicorn app.main:app --reload --port 8000
```

- Swagger UI: http://localhost:8000/docs
- Same "Authorize" padlock button as your .NET Swagger — paste a token from
  `/api/auth/login` to test protected routes once they exist.

## Test

```bash
# Fast unit tests - no DB needed
pytest tests/test_auth_utils.py -v

# Integration tests - needs Postgres running and .env configured
pytest tests/test_auth_api.py -v

# Everything
pytest -v
```

## Project layout

```
app/
  main.py           FastAPI app + CORS + router registration (~ Program.cs)
  config.py         Settings loaded from .env (~ appsettings.json)
  database.py       Async engine/session (~ AppDbContext)
  models.py         SQLAlchemy models (~ Models/*.cs)
  auth_utils.py      Password hashing, JWT create/verify, role-check dependency
  schemas/
    auth.py         Pydantic request/response schemas (~ DTOs)
  routers/
    auth.py         /api/auth/register, /api/auth/login (~ AuthController.cs)
tests/
  test_auth_utils.py   Unit tests (hashing, JWT) - no DB
  test_auth_api.py     Integration tests - hits real endpoints against Postgres
```
