import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# Database URL from environment (PostgreSQL by default in production/docker)
# Local fallback to SQLite if PostgreSQL is not available
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./spss_studio.db")

# If using PostgreSQL in docker, URL format: postgresql://postgres:postgres@db:5432/spss_studio
if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
else:
    engine = create_engine(DATABASE_URL, pool_pre_ping=True)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
