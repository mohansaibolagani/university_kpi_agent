import os
from typing import List, Dict, Any, Optional
import pandas as pd
import numpy as np


class DataService:
    def __init__(self, csv_path: str = "cwurData.csv"):
        if not os.path.exists(csv_path):
            alt_path = os.path.join(os.path.dirname(__file__), "..", "cwurData.csv")
            if os.path.exists(alt_path):
                csv_path = alt_path
            else:
                alt_path2 = os.path.join("Backend", "cwurData.csv")
                if os.path.exists(alt_path2):
                    csv_path = alt_path2

        self.df = pd.read_csv(csv_path)

        # Standard cleanings
        self.df["institution"] = self.df["institution"].astype(str).str.strip()
        self.df["country"] = self.df["country"].astype(str).str.strip()
        self.df["year"] = self.df["year"].astype(int)
        self.df["world_rank"] = self.df["world_rank"].astype(int)
        self.df["score"] = self.df["score"].astype(float)

        # Fast lookup mapping: lowercase -> official institution name
        self.inst_name_map = {}
        for inst in self.df["institution"].unique():
            self.inst_name_map[inst.lower()] = inst

        # Latest year per institution cache
        self.latest_records = (
            self.df.sort_values(["institution", "year"], ascending=[True, False])
            .groupby("institution")
            .first()
            .reset_index()
        )

    def resolve_institution_name(self, query: str) -> Optional[str]:
        import re
        # Strip trailing and leading punctuation (e.g. '.', '?', '!', etc.)
        q_clean = re.sub(r"^[^\w\s]+|[^\w\s]+$", "", query.strip()).strip().lower()
        if not q_clean:
            return None

        # 1. Exact match
        if q_clean in self.inst_name_map:
            return self.inst_name_map[q_clean]

        # 2. Bidirectional inclusion match
        for key, name in self.inst_name_map.items():
            if q_clean == key or q_clean in key or key in q_clean:
                return name

        # 3. Strip leading "the "
        if q_clean.startswith("the "):
            sub = q_clean[4:].strip()
            for key, name in self.inst_name_map.items():
                if sub == key or sub in key or key in sub:
                    return name

        # 4. Token-based matching for distinctive keywords (e.g. "Oxford", "MIT", "Cambridge")
        stop_words = {"university", "of", "the", "college", "institute", "for", "and", "at"}
        tokens = [t for t in q_clean.split() if t not in stop_words and len(t) > 2]
        if tokens:
            for key, name in self.inst_name_map.items():
                if all(t in key for t in tokens):
                    return name

        return None

    def get_stats(self) -> Dict[str, Any]:
        latest_year = int(self.df["year"].max())
        latest_df = self.df[self.df["year"] == latest_year].sort_values("world_rank")
        top_10 = latest_df["institution"].head(10).tolist()

        # Score brackets
        scores = self.df["score"]
        score_distribution = {
            "90+ (Elite)": int((scores >= 90).sum()),
            "75-89 (High)": int(((scores >= 75) & (scores < 90)).sum()),
            "50-74 (Moderate)": int(((scores >= 50) & (scores < 75)).sum()),
            "<50 (Developing)": int((scores < 50).sum()),
        }

        return {
            "total_records": len(self.df),
            "total_universities": int(self.df["institution"].nunique()),
            "total_countries": int(self.df["country"].nunique()),
            "years": sorted(self.df["year"].unique().tolist()),
            "top_institutions": top_10,
            "score_distribution": score_distribution,
        }

    def get_countries(self) -> List[str]:
        return sorted(self.df["country"].unique().tolist())

    def search_universities(self, query: str, limit: int = 10) -> List[Dict[str, Any]]:
        import re
        q = re.sub(r"^[^\w\s]+|[^\w\s]+$", "", query.strip()).strip().lower()
        if not q:
            # return top ranked from latest year
            latest_year = self.df["year"].max()
            top = self.df[self.df["year"] == latest_year].sort_values("world_rank").head(limit)
            return [
                {
                    "institution": row["institution"],
                    "country": row["country"],
                    "latest_rank": int(row["world_rank"]),
                    "latest_score": float(row["score"]),
                    "latest_year": int(row["year"]),
                }
                for _, row in top.iterrows()
            ]

        # Prioritize starts-with over contains
        starts_with = []
        contains = []

        for key, name in self.inst_name_map.items():
            if key.startswith(q):
                starts_with.append(name)
            elif q in key or key in q:
                contains.append(name)

        combined_names = (starts_with + contains)[: limit * 2]
        if not combined_names:
            return []

        matched_df = self.latest_records[self.latest_records["institution"].isin(combined_names)]
        matched_df = matched_df.sort_values("world_rank").head(limit)

        results = []
        for _, row in matched_df.iterrows():
            results.append({
                "institution": row["institution"],
                "country": row["country"],
                "latest_rank": int(row["world_rank"]),
                "latest_score": float(row["score"]),
                "latest_year": int(row["year"]),
            })
        return results

    def get_university_history(self, institution: str) -> Optional[List[Dict[str, Any]]]:
        resolved = self.resolve_institution_name(institution)
        if not resolved:
            return None

        sub = self.df[self.df["institution"] == resolved].sort_values("year")
        if sub.empty:
            return None

        # Clean NaN values
        records = sub.replace({np.nan: None}).to_dict(orient="records")
        for rec in records:
            for k in [
                "national_rank", "quality_of_education", "alumni_employment",
                "quality_of_faculty", "publications", "influence", "citations",
                "broad_impact", "patents"
            ]:
                if rec.get(k) is not None:
                    try:
                        rec[k] = int(rec[k])
                    except (ValueError, TypeError):
                        rec[k] = None
        return records

    def get_university_trend(self, institution: str) -> Optional[List[Dict[str, Any]]]:
        records = self.get_university_history(institution)
        if not records:
            return None

        trend = []
        for i, row in enumerate(records):
            item = {
                "year": int(row["year"]),
                "world_rank": int(row["world_rank"]),
                "score": float(row["score"]),
            }
            if i > 0:
                prev = records[i - 1]
                item["rank_change"] = int(prev["world_rank"] - row["world_rank"])  # positive means improved rank
                item["score_change"] = round(float(row["score"] - prev["score"]), 2)
            else:
                item["rank_change"] = 0
                item["score_change"] = 0.0
            trend.append(item)
        return trend

    def get_university_health(self, institution: str) -> Optional[Dict[str, Any]]:
        records = self.get_university_history(institution)
        if not records:
            return None

        latest = records[-1]
        score = float(latest["score"])
        world_rank = int(latest["world_rank"])

        # Status classification
        if score >= 75 or world_rank <= 50:
            status = "Green"
            tier = "Tier 1: Global Elite"
        elif score >= 50 or world_rank <= 250:
            status = "Yellow"
            tier = "Tier 2: High Performing"
        else:
            status = "Red"
            tier = "Tier 3: Emerging / Needs Focus"

        # Calculate dataset percentile for score
        latest_year = latest["year"]
        year_df = self.df[self.df["year"] == latest_year]
        percentile = round(float((year_df["score"] <= score).mean() * 100), 1)

        # Identify strengths (lowest rank numbers) and vulnerabilities (highest rank numbers)
        kpi_keys = [
            ("quality_of_education", "Quality of Education"),
            ("quality_of_faculty", "Quality of Faculty"),
            ("publications", "Publications"),
            ("citations", "Citations"),
            ("influence", "Influence"),
            ("patents", "Patents"),
            ("alumni_employment", "Alumni Employment")
        ]

        scored_kpis = []
        for key, label in kpi_keys:
            val = latest.get(key)
            if val is not None and val > 0:
                scored_kpis.append((label, val))

        scored_kpis.sort(key=lambda x: x[1])

        strengths = [f"{label} (Global #{rank})" for label, rank in scored_kpis[:3]]
        vulnerabilities = [f"{label} (Global #{rank})" for label, rank in scored_kpis[-3:] if len(scored_kpis) >= 4]

        return {
            "institution": latest["institution"],
            "year": int(latest["year"]),
            "score": score,
            "world_rank": world_rank,
            "status": status,
            "tier": tier,
            "percentile": percentile,
            "strengths": strengths,
            "vulnerabilities": vulnerabilities,
        }

    def compare_universities(self, inst1: str, inst2: str, year: Optional[int] = None) -> Optional[Dict[str, Any]]:
        res1 = self.resolve_institution_name(inst1)
        res2 = self.resolve_institution_name(inst2)
        if not res1 or not res2:
            return None

        sub1 = self.df[self.df["institution"] == res1]
        sub2 = self.df[self.df["institution"] == res2]

        common_years = sorted(list(set(sub1["year"]).intersection(set(sub2["year"]))))
        if not common_years:
            target_year = int(self.df["year"].max())
        else:
            target_year = year if year in common_years else common_years[-1]

        row1_df = sub1[sub1["year"] == target_year]
        row2_df = sub2[sub2["year"] == target_year]

        if row1_df.empty or row2_df.empty:
            row1 = sub1.sort_values("year").iloc[-1]
            row2 = sub2.sort_values("year").iloc[-1]
            target_year = int(row1["year"])
        else:
            row1 = row1_df.iloc[0]
            row2 = row2_df.iloc[0]

        kpis = [
            ("world_rank", "World Rank", True),
            ("score", "Overall Score", False),
            ("quality_of_education", "Quality of Education", True),
            ("quality_of_faculty", "Quality of Faculty", True),
            ("publications", "Publications", True),
            ("citations", "Citations", True),
            ("influence", "Influence", True),
            ("patents", "Patents", True),
            ("alumni_employment", "Alumni Employment", True),
        ]

        dimensions = []
        for col, label, is_rank in kpis:
            val1 = row1.get(col)
            val2 = row2.get(col)
            v1 = float(val1) if pd.notna(val1) else None
            v2 = float(val2) if pd.notna(val2) else None

            winner = None
            if v1 is not None and v2 is not None:
                if is_rank:
                    if v1 < v2:
                        winner = res1
                    elif v2 < v1:
                        winner = res2
                    else:
                        winner = "Tie"
                else:
                    if v1 > v2:
                        winner = res1
                    elif v2 > v1:
                        winner = res2
                    else:
                        winner = "Tie"

            dimensions.append({
                "kpi": col,
                "label": label,
                "inst1_val": v1,
                "inst2_val": v2,
                "winner": winner,
                "is_rank_based": is_rank
            })

        return {
            "inst1": res1,
            "inst2": res2,
            "year": int(target_year),
            "inst1_rank": int(row1["world_rank"]),
            "inst2_rank": int(row2["world_rank"]),
            "inst1_score": float(row1["score"]),
            "inst2_score": float(row2["score"]),
            "dimensions": dimensions
        }

    def get_rankings(
        self,
        year: Optional[int] = None,
        country: Optional[str] = None,
        sort_by: str = "world_rank",
        order: str = "asc",
        page: int = 1,
        page_size: int = 20
    ) -> Dict[str, Any]:
        target_year = year or int(self.df["year"].max())
        sub = self.df[self.df["year"] == target_year].copy()

        if country and country.strip():
            sub = sub[sub["country"].str.lower() == country.strip().lower()]

        valid_sort_columns = [
            "world_rank", "score", "quality_of_education", "quality_of_faculty",
            "publications", "citations", "patents", "influence", "institution"
        ]
        if sort_by not in valid_sort_columns:
            sort_by = "world_rank"

        ascending = (order.lower() != "desc")
        sub = sub.sort_values(sort_by, ascending=ascending)

        total = len(sub)
        start = (page - 1) * page_size
        end = start + page_size
        page_df = sub.iloc[start:end]

        results = page_df.replace({np.nan: None}).to_dict(orient="records")
        for rec in results:
            for k in [
                "national_rank", "quality_of_education", "alumni_employment",
                "quality_of_faculty", "publications", "influence", "citations",
                "broad_impact", "patents"
            ]:
                if rec.get(k) is not None:
                    try:
                        rec[k] = int(rec[k])
                    except (ValueError, TypeError):
                        rec[k] = None

        total_pages = max(1, (total + page_size - 1) // page_size)

        return {
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": total_pages,
            "year": target_year,
            "country": country,
            "results": results
        }

    def get_country_power_index(self, year: Optional[int] = None) -> List[Dict[str, Any]]:
        target_year = year or int(self.df["year"].max())
        sub = self.df[self.df["year"] == target_year]

        records = []
        for country, group in sub.groupby("country"):
            sorted_grp = group.sort_values("world_rank")
            top_row = sorted_grp.iloc[0]
            top_100 = int((group["world_rank"] <= 100).sum())
            total = len(group)
            avg_sc = round(float(group["score"].mean()), 2)

            # Composite Power Rating: weighted combination of elite representation and total capacity
            power_score = round((top_100 * 12.0) + (total * 1.5) + (avg_sc * 0.5), 1)

            records.append({
                "country": country,
                "total_institutions": total,
                "top_100_count": top_100,
                "average_score": avg_sc,
                "top_institution": top_row["institution"],
                "top_rank": int(top_row["world_rank"]),
                "power_score": power_score,
            })

        records.sort(key=lambda x: (x["top_100_count"], x["total_institutions"], x["power_score"]), reverse=True)
        return records

    def get_radar_benchmarks(self, institution: str) -> Optional[Dict[str, Any]]:
        resolved = self.resolve_institution_name(institution)
        if not resolved:
            return None

        records = self.get_university_history(resolved)
        if not records:
            return None
        latest = records[-1]
        target_year = latest["year"]
        year_df = self.df[self.df["year"] == target_year]
        top10_df = year_df.sort_values("world_rank").head(10)

        kpis = [
            ("quality_of_education", "Education"),
            ("quality_of_faculty", "Faculty"),
            ("publications", "Publications"),
            ("citations", "Citations"),
            ("influence", "Influence"),
            ("patents", "Patents"),
            ("alumni_employment", "Alumni"),
        ]

        def rank_to_competence(r):
            if r is None or pd.isna(r) or r <= 0:
                return 10.0
            # Exponential decay competence: rank 1 = 100%, rank 10 = 95%, rank 50 = 80%, rank 200 = 50%, rank 1000 = 10%
            return round(max(10.0, min(100.0, 100.0 - (np.log(max(1.0, float(r))) / np.log(1000.0)) * 90.0)), 1)

        dimensions = []
        inst_scores = []
        top10_scores = []
        global_scores = []

        for col, label in kpis:
            dimensions.append(label)
            # Institution
            inst_r = latest.get(col)
            inst_scores.append(rank_to_competence(inst_r))

            # Top 10 benchmark
            t10_r = top10_df[col].dropna().median() if col in top10_df else 5
            top10_scores.append(rank_to_competence(t10_r))

            # Global median
            med_r = year_df[col].dropna().median() if col in year_df else 400
            global_scores.append(rank_to_competence(med_r))

        return {
            "institution": resolved,
            "year": int(target_year),
            "dimensions": dimensions,
            "institution_scores": inst_scores,
            "top10_benchmark": top10_scores,
            "global_average": global_scores,
            "overall_competence": round(float(np.mean(inst_scores)), 1),
        }

    def simulate_university_kpis(self, institution: str, adjustments: Dict[str, int]) -> Optional[Dict[str, Any]]:
        resolved = self.resolve_institution_name(institution)
        if not resolved:
            return None

        records = self.get_university_history(resolved)
        if not records:
            return None
        baseline = records[-1]
        target_year = baseline["year"]
        year_df = self.df[self.df["year"] == target_year].copy()

        weights = {
            "quality_of_faculty": 0.25,
            "quality_of_education": 0.25,
            "alumni_employment": 0.25,
            "publications": 0.10,
            "citations": 0.10,
            "influence": 0.05,
            "patents": 0.05,
        }

        baseline_score = float(baseline["score"])
        baseline_rank = int(baseline["world_rank"])

        # Calculate estimated score impact from rank adjustments
        score_shift = 0.0
        applied_adjustments = {}

        for kpi, target_rank in adjustments.items():
            if kpi not in weights:
                continue
            cur_rank = baseline.get(kpi)
            if cur_rank is None or cur_rank <= 0:
                cur_rank = 500

            target_rank = max(1, min(1000, int(target_rank)))
            applied_adjustments[kpi] = {
                "original": int(cur_rank),
                "simulated": int(target_rank),
                "delta": int(cur_rank - target_rank)  # positive means improved rank
            }

            # Sensitivity multiplier based on logarithmic rank delta
            rank_ratio = (cur_rank - target_rank) / max(1.0, float(cur_rank))
            kpi_weight = weights[kpi]
            score_shift += (rank_ratio * kpi_weight * 12.5)

        simulated_score = round(max(40.0, min(100.0, baseline_score + score_shift)), 2)
        score_delta = round(simulated_score - baseline_score, 2)

        # Predict new global rank position by placing simulated score in leaderboard
        better_count = int((year_df["score"] > simulated_score).sum())
        predicted_rank = max(1, better_count + 1)
        rank_delta = baseline_rank - predicted_rank  # positive = gained positions

        # Feasibility & Strategic Takeaway
        if rank_delta > 10:
            takeaway = f"Aggressive structural transformation: Elevating these metrics would propel {resolved} up {rank_delta} positions into World Rank #{predicted_rank}."
        elif rank_delta > 0:
            takeaway = f"Targeted optimization: Projected to gain +{rank_delta} global positions to World Rank #{predicted_rank} (+{score_delta} score points)."
        elif rank_delta < 0:
            takeaway = f"Vulnerability alert: Decreased performance across these dimensions risks dropping {abs(rank_delta)} positions."
        else:
            takeaway = f"Performance stabilization: Score adjusted to {simulated_score} with steady World Rank #{predicted_rank}."

        return {
            "institution": resolved,
            "year": int(target_year),
            "baseline_rank": baseline_rank,
            "baseline_score": baseline_score,
            "simulated_score": simulated_score,
            "predicted_rank": predicted_rank,
            "rank_delta": rank_delta,
            "score_delta": score_delta,
            "applied_adjustments": applied_adjustments,
            "strategic_summary": takeaway,
        }


    def get_roi_strategy(self, institution: str, budget_tier: str = "moderate") -> Optional[Dict[str, Any]]:
        resolved = self.resolve_institution_name(institution)
        if not resolved:
            return None

        records = self.get_university_history(resolved)
        if not records:
            return None
        latest = records[-1]
        target_year = latest["year"]
        year_df = self.df[self.df["year"] == target_year]

        # Strategic KPI dimensions with difficulty factor, score elasticity, and estimated capital intensity
        # difficulty: 1 (easiest to move via capital/grants) to 3 (requires long-term generational shift)
        kpi_meta = {
            "citations": {"label": "Research Citations & Open Access", "difficulty": 1.2, "weight": 0.10, "cost_per_rank": 0.25},
            "patents": {"label": "Technology Transfer & Patents", "difficulty": 1.1, "weight": 0.05, "cost_per_rank": 0.20},
            "publications": {"label": "Faculty Scholarly Publishing", "difficulty": 1.3, "weight": 0.10, "cost_per_rank": 0.35},
            "quality_of_faculty": {"label": "Endowed Chairs & Star Faculty", "difficulty": 2.5, "weight": 0.25, "cost_per_rank": 1.20},
            "quality_of_education": {"label": "Alumni Nobel / Field Medal Accreditations", "difficulty": 3.0, "weight": 0.25, "cost_per_rank": 1.80},
            "alumni_employment": {"label": "Executive Career Placement & C-Suite Network", "difficulty": 1.8, "weight": 0.25, "cost_per_rank": 0.80},
        }

        # Budget multipliers: capital allocated in Millions USD
        budget_alloc = {
            "conservative": {"budget_m": 15, "effort_level": "Targeted Grants & Infrastructure"},
            "moderate": {"budget_m": 45, "effort_level": "Strategic 3-Year Capital Initiative"},
            "aggressive": {"budget_m": 100, "effort_level": "Flagship Institutional Transformation"}
        }.get(budget_tier.lower(), {"budget_m": 45, "effort_level": "Strategic 3-Year Capital Initiative"})

        budget_m = budget_alloc["budget_m"]
        cur_score = float(latest["score"])
        cur_rank = int(latest["world_rank"])

        # Calculate opportunity score for each dimension:
        # opportunity = (current_rank / 1000) * (weight / difficulty) -> high rank number means lagging metric with room for rapid gains
        recommendations = []
        for kpi, meta in kpi_meta.items():
            r = latest.get(kpi)
            if r is None or r <= 0:
                r = 450
            opportunity = (float(r) / 1000.0) * (meta["weight"] / meta["difficulty"]) * 100.0
            recommendations.append({
                "kpi": kpi,
                "label": meta["label"],
                "current_rank": int(r),
                "opportunity_score": round(opportunity, 1),
                "difficulty": meta["difficulty"],
                "weight": meta["weight"],
                "cost_per_rank": meta["cost_per_rank"]
            })

        # Rank recommendations by highest opportunity return
        recommendations.sort(key=lambda x: x["opportunity_score"], reverse=True)

        # Allocate budget across top 3 highest-ROI levers
        total_opp = sum(rec["opportunity_score"] for rec in recommendations[:3]) or 1.0
        allocated_initiatives = []
        projected_total_score_gain = 0.0

        for rec in recommendations[:3]:
            fraction = rec["opportunity_score"] / total_opp
            allocated_budget = round(budget_m * fraction, 1)
            # Ranks gained = allocated_budget / cost_per_rank
            ranks_to_gain = int(min(rec["current_rank"] - 1, (allocated_budget / rec["cost_per_rank"]) * 8.0))
            new_target_rank = max(1, rec["current_rank"] - ranks_to_gain)
            
            # Score uplift from this rank compression
            ratio = (rec["current_rank"] - new_target_rank) / max(1.0, float(rec["current_rank"]))
            metric_score_uplift = round(ratio * rec["weight"] * 12.0, 2)
            projected_total_score_gain += metric_score_uplift

            # Strategic actionable playbooks
            if rec["kpi"] == "citations":
                action = "Fund open-access article processing charges (APCs) and launch high-impact interdisciplinary lab consortia."
                timeline = "12 - 18 months"
            elif rec["kpi"] == "patents":
                action = "Erect campus tech-transfer incubator and subsidize international PCT patent filings for engineering faculty."
                timeline = "18 - 24 months"
            elif rec["kpi"] == "publications":
                action = "Implement competitive research reward bonuses for Nature/Science/Lancet Tier-1 indexed publications."
                timeline = "12 - 24 months"
            elif rec["kpi"] == "quality_of_faculty":
                action = "Endow 4 cluster-hiring chairs in AI, Quantum Computing, and Biomedicine targeting highly-cited researchers."
                timeline = "24 - 36 months"
            elif rec["kpi"] == "alumni_employment":
                action = "Establish Global C-Suite Executive Mentorship Network and expand venture capital pitch funds for graduates."
                timeline = "24 - 36 months"
            else:
                action = "Targeted graduate fellowships and curriculum modernization to boost student career trajectories."
                timeline = "18 - 36 months"

            allocated_initiatives.append({
                "kpi": rec["kpi"],
                "label": rec["label"],
                "current_rank": rec["current_rank"],
                "target_rank": new_target_rank,
                "projected_rank_gain": ranks_to_gain,
                "allocated_budget_usd_m": allocated_budget,
                "projected_score_uplift": metric_score_uplift,
                "action_playbook": action,
                "implementation_timeline": timeline
            })

        projected_total_score = round(min(100.0, cur_score + projected_total_score_gain), 2)
        projected_rank = max(1, int((year_df["score"] > projected_total_score).sum()) + 1)
        rank_elevation = cur_rank - projected_rank

        # Estimated payback & prestige return
        annual_tuition_and_grant_upside_m = round(rank_elevation * 0.45 + (budget_m * 0.18), 1)
        payback_years = round(budget_m / max(1.0, annual_tuition_and_grant_upside_m), 1)

        return {
            "institution": resolved,
            "year": int(target_year),
            "budget_tier": budget_tier,
            "budget_usd_m": budget_m,
            "effort_level": budget_alloc["effort_level"],
            "current_score": cur_score,
            "current_world_rank": cur_rank,
            "projected_score": projected_total_score,
            "projected_world_rank": projected_rank,
            "rank_elevation": rank_elevation,
            "score_gain": round(projected_total_score_gain, 2),
            "estimated_annual_grant_growth_usd_m": annual_tuition_and_grant_upside_m,
            "estimated_payback_years": payback_years,
            "initiatives": allocated_initiatives
        }


# Global singleton
data_service = DataService()

