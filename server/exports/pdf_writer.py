# https://www.reportlab.com/
# can add graphics which i know we will have
# will add that later
from io import BytesIO
from datetime import datetime
from typing import Optional, List, Dict
from reportlab.lib.pagesizes import LETTER
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from .service import fetch_financial_rows

def _summarize(rows: List[Dict]) -> Dict:
    total_income = sum(r["amount"] for r in rows if r["type"] == "income")
    total_expense = sum(r["amount"] for r in rows if r["type"] == "expense")
    total_saving = sum(r["amount"] for r in rows if r["type"] == "saving")
    count_income = sum(1 for r in rows if r["type"] == "income")
    count_expense = sum(1 for r in rows if r["type"] == "expense")
    count_saving = sum(1 for r in rows if r["type"] == "saving")
    net = total_income - total_expense
    return {
        "total_income": total_income,
        "total_expense": total_expense,
        "total_saving": total_saving,
        "net": net,
        "count_income": count_income,
        "count_expense": count_expense,
        "count_saving": count_saving,
    }

def build_financial_summary_pdf(user_id: int, start: Optional[datetime] = None, end: Optional[datetime] = None) -> bytes:
    """Return a PDF (bytes) summarizing income/expense/saving totals in range."""
    # pull all types in one go
    rows = fetch_financial_rows(user_id, "all", start, end)
    summary = _summarize(rows)

    buf = BytesIO()
    doc = SimpleDocTemplate(
        buf,
        pagesize=LETTER,
        leftMargin=48, rightMargin=48, topMargin=54, bottomMargin=54,
        title="MoneyMap Financial Summary",
    )
    styles = getSampleStyleSheet()
    story = []

    # header
    title = "MoneyMap Financial Summary"
    period = "All time"
    if start or end:
        s = start.strftime("%Y-%m-%d") if start else "…"
        e = end.strftime("%Y-%m-%d") if end else "…"
        period = f"{s} to {e}"

    story.append(Paragraph(title, styles["Title"]))
    story.append(Paragraph(f"Period: {period}", styles["Normal"]))
    story.append(Paragraph(f"Generated: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%SZ')}", styles["Normal"]))
    story.append(Spacer(1, 16))

    # summary table
    data = [
        ["Metric", "Amount", "Count"],
        ["Total Income", f"{summary['total_income']:.2f}", str(summary['count_income'])],
        ["Total Expenses", f"{summary['total_expense']:.2f}", str(summary['count_expense'])],
        ["Total Savings", f"{summary['total_saving']:.2f}", str(summary['count_saving'])],
        ["Net (Income - Expenses)", f"{summary['net']:.2f}", ""],
    ]
    table = Table(data, hAlign="LEFT")
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.lightgrey),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.black),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 10),
        ("ALIGN", (1, 1), (-1, -1), "RIGHT"),
        ("GRID", (0, 0), (-1, -1), 0.25, colors.grey),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.whitesmoke, colors.white]),
        ("BOTTOMPADDING", (0, 0), (-1, 0), 8),
        ("TOPPADDING", (0, 0), (-1, 0), 6),
    ]))
    story.append(table)
    story.append(Spacer(1, 18))

    # smaller notes
    story.append(Paragraph("Notes:", styles["Heading3"]))
    story.append(Paragraph(
        "Amounts are summed from your incomes, expenses, and savings records in the selected period. "
        "Times are treated as stored (no timezone conversion).", styles["BodyText"]
    ))

    doc.build(story)
    return buf.getvalue()
