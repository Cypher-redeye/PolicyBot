import uvicorn
from app.app import app
from app.database import Base, engine

Base.metadata.create_all(bind=engine)

if __name__ == "__main__":
    uvicorn.run("app.app:app", host="0.0.0.0", port=8000, reload=True)
