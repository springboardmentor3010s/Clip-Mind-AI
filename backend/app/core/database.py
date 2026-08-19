import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import sessionmaker, declarative_base

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

if DATABASE_URL and DATABASE_URL.startswith("sqlite"):
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
else:
    engine = create_engine(DATABASE_URL)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base = declarative_base()


def ensure_column(table_name: str, column_name: str, column_type_sql: str):
    """Adds a column to an existing table if it's missing.

    There's no Alembic (or any migration tool) in this project — schema changes
    are applied via Base.metadata.create_all, which only creates missing tables
    and never alters existing ones. This keeps a table someone already has on
    disk (e.g. a committed/shared sqlite file) in sync with the models without
    requiring anyone to run a manual ALTER TABLE by hand.
    """
    inspector = inspect(engine)
    if table_name not in inspector.get_table_names():
        return
    existing_columns = {c["name"] for c in inspector.get_columns(table_name)}
    if column_name in existing_columns:
        return
    with engine.begin() as conn:
        conn.execute(text(f"ALTER TABLE {table_name} ADD COLUMN {column_name} {column_type_sql}"))
