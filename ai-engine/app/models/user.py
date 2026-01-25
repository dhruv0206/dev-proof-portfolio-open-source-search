from sqlalchemy import Column, String, DateTime, Boolean, Date, Integer
from app.database import Base

class User(Base):
    __tablename__ = "user"

    id = Column(String, primary_key=True)
    name = Column(String)
    email = Column(String)
    image = Column(String)
    createdAt = Column(DateTime) # BetterAuth standard
    updatedAt = Column(DateTime)
    
    # GitHub Fields (Mapped from lib/auth.ts)
    githubUsername = Column(String)
    githubId = Column(Integer)
    company = Column(String)
    blog = Column(String)
    location = Column(String)
    bio = Column(String)
    twitterUsername = Column(String)
    publicRepos = Column(Integer)
    followers = Column(Integer)
    following = Column(Integer)
    hireable = Column(Boolean)
