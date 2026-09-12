import os
import datetime
import json
from typing import Dict, Any, Optional, List
from dotenv import load_dotenv

# Ensure environment variables are loaded
load_dotenv()
if not os.getenv("GEMINI_API_KEY"):
    parent_env = os.path.join(os.path.dirname(__file__), "..", "..", ".env")
    if os.path.exists(parent_env):
        load_dotenv(parent_env)

gemini_client = None
try:
    from google import genai
    api_key = os.getenv("GEMINI_API_KEY")
    if api_key:
        gemini_client = genai.Client(api_key=api_key)
except Exception as e:
    print(f"Warning: Could not initialize Gemini client: {e}")


def generate_heuristic_insight(latest: Dict[str, Any], history: list) -> str:
    """Fallback intelligent executive analysis when LLM API is unavailable."""
    institution = latest.get("institution", "The Institution")
    year = latest.get("year", 2015)
    rank = latest.get("world_rank", 0)
    score = latest.get("score", 0.0)

    # Determine performance tier
    if rank <= 25:
        tier_desc = "in the top-tier global elite, demonstrating outstanding competitive superiority across multiple domains."
    elif rank <= 100:
        tier_desc = "as a prestigious top-100 world-class research institution with robust global reputation."
    elif rank <= 500:
        tier_desc = "in the upper-middle echelon globally, showing solid academic competence with notable specialization strengths."
    else:
        tier_desc = "within the broader international academic spectrum, with significant opportunities for targeted structural advancement."

    # Identify best and worst KPI ranks
    kpis = [
        ("Quality of Education", latest.get("quality_of_education")),
        ("Quality of Faculty", latest.get("quality_of_faculty")),
        ("Publications", latest.get("publications")),
        ("Citations", latest.get("citations")),
        ("Influence", latest.get("influence")),
        ("Patents", latest.get("patents")),
        ("Alumni Employment", latest.get("alumni_employment")),
    ]
    valid_kpis = [(k, int(v)) for k, v in kpis if v is not None and v > 0]
    valid_kpis.sort(key=lambda x: x[1])

    strong_bullets = []
    if valid_kpis:
        for name, r in valid_kpis[:3]:
            strong_bullets.append(f"• **{name}**: Global Rank #{r}")
    else:
        strong_bullets.append("• Comprehensive multidimensional metrics maintain balanced institutional stability.")

    weak_bullets = []
    if len(valid_kpis) >= 4:
        for name, r in valid_kpis[-3:]:
            weak_bullets.append(f"• **{name}**: Global Rank #{r} (relative lag compared to core strengths)")
    else:
        weak_bullets.append("• Continuous investment recommended across research publication velocity and patent translation.")

    # Year-over-year trajectory
    trajectory_note = ""
    if len(history) > 1:
        prev = history[-2]
        delta_rank = prev.get("world_rank", rank) - rank
        delta_score = round(score - prev.get("score", score), 2)
        if delta_rank > 0:
            trajectory_note = f"Trajectory demonstrates positive momentum (+{delta_rank} rank positions gained over the previous reporting cycle)."
        elif delta_rank < 0:
            trajectory_note = f"Recent trajectory indicates mild pressure ({abs(delta_rank)} rank positions contracted), warranting strategic mitigation."
        else:
            trajectory_note = "Institutional rank held steady year-over-year."

    primary_lag = valid_kpis[-1][0] if valid_kpis else "Research Output"

    return f"""### 1. Overall Performance Assessment
**{institution}** concludes academic year **{year}** positioned at **World Rank #{rank}** with an aggregate performance score of **{score}/100**. The university operates {tier_desc} {trajectory_note}

### 2. Primary Institutional Strengths
The university demonstrates highest global standing in:
{chr(10).join(strong_bullets)}

### 3. Critical Areas Requiring Strategic Focus
Relative performance vulnerabilities are concentrated in:
{chr(10).join(weak_bullets)}

### 4. Strategic Executive Action Plan
1. **Targeted Resource Allocation for {primary_lag}**: Institute specialized funding grants and institutional partnerships directly aimed at uplifting {primary_lag} performance.
2. **Faculty Retention & Recruitment**: Preserve competitive edge in high-scoring disciplines through endowed chairs and international research consortia.
3. **Cross-Disciplinary Patent & Publication Pipeline**: Foster industry tech-transfer acceleration to convert publication volume into high-impact citations and intellectual property patents."""


