from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy.pool import NullPool

from app.config import settings

# The engine is the equivalent of the connection pool EF Core manages for you
# behind AddDbContext(...). echo=True logs SQL statements while we're developing
# and debugging - equivalent to EF Core's sensitive/detailed logging.
#
# poolclass=NullPool: asyncpg connections are tied to the asyncio event loop
# they were created in. Under normal uvicorn usage there's one event loop for
# the whole app's lifetime, so pooling is fine. But under pytest-asyncio, each
# test function gets its OWN event loop by default - reusing a pooled
# connection from a previous test's loop causes
# "cannot perform operation: another operation is in progress". NullPool opens
# a fresh connection per checkout instead of reusing one across loops.
engine = create_async_engine(settings.database_url, echo=True, poolclass=NullPool)

# async_sessionmaker gives us a new AsyncSession per request, the same way
# EF Core gives each HTTP request its own AppDbContext instance.
AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)


class Base(DeclarativeBase):
    """Equivalent to the implicit base that DbContext gives every EF Core entity."""
    pass


async def get_db():
    """
    FastAPI dependency that yields a DB session and guarantees it's closed
    afterward - equivalent to how ASP.NET Core injects a scoped AppDbContext
    into each controller automatically.
    """
    async with AsyncSessionLocal() as session:
        yield session
