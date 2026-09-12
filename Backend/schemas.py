from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class StatsSummary(BaseModel):
    total_records: int
    total_universities: int
    total_countries: int
    years: List[int]
    top_institutions: List[str]
    score_distribution: Dict[str, int]


class SearchSuggestion(BaseModel):
    institution: str
    country: str
    latest_rank: int
    latest_score: float
    latest_year: int


class UniversityRecord(BaseModel):
    world_rank: int
    institution: str
    country: str
    national_rank: Optional[int] = None
    quality_of_education: Optional[int] = None
    alumni_employment: Optional[int] = None
    quality_of_faculty: Optional[int] = None
    publications: Optional[int] = None
    influence: Optional[int] = None
    citations: Optional[int] = None
    broad_impact: Optional[int] = None
    patents: Optional[int] = None
    score: float
    year: int


class TrendPoint(BaseModel):
    year: int
    world_rank: int
    score: float
    rank_change: int
    score_change: float


class HealthSummary(BaseModel):
    institution: str
    year: int
    score: float
    world_rank: int
    status: str  # "Green", "Yellow", "Red"
    tier: str    # e.g., "Tier 1 - Global Elite", "Tier 2 - High Performing", etc.
    percentile: float
    strengths: List[str]
    vulnerabilities: List[str]


class AIInsightResponse(BaseModel):
    institution: str
    year: int
    insight: str
    source: str  # "Gemini 3.6 Flash" or "Intelligent KPI Heuristic Engine"
    timestamp: Optional[str] = None


class ComparisonDimension(BaseModel):
    kpi: str
    label: str
    inst1_val: Optional[float]
    inst2_val: Optional[float]
    winner: Optional[str]
    is_rank_based: bool


class ComparisonResponse(BaseModel):
    inst1: str
    inst2: str
    year: int
    inst1_rank: int
    inst2_rank: int
    inst1_score: float
    inst2_score: float
    dimensions: List[ComparisonDimension]


class RankingsResponse(BaseModel):
    total: int
    page: int
    page_size: int
    total_pages: int
    year: int
    country: Optional[str] = None
    results: List[UniversityRecord]


class ChatMessage(BaseModel):
    role: str  # "user" or "model"
    content: str


class ChatRequest(BaseModel):
    message: str
    university: Optional[str] = None
    history: Optional[List[ChatMessage]] = []


class ChatResponse(BaseModel):
    reply: str
    source: str
    context_institution: Optional[str] = None
    timestamp: str