def generate_ai_insight(institution: str, latest_record: Dict[str, Any], history: list) -> Dict[str, Any]:
    """Generates AI insights using Gemini 3.6 Flash with automatic heuristic fallback."""
    inst_name = latest_record.get("institution", institution)
    year = latest_record.get("year", 2015)
    source = "Gemini 3.6 Flash"
    insight_text = ""

    prompt = f"""You are an Executive University Strategy & Performance Intelligence Analyst.
Analyze the official CWUR performance metrics for:

University: {inst_name}
Year: {year}
World Rank: {latest_record.get('world_rank')}
Overall Score: {latest_record.get('score')}
Quality of Education Rank: {latest_record.get('quality_of_education')}
Quality of Faculty Rank: {latest_record.get('quality_of_faculty')}
Publications Rank: {latest_record.get('publications')}
Citations Rank: {latest_record.get('citations')}
Influence Rank: {latest_record.get('influence')}
Patents Rank: {latest_record.get('patents')}
Alumni Employment Rank: {latest_record.get('alumni_employment')}

Provide a structured, executive-level intelligence brief following exactly these headings:

### 1. Executive Performance Summary
Provide a concise, high-impact assessment based on the World Rank and Score. Distinguish clearly between rank (lower is better) and score (higher is better).

### 2. Key Competitive Strengths
Highlight the strongest metric ranks (lowest rank numbers) and what competitive edge they provide.

### 3. Critical Improvement Vectors
Identify areas with lagging ranks (higher numbers) that hinder the institution from advancing higher.

### 4. Strategic Recommendations
Provide 3 concrete, realistic management recommendations to address the identified bottlenecks and improve future ranking cycles.
"""

    if gemini_client is not None:
        try:
            response = gemini_client.models.generate_content(
                model="gemini-3.6-flash",
                contents=prompt
            )
            if response and response.text:
                insight_text = response.text.strip()
        except Exception as err:
            print(f"Gemini API call failed ({err}), falling back to Heuristic Engine.")
            insight_text = generate_heuristic_insight(latest_record, history)
            source = "Intelligent KPI Heuristic Engine"
    else:
        insight_text = generate_heuristic_insight(latest_record, history)
        source = "Intelligent KPI Heuristic Engine"

    return {
        "institution": inst_name,
        "year": int(year),
        "insight": insight_text,
        "source": source,
        "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat()
    }


