import uuid
from sqlalchemy import Column, DateTime, ForeignKey, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base


class Document(Base):
    __tablename__ = "documents"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    filename = Column(String, nullable=False)
    storage_path = Column(String, nullable=False)  # Supabase Storage path (was: filepath)
    status = Column(String, default="uploaded", index=True)  # uploaded, indexed, failed
    created_at = Column(DateTime, default=func.now(), nullable=False)

    # Relationship to user
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    owner = relationship("User", back_populates="documents")
