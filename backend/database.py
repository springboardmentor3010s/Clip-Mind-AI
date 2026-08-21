import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base
from sqlalchemy.orm import sessionmaker

# 🟢 Docker-ல் இயங்கும்போது host.docker.internal எடுக்கும், Local-ல் இயங்கும்போது localhost எடுக்கும்
DEFAULT_DB_URL = "postgresql://postgres:0123456789@host.docker.internal:5432/clipmindai"
DATABASE_URL = os.getenv("DATABASE_URL", DEFAULT_DB_URL)

engine = create_engine(DATABASE_URL)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()