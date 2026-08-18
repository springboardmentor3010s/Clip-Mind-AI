from app.core.database import engine, Base
from app.models.video import VideoMetadata

# Drop table and recreate with full schema
print("Dropping old table structure...")
VideoMetadata.__table__.drop(bind=engine, checkfirst=True)

print("Creating table with updated schema...")
Base.metadata.create_all(bind=engine)

print("Database synced successfully!")