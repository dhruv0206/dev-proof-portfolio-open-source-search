from sqlalchemy import Column, String, DateTime, Boolean, Date, Integer, JSON
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
    discoverable = Column(Boolean, default=False)  # Visible to hiring companies

    # Recruiter-facing profile fields
    openToWork = Column(Boolean, default=False)
    preferredRoles = Column(JSON, default=list)       # e.g. ["Backend Engineer", "Fullstack"]
    workType = Column(String)                          # "remote" | "hybrid" | "onsite"
    yearsOfExperience = Column(String)                 # "0-2" | "2-5" | "5-10" | "10+"
    timezone = Column(String)                          # e.g. "America/New_York"
    linkedinUrl = Column(String)
    workExperience = Column(JSON, default=list)        # [{company, role, startDate, endDate}]
