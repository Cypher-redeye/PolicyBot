from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from app.core.config import settings

# Create engine
engine = create_engine(
    settings.DATABASE_URL,
    # pool_pre_ping is useful to verify connection health
    pool_pre_ping=True
)

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Declarative base class
Base = declarative_base()
