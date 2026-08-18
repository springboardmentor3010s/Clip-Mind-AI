import os
import shutil
import sqlite3
import datetime
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# Database connection handling with support for PostgreSQL and fallback SQLite
SQL_HOST = os.getenv("SQL_HOST")
SQL_USER = os.getenv("SQL_USER")
SQL_PASSWORD = os.getenv("SQL_PASSWORD")
SQL_DB_NAME = os.getenv("SQL_DB_NAME")
DATABASE_URL = os.getenv("DATABASE_URL")

if SQL_HOST and SQL_USER and SQL_PASSWORD and SQL_DB_NAME:
    # Google Cloud SQL or custom PostgreSQL configuration
    DB_URI = f"postgresql://{SQL_USER}:{SQL_PASSWORD}@{SQL_HOST}/{SQL_DB_NAME}"
elif DATABASE_URL:
    DB_URI = DATABASE_URL
else:
    # Default file-based database for local execution and quick bootstrap
    DB_URI = "sqlite:///./clipmind.db"

SQLITE_FILE = "./clipmind.db"


def _self_heal_sqlite_file():
    """
    Guards against a corrupted local SQLite file (e.g. from a hard-killed
    process during a write). If the file exists but fails an integrity
    check, it is quarantined and a brand new file takes its place so the
    app can boot instead of failing every login/upload with a disk-image
    error. Also cleans up any stray -wal/-shm files from an unclean exit.
    """
    if not DB_URI.startswith("sqlite") or not os.path.exists(SQLITE_FILE):
        return

    is_corrupt = False
    try:
        conn = sqlite3.connect(SQLITE_FILE)
        cur = conn.cursor()
        cur.execute("PRAGMA integrity_check;")
        result = cur.fetchone()
        if not result or result[0] != "ok":
            is_corrupt = True
        conn.close()
    except sqlite3.DatabaseError:
        is_corrupt = True

    if is_corrupt:
        timestamp = datetime.datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        quarantine_path = f"{SQLITE_FILE}.corrupt_{timestamp}"
        try:
            shutil.move(SQLITE_FILE, quarantine_path)
            print(
                f"[DATABASE] clipmind.db was corrupted and could not be read. "
                f"Moved it to {quarantine_path} and starting fresh with a new database "
                f"(demo accounts will be reseeded automatically).",
                flush=True,
            )
        except Exception as e:
            print(f"[DATABASE] Failed to quarantine corrupt database file: {e}", flush=True)

    for suffix in ("-wal", "-shm"):
        stray = f"{SQLITE_FILE}{suffix}"
        if os.path.exists(stray):
            try:
                os.remove(stray)
            except Exception:
                pass


_self_heal_sqlite_file()

connect_args = {"check_same_thread": False} if DB_URI.startswith("sqlite") else {}

engine = create_engine(DB_URI, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
