from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
from google import genai
from dotenv import load_dotenv
import os

load_dotenv()

client = genai.Client(
    api_key=os.getenv("GEMINI_API_KEY")
)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

data = pd.read_csv("cwurData.csv")


@app.get("/")
def home():
    return {
        "message": "University KPI Agent Backend is Running"
    }


@app.get("/data")
def get_data():
    return data.head(10).to_dict(orient="records")


@app.get("/stats")
def get_stats():
    return {
        "total_records": len(data),
        "total_universities": data["institution"].nunique(),
        "total_countries": data["country"].nunique(),
        "years": sorted(data["year"].unique().tolist())
    }


@app.get("/kpis")
def get_kpis():
    return {
        "kpis": [
            "world_rank",
            "quality_of_education",
            "alumni_employment",
            "quality_of_faculty",
            "publications",
            "influence",
            "citations",
            "broad_impact",
            "patents",
            "score"
        ]
    }
@app.get("/university/{institution}")
def get_university(institution: str):
    result = data[
        data["institution"].astype(str).str.lower() == institution.lower()
    ]

    if result.empty:
        return {
            "message": "University not found"
        }

    result = result.fillna(0)

    return result.to_dict(orient="records")
@app.get("/university/{institution}/trend")
def get_university_trend(institution: str):
    result = data[
        data["institution"].astype(str).str.lower() == institution.lower()
    ].copy()

    if result.empty:
        return {
            "message": "University not found"
        }

    result = result.sort_values("year")

    trend = []

    for i in range(len(result)):
        row = result.iloc[i]

        item = {
            "year": int(row["year"]),
            "world_rank": int(row["world_rank"]),
            "score": float(row["score"])
        }

        if i > 0:
            previous = result.iloc[i - 1]

            item["rank_change"] = int(
                previous["world_rank"] - row["world_rank"]
            )

            item["score_change"] = float(
                row["score"] - previous["score"]
            )
        else:
            item["rank_change"] = 0
            item["score_change"] = 0

        trend.append(item)

    return trend
@app.get("/health/{institution}")
def get_health(institution: str):

    result = data[
        data["institution"].astype(str).str.lower() == institution.lower()
    ].copy()

    if result.empty:
        return {
            "message": "University not found"
        }

    latest = result.sort_values("year").iloc[-1]

    score = float(latest["score"])
    world_rank = int(latest["world_rank"])

    if score >= 80:
        status = "Green"
    elif score >= 60:
        status = "Yellow"
    else:
        status = "Red"

    return {
        "institution": latest["institution"],
        "year": int(latest["year"]),
        "score": score,
        "world_rank": world_rank,
        "status": status
    }
@app.get("/ai-insight/{institution}")
def get_ai_insight(institution: str):

    result = data[
        data["institution"].astype(str).str.lower() == institution.lower()
    ].copy()

    if result.empty:
        return {
            "message": "University not found"
        }

    result = result.sort_values("year")
    latest = result.iloc[-1]

    prompt = f"""
You are an AI University Performance Analyst.

Analyze the university performance data provided below.

University: {latest["institution"]}
Year: {latest["year"]}
World Rank: {latest["world_rank"]}
Score: {latest["score"]}
Quality of Education Rank: {latest["quality_of_education"]}
Quality of Faculty Rank: {latest["quality_of_faculty"]}
Publications Rank: {latest["publications"]}
Citations Rank: {latest["citations"]}
Patents Rank: {latest["patents"]}

Important rules:
1. Use ONLY the values provided above.
2. Do not invent statistics, facts, or comparisons.
3. For rank-based metrics, a lower rank means better performance.
4. For Score, a higher value means better performance.
5. Do not claim actual publication counts, citation counts, revenue,
   commercialization, industry partnerships, or other information
   because those values are not provided.
6. Clearly distinguish between the university's ranking and its score.
7. Keep the analysis concise and suitable for university management.

Give the response in exactly this structure:

1. Overall Performance
Give a short assessment based only on World Rank and Score.

2. Strong Areas
Mention the strongest provided KPI ranks.

3. Areas Needing Attention
Mention the provided KPI areas that have relatively higher
(worse) ranks compared with the other provided KPI ranks.

4. Actionable Recommendation
Give one practical recommendation directly related to the
area needing attention.

Do not make unsupported claims.
"""

    response = client.models.generate_content(
        model="gemini-3.6-flash",
        contents=prompt
    )

    return {
        "institution": latest["institution"],
        "year": int(latest["year"]),
        "insight": response.text
    }