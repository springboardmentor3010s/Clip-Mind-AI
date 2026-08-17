import pytest # pyright: ignore[reportMissingImports]
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.core.database import Base, get_db
from app.core.config import settings

engine = create_engine(settings.DATABASE_URL)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="session", autouse=True)
def setup_database():
    Base.metadata.create_all(bind=engine)
    yield


@pytest.fixture(scope="session")
def test_client():
    with TestClient(app) as c:
        yield c


@pytest.fixture()
def db_session():
    connection = engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)
    yield session
    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture()
def client(test_client, db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    yield test_client
    app.dependency_overrides.clear()


@pytest.fixture()
def mongo_cleanup():
    """Track Mongo doc ids/video_ids to clean up after a test."""
    from app.core.mongo import transcripts_collection

    created_video_ids = []
    yield created_video_ids
    import asyncio

    async def _cleanup():
        for vid in created_video_ids:
            await transcripts_collection.delete_many({"video_id": str(vid)})

    asyncio.run(_cleanup())