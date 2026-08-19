from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.routers import( auth , projects , 
                        tasks ,team_members,
                        users , reports
                        )

app = FastAPI(
    title="Project Management API (FastAPI)",
    description="FastAPI port of the ProjectManagementApi .NET backend.",
    version="1.0.0",
)

# Equivalent to the "AllowAngularDev" CORS policy in Program.cs
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_origin],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(projects.router)
app.include_router(tasks.router)
app.include_router(team_members.router)
app.include_router(users.router)
app.include_router(reports.router)

@app.get("/")
async def root():
    return {"status": "ok", "service": "ProjectManagementApiFastAPI"}
