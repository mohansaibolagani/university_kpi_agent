import io
import datetime
from typing import Dict, Any, List
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    HRFlowable,
    KeepTogether,
)


def generate_university_pdf(
    history: List[Dict[str, Any]],
    health: Dict[str, Any],
    trend: List[Dict[str, Any]],
    ai_insight: Dict[str, Any],
) -> bytes:
    """Generates an executive-grade A4 PDF Dossier for a university."""
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36,
    )

    styles = getSampleStyleSheet()

    # Custom styles
    title_style = ParagraphStyle(
        "DocTitle",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=18,
        leading=22,
        textColor=colors.HexColor("#0F172A"),
    )

    subtitle_style = ParagraphStyle(
        "DocSubtitle",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9,
        leading=12,
        textColor=colors.HexColor("#64748B"),
    )

    univ_title_style = ParagraphStyle(
        "UnivTitle",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=16,
        leading=20,
        textColor=colors.HexColor("#1E1B4B"),
    )

    section_header_style = ParagraphStyle(
        "SectionHeader",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=11,
        leading=15,
        textColor=colors.HexColor("#312E81"),
        spaceBefore=8,
        spaceAfter=4,
    )

    body_style = ParagraphStyle(
        "BodyTextCustom",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8.5,
        leading=12,
        textColor=colors.HexColor("#334155"),
    )

    bold_body_style = ParagraphStyle(
        "BoldBodyText",
        parent=body_style,
        fontName="Helvetica-Bold",
        textColor=colors.HexColor("#0F172A"),
    )

    table_cell_style = ParagraphStyle(
        "TableCell",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8,
        leading=11,
        textColor=colors.HexColor("#1E293B"),
    )

    table_cell_bold = ParagraphStyle(
        "TableCellBold",
        parent=table_cell_style,
        fontName="Helvetica-Bold",
        textColor=colors.HexColor("#0F172A"),
    )

    story = []

    latest = history[-1] if history else {}
    inst_name = latest.get("institution", "University")
    country = latest.get("country", "Global")
    year = latest.get("year", 2015)
    world_rank = latest.get("world_rank", "N/A")
    score = latest.get("score", 0.0)
    nat_rank = latest.get("national_rank", "N/A")

    # 1. Header Banner
    story.append(Paragraph("UNIVERSITY KPI STRATEGIC INTELLIGENCE DOSSIER", title_style))
    story.append(Paragraph("Executive Academic Performance Report • Center for World University Rankings (CWUR)", subtitle_style))
    story.append(Spacer(1, 6))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#4F46E5"), spaceAfter=10))

    # 2. Institution Hero Summary Grid
    meta_table_data = [
        [
            Paragraph(f"<b>Institution:</b> {inst_name}", body_style),
            Paragraph(f"<b>Country:</b> {country}", body_style),
            Paragraph(f"<b>Reporting Cycle:</b> {year}", body_style),
        ],
        [
            Paragraph(f"<b>World Rank:</b> #{world_rank}", bold_body_style),
            Paragraph(f"<b>National Rank:</b> #{nat_rank}", body_style),
            Paragraph(f"<b>Aggregate Score:</b> {score:.1f} / 100", bold_body_style),
        ],
    ]
    meta_table = Table(meta_table_data, colWidths=[200, 160, 160])
    meta_table.setStyle(
        TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#F8FAFC")),
            ("BOX", (0, 0), (-1, -1), 1, colors.HexColor("#CBD5E1")),
            ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
            ("TOPPADDING", (0, 0), (-1, -1), 6),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ("LEFTPADDING", (0, 0), (-1, -1), 8),
            ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ])
    )
    story.append(meta_table)
    story.append(Spacer(1, 10))

    # 3. Health & Tier Assessment
    tier = health.get("tier", "Standard Evaluation")
    status = health.get("status", "Green")
    percentile = health.get("percentile", 50.0)

    status_color = "#059669" if status == "Green" else "#D97706" if status == "Yellow" else "#DC2626"

    health_box_data = [
        [
            Paragraph(f"<b>Performance Tier:</b> {tier}", bold_body_style),
            Paragraph(f"<b>Health Status:</b> <font color='{status_color}'><b>{status.upper()}</b></font>", body_style),
            Paragraph(f"<b>Global Percentile:</b> Top {(100 - percentile):.1f}% ({percentile}th pct)", body_style),
        ]
    ]
    health_table = Table(health_box_data, colWidths=[220, 150, 150])
    health_table.setStyle(
        TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#EEF2FF")),
            ("BOX", (0, 0), (-1, -1), 1, colors.HexColor("#C7D2FE")),
            ("TOPPADDING", (0, 0), (-1, -1), 5),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ("LEFTPADDING", (0, 0), (-1, -1), 8),
            ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ])
    )
    story.append(health_table)
    story.append(Spacer(1, 10))

    # 4. Dimension KPI Table
    story.append(Paragraph("1. KPI DIMENSION SCORECARD", section_header_style))

    kpi_metrics = [
        ("Quality of Education", latest.get("quality_of_education"), "Alumni Nobel/Field medal success"),
        ("Quality of Faculty", latest.get("quality_of_faculty"), "Major academic honors & awards"),
        ("Publications", latest.get("publications"), "Total research papers published in reputable journals"),
        ("Citations", latest.get("citations"), "Highly-cited research volume"),
        ("Influence", latest.get("influence"), "Research publication citation impact"),
        ("Patents", latest.get("patents"), "International patent filings volume"),
        ("Alumni Employment", latest.get("alumni_employment"), "Alumni holding CEO positions at top firms"),
    ]

    kpi_table_data = [
        [
            Paragraph("<b>KPI Metric</b>", table_cell_bold),
            Paragraph("<b>Global Rank</b>", table_cell_bold),
            Paragraph("<b>Direction</b>", table_cell_bold),
            Paragraph("<b>Evaluation Description</b>", table_cell_bold),
        ]
    ]

    for label, rank_val, desc in kpi_metrics:
        r_str = f"#{rank_val}" if rank_val is not None else "N/A"
        kpi_table_data.append([
            Paragraph(label, table_cell_bold),
            Paragraph(r_str, table_cell_style),
            Paragraph("Lower is better", table_cell_style),
            Paragraph(desc, table_cell_style),
        ])

    kpi_table = Table(kpi_table_data, colWidths=[130, 70, 80, 240])
    kpi_table.setStyle(
        TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#F1F5F9")),
            ("BOX", (0, 0), (-1, -1), 1, colors.HexColor("#CBD5E1")),
            ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
            ("TOPPADDING", (0, 0), (-1, -1), 4),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ("LEFTPADDING", (0, 0), (-1, -1), 6),
            ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ])
    )
    story.append(kpi_table)
    story.append(Spacer(1, 10))

    # 5. Multi-Year Historical Trajectory Audit
    story.append(Paragraph("2. LONGITUDINAL PERFORMANCE TRAJECTORY (2012–2015)", section_header_style))

    trend_table_data = [
        [
            Paragraph("<b>Reporting Year</b>", table_cell_bold),
            Paragraph("<b>World Rank</b>", table_cell_bold),
            Paragraph("<b>Rank Movement</b>", table_cell_bold),
            Paragraph("<b>Aggregate Score</b>", table_cell_bold),
            Paragraph("<b>Score Delta</b>", table_cell_bold),
        ]
    ]

    for pt in trend:
        r_shift = pt.get("rank_change", 0)
        s_delta = pt.get("score_change", 0.0)

        if r_shift > 0:
            shift_str = f"<font color='#059669'>▲ +{r_shift} Improved</font>"
        elif r_shift < 0:
            shift_str = f"<font color='#DC2626'>▼ {r_shift} Dropped</font>"
        else:
            shift_str = "<font color='#64748B'>━ Steady</font>"

        delta_str = f"+{s_delta:.2f}" if s_delta > 0 else f"{s_delta:.2f}"

        trend_table_data.append([
            Paragraph(str(pt.get("year")), table_cell_bold),
            Paragraph(f"#{pt.get('world_rank')}", table_cell_style),
            Paragraph(shift_str, table_cell_style),
            Paragraph(f"{pt.get('score'):.2f}", table_cell_style),
            Paragraph(delta_str, table_cell_style),
        ])

    trend_table = Table(trend_table_data, colWidths=[90, 80, 130, 110, 110])
    trend_table.setStyle(
        TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#F1F5F9")),
            ("BOX", (0, 0), (-1, -1), 1, colors.HexColor("#CBD5E1")),
            ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
            ("TOPPADDING", (0, 0), (-1, -1), 4),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ("LEFTPADDING", (0, 0), (-1, -1), 6),
            ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ])
    )
    story.append(trend_table)
    story.append(Spacer(1, 10))

    # 6. AI Strategic Performance Advisory
    story.append(Paragraph("3. AI EXECUTIVE STRATEGIC PERFORMANCE ADVISORY", section_header_style))

    insight_raw = ai_insight.get("insight", "No insight generated.")
    # Format insight lines
    insight_paragraphs = []
    for line in insight_raw.split("\n"):
        line = line.strip()
        if not line:
            continue
        if line.startswith("###") or line.startswith("1.") or line.startswith("2.") or line.startswith("3.") or line.startswith("4."):
            clean_head = line.replace("#", "").strip()
            insight_paragraphs.append(Paragraph(f"<b>{clean_head}</b>", bold_body_style))
        elif line.startswith("•") or line.startswith("-"):
            insight_paragraphs.append(Paragraph(f"&nbsp;&nbsp;{line}", body_style))
        else:
            insight_paragraphs.append(Paragraph(line, body_style))

    ai_box_data = [[insight_paragraphs]]
    ai_table = Table(ai_box_data, colWidths=[520])
    ai_table.setStyle(
        TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#F8FAFC")),
            ("BOX", (0, 0), (-1, -1), 1, colors.HexColor("#C7D2FE")),
            ("TOPPADDING", (0, 0), (-1, -1), 8),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
            ("LEFTPADDING", (0, 0), (-1, -1), 10),
            ("RIGHTPADDING", (0, 0), (-1, -1), 10),
        ])
    )
    story.append(ai_table)
    story.append(Spacer(1, 12))

    # 7. Document Footer
    ts = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S UTC")
    footer_text = f"Report Generated: {ts} • University KPI Intelligence Agent • Source: CWUR Verified Data & Google Gemini • Confidential"
    story.append(Paragraph(footer_text, subtitle_style))

    doc.build(story)
    buffer.seek(0)
    return buffer.getvalue()