def chat_with_agent(
    message: str,
    university: Optional[str] = None,
    history: Optional[List[Any]] = None,
    data_service_instance=None
) -> Dict[str, Any]:
    """Conversational AI Strategic Advisor grounded in the CWUR dataset."""
    target_inst = university
    context_str = ""

    # Attempt to resolve institution from query if not specified
    if data_service_instance:
        if not target_inst:
            for key, official_name in data_service_instance.inst_name_map.items():
                if key in message.lower() and len(key) > 3:
                    target_inst = official_name
                    break

        # Check if comparing two institutions in query
        mentioned = []
        for key, official_name in data_service_instance.inst_name_map.items():
            if key in message.lower() and len(key) > 4:
                if official_name not in mentioned:
                    mentioned.append(official_name)

        if len(mentioned) >= 2:
            inst1, inst2 = mentioned[0], mentioned[1]
            comp = data_service_instance.compare_universities(inst1, inst2)
            if comp:
                context_str += f"\n[HEAD-TO-HEAD COMPARISON DATA ({comp['year']})]:\n"
                context_str += f"{inst1} (World Rank #{comp['inst1_rank']}, Score {comp['inst1_score']}) vs {inst2} (World Rank #{comp['inst2_rank']}, Score {comp['inst2_score']})\n"
                for dim in comp["dimensions"]:
                    context_str += f" - {dim['label']}: {inst1}={dim['inst1_val']} vs {inst2}={dim['inst2_val']} (Advantage: {dim['winner']})\n"

        if target_inst:
            hist = data_service_instance.get_university_history(target_inst)
            health = data_service_instance.get_university_health(target_inst)
            if hist:
                latest = hist[-1]
                context_str += f"\n[ACTIVE INSTITUTION PROFILE: {target_inst} ({latest.get('year')})]:\n"
                context_str += f"- Country: {latest.get('country')}\n"
                context_str += f"- World Rank: #{latest.get('world_rank')}\n"
                context_str += f"- Overall Score: {latest.get('score')} / 100\n"
                context_str += f"- Quality of Education: #{latest.get('quality_of_education')}\n"
                context_str += f"- Quality of Faculty: #{latest.get('quality_of_faculty')}\n"
                context_str += f"- Publications: #{latest.get('publications')}\n"
                context_str += f"- Citations: #{latest.get('citations')}\n"
                context_str += f"- Patents: #{latest.get('patents')}\n"
                context_str += f"- Alumni Employment: #{latest.get('alumni_employment')}\n"
                if health:
                    context_str += f"- Health Tier: {health.get('tier')} ({health.get('status')} Status)\n"
                    context_str += f"- Percentile: Top {(100 - health.get('percentile', 50)):.1f}%\n"
                    context_str += f"- Primary Strengths: {', '.join(health.get('strengths', []))}\n"
                    context_str += f"- Focus Areas: {', '.join(health.get('vulnerabilities', []))}\n"

        # General dataset stats context
        stats = data_service_instance.get_stats()
        context_str += f"\n[GLOBAL CWUR DATASET CONTEXT]:\n"
        context_str += f"- 2,200 records across {stats['total_universities']} universities and {stats['total_countries']} countries.\n"
        context_str += f"- Top 5 Global Institutions: {', '.join(stats['top_institutions'][:5])}\n"

    system_prompt = f"""You are the University KPI Intelligence Strategic AI Advisor.
You advise university chancellors, provosts, and institutional research directors on academic performance, CWUR rankings, KPI dynamics, and strategic improvement roadmaps.

Always answer concisely, authoritatively, and professionally.
Ground your response in the verified data provided below:
{context_str}

Important Guidelines:
1. When discussing ranks, remember lower numbers are better (#1 is best).
2. When discussing score, higher numbers are better (100 is best).
3. If comparing universities, highlight specific metrics where each excels.
4. If asked for recommendations, provide actionable, high-impact institutional strategies (faculty grants, patent pipelines, citation networks).
5. Format key metrics and names in bold for readability.
"""

    chat_history_str = ""
    if history:
        for msg in history[-4:]:  # last 4 turns
            role = "User" if getattr(msg, "role", "user") == "user" else "Advisor"
            content = getattr(msg, "content", "")
            chat_history_str += f"{role}: {content}\n"

    full_prompt = f"{system_prompt}\n\nRecent Conversation:\n{chat_history_str}\nUser Question: {message}\nAdvisor Response:"

    reply_text = ""
    source = "Gemini 3.6 Flash"

    if gemini_client is not None:
        try:
            res = gemini_client.models.generate_content(
                model="gemini-3.6-flash",
                contents=full_prompt
            )
            if res and res.text:
                reply_text = res.text.strip()
        except Exception as err:
            print(f"Gemini chat failed ({err}), falling back to Heuristic Advisor.")
            source = "Intelligent KPI Heuristic Engine"

    if not reply_text:
        source = "Intelligent KPI Heuristic Engine"
        # Heuristic conversational logic
        q_lower = message.lower()
        if target_inst:
            if "weak" in q_lower or "improve" in q_lower or "focus" in q_lower:
                reply_text = f"Based on verified CWUR metrics for **{target_inst}**, priority improvement vectors are focused on lagging ranks: **{health.get('vulnerabilities', ['Patents', 'Citations'])[0]}**. Strategic focus should be directed toward establishing cross-institutional research consortiums and incentivizing patent filings."
            elif "strength" in q_lower or "best" in q_lower or "good" in q_lower:
                reply_text = f"**{target_inst}** excels globally with core competitive strengths in: **{', '.join(health.get('strengths', ['Quality of Education', 'Faculty']))}**. These metrics anchor the institution's position at World Rank **#{latest.get('world_rank')}**."
            else:
                reply_text = f"**{target_inst}** currently holds World Rank **#{latest.get('world_rank')}** with an aggregate score of **{latest.get('score')}/100** ({health.get('tier', 'Elite Tier')}). Its performance is driven by high-impact standing across education, research publication velocity, and citation volume."
        else:
            reply_text = f"The University KPI Intelligence platform monitors **2,200 verified records** across **1,024 global universities**. The top 3 ranked institutions globally are **Harvard University**, **MIT**, and **Stanford University**. You can ask me to evaluate any institution, compare two universities, or assess specific KPI dimensions."

    return {
        "reply": reply_text,
        "source": source,
        "context_institution": target_inst,
        "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat()
    }
