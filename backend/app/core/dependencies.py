from typing import Generator
from app.database import SessionLocal


def get_db() -> Generator:
    """
    Dependency function to yield a database session and ensure it is closed 
    properly once the request is complete.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
