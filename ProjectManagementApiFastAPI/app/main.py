from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import auth

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

# Equivalent to app.MapControllers() picking up [Route("api/[controller]")] controllers
app.include_router(auth.router)


@app.get("/")
async def root():
    return {"status": "ok", "service": "ProjectManagementApiFastAPI"}
