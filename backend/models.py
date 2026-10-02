import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from .database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    projects = relationship("Project", back_populates="owner", cascade="all, delete-orphan")


class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    title = Column(String(150), nullable=False, default="Untitled Dataset.sav")
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    owner = relationship("User", back_populates="projects")
    datasets = relationship("Dataset", back_populates="project", cascade="all, delete-orphan")
    saved_outputs = relationship("SavedOutput", back_populates="project", cascade="all, delete-orphan")


class Dataset(Base):
    __tablename__ = "datasets"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=True)
    name = Column(String(150), nullable=False, default="DataSet1")
    variables_meta = Column(JSON, nullable=False)  # [{name, type, width, decimals, label, values, missing, columns, align, measure, role}]
    rows_data = Column(JSON, nullable=False)       # list of dicts: [{id: 1, salary: 57000, ...}]
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    project = relationship("Project", back_populates="datasets")
    analysis_results = relationship("AnalysisResult", back_populates="dataset", cascade="all, delete-orphan")


class AnalysisResult(Base):
    __tablename__ = "analysis_results"

    id = Column(Integer, primary_key=True, index=True)
    dataset_id = Column(Integer, ForeignKey("datasets.id"), nullable=True)
    analysis_type = Column(String(50), nullable=False) # descriptives, frequencies, crosstabs, correlations, etc.
    parameters = Column(JSON, nullable=True)
    output_data = Column(JSON, nullable=False)
    syntax = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    dataset = relationship("Dataset", back_populates="analysis_results")


class SavedOutput(Base):
    __tablename__ = "saved_outputs"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=True)
    title = Column(String(150), nullable=False, default="Output Document")
    items = Column(JSON, nullable=False) # list of output tree items with tables & charts
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    project = relationship("Project", back_populates="saved_outputs")
