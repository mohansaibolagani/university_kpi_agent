from typing import List, Optional
from fastapi import FastAPI, HTTPException, Query, Response
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from schemas import (
    StatsSummary,
    SearchSuggestion,
    UniversityRecord,
    TrendPoint,
    HealthSummary,
    AIInsightResponse,
    ComparisonResponse,
    RankingsResponse,
    ChatRequest,
    ChatResponse,
)
from services.data_service import data_service
from services.ai_service import generate_ai_insight, chat_with_agent
from services.pdf_service import generate_university_pdf

load_dotenv()

app = FastAPI(
    title="University KPI Intelligence Agent API",
    description="Enterprise API for Global University Performance Metrics, KPI Trends, Comparative Benchmarking, AI Chatbot & Executive PDF Dossiers.",
    version="2.1.0",
)

# Enhanced CORS for local dev and production
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "*"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/", tags=["System"])
def root():
    return {
        "name": "University KPI Intelligence Platform API",
        "status": "operational",
        "version": "2.1.0",
        "dataset_records": len(data_service.df),
        "docs_url": "/docs"
    }


@app.get("/stats", response_model=StatsSummary, tags=["Analytics"])
def get_stats():
    return data_service.get_stats()


@app.get("/kpis", tags=["Analytics"])
def get_kpis():
    return {
        "kpis": [
            {"key": "world_rank", "label": "World Rank", "unit": "Rank", "direction": "lower_is_better"},
            {"key": "score", "label": "Overall Score", "unit": "Score (0-100)", "direction": "higher_is_better"},
            {"key": "quality_of_education", "label": "Quality of Education", "unit": "Rank", "direction": "lower_is_better"},
            {"key": "quality_of_faculty", "label": "Quality of Faculty", "unit": "Rank", "direction": "lower_is_better"},
            {"key": "publications", "label": "Publications", "unit": "Rank", "direction": "lower_is_better"},
            {"key": "citations", "label": "Citations", "unit": "Rank", "direction": "lower_is_better"},
            {"key": "influence", "label": "Influence", "unit": "Rank", "direction": "lower_is_better"},
            {"key": "patents", "label": "Patents", "unit": "Rank", "direction": "lower_is_better"},
            {"key": "alumni_employment", "label": "Alumni Employment", "unit": "Rank", "direction": "lower_is_better"},
        ]
    }


@app.get("/countries", response_model=List[str], tags=["Analytics"])
def get_countries():
    return data_service.get_countries()


@app.get("/universities/search", response_model=List[SearchSuggestion], tags=["Universities"])
def search_universities(
    query: str = Query("", description="Search term for university name"),
    limit: int = Query(8, ge=1, le=50, description="Max results to return"),
):
    return data_service.search_universities(query=query, limit=limit)


@app.get("/rankings", response_model=RankingsResponse, tags=["Universities"])
def get_rankings(
    year: Optional[int] = Query(None, description="Ranking year (e.g. 2015)"),
    country: Optional[str] = Query(None, description="Filter by country"),
    sort_by: str = Query("world_rank", description="Field to sort by"),
    order: str = Query("asc", description="Sort order: asc or desc"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=5, le=100, description="Items per page"),
):
    return data_service.get_rankings(
        year=year,
        country=country,
        sort_by=sort_by,
        order=order,
        page=page,
        page_size=page_size,
    )


@app.get("/university/{institution}", response_model=List[UniversityRecord], tags=["Universities"])
def get_university(institution: str):
    records = data_service.get_university_history(institution)
    if not records:
        raise HTTPException(
            status_code=404,
            detail=f"University '{institution}' not found in dataset."
        )
    return records


@app.get("/university/{institution}/trend", response_model=List[TrendPoint], tags=["Universities"])
def get_university_trend(institution: str):
    trend = data_service.get_university_trend(institution)
    if not trend:
        raise HTTPException(
            status_code=404,
            detail=f"Trend data for '{institution}' not found."
        )
    return trend


@app.get("/health/{institution}", response_model=HealthSummary, tags=["Universities"])
def get_health(institution: str):
    health = data_service.get_university_health(institution)
    if not health:
        raise HTTPException(
            status_code=404,
            detail=f"Health metrics for '{institution}' not found."
        )
    return health


@app.get("/compare", response_model=ComparisonResponse, tags=["Analytics"])
def compare_universities(
    inst1: str = Query(..., description="First institution name"),
    inst2: str = Query(..., description="Second institution name"),
    year: Optional[int] = Query(None, description="Target year for comparison"),
):
    comp = data_service.compare_universities(inst1, inst2, year)
    if not comp:
        raise HTTPException(
            status_code=404,
            detail="One or both universities could not be found for comparison."
        )
    return comp


@app.get("/ai-insight/{institution}", response_model=AIInsightResponse, tags=["AI Advisory"])
def get_ai_insight(institution: str):
    records = data_service.get_university_history(institution)
    if not records:
        raise HTTPException(
            status_code=404,
            detail=f"University '{institution}' not found."
        )

    latest = records[-1]
    return generate_ai_insight(institution, latest, records)


@app.post("/chat", response_model=ChatResponse, tags=["AI Advisory"])
def chat(payload: ChatRequest):
    return chat_with_agent(
        message=payload.message,
        university=payload.university,
        history=payload.history,
        data_service_instance=data_service,
    )


@app.get("/university/{institution}/pdf", tags=["Reports"])
def export_university_pdf(institution: str):
    records = data_service.get_university_history(institution)
    if not records:
        raise HTTPException(
            status_code=404,
            detail=f"University '{institution}' not found."
        )

    latest = records[-1]
    resolved_name = latest["institution"]
    health = data_service.get_university_health(resolved_name)
    trend = data_service.get_university_trend(resolved_name)
    insight = generate_ai_insight(resolved_name, latest, records)

    pdf_bytes = generate_university_pdf(
        history=records,
        health=health,
        trend=trend,
        ai_insight=insight,
    )

    clean_filename = f"{resolved_name.replace(' ', '_')}_KPI_Dossier_{latest['year']}.pdf"

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{clean_filename}"'
        },
    )


@app.get("/countries/power-index", tags=["Analytics"])
def get_country_power_index(year: Optional[int] = Query(None, description="Assessment cycle year")):
    return data_service.get_country_power_index(year=year)


@app.get("/university/{institution}/radar", tags=["Universities"])
def get_university_radar(institution: str):
    benchmarks = data_service.get_radar_benchmarks(institution)
    if not benchmarks:
        raise HTTPException(
            status_code=404,
            detail=f"Radar data for '{institution}' not found."
        )
    return benchmarks


@app.post("/university/{institution}/simulate", tags=["Analytics"])
def simulate_university_kpi(institution: str, adjustments: dict):
    result = data_service.simulate_university_kpis(institution, adjustments)
    if not result:
        raise HTTPException(
            status_code=404,
            detail=f"University '{institution}' not found for simulation."
        )
    return result


@app.get("/university/{institution}/roi-strategy", tags=["Analytics"])
def get_university_roi_strategy(
    institution: str,
    budget_tier: str = Query("moderate", description="Capital tier: conservative ($15M), moderate ($45M), aggressive ($100M)")
):
    result = data_service.get_roi_strategy(institution, budget_tier=budget_tier)
    if not result:
        raise HTTPException(
            status_code=404,
            detail=f"ROI optimization model for '{institution}' not found."
        )
    return result