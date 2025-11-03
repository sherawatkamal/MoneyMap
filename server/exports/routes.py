# exports/routes.py
from datetime import datetime
from flask import Blueprint, request, make_response
from flask_jwt_extended import jwt_required, get_jwt_identity
from .service import fetch_financial_rows
from .csv_writer import rows_to_csv_response
from .pdf_writer import build_financial_summary_pdf

exports_bp = Blueprint("exports", __name__)

def _parse_date(s: str):
    try:
        if len(s) == 10:
            return datetime.strptime(s, "%Y-%m-%d")
        return datetime.fromisoformat(s)
    except Exception:
        return None

@exports_bp.get("/export/csv")
@jwt_required()
def export_csv():
    user_id = get_jwt_identity()
    if not user_id:
        return {"msg": "Invalid token: missing identity"}, 401

    which = (request.args.get("type") or "all").lower().strip()
    start = _parse_date(request.args.get("start")) if request.args.get("start") else None
    end = _parse_date(request.args.get("end")) if request.args.get("end") else None

    try:
        rows = fetch_financial_rows(int(user_id), which, start, end)
    except ValueError as e:
        return {"msg": str(e)}, 400
    except Exception as e:
        return {"msg": "Failed to fetch data", "error": str(e)}, 500

    today = datetime.utcnow().strftime("%Y-%m-%d")
    fname = f"moneymap-{which}-export-{today}.csv"
    return rows_to_csv_response(rows, fname)


@exports_bp.get("/export/pdf/summary")
@jwt_required()
def export_pdf_summary():
    user_id = get_jwt_identity()
    if not user_id:
        return {"msg": "Invalid token: missing identity"}, 401

    start = _parse_date(request.args.get("start")) if request.args.get("start") else None
    end = _parse_date(request.args.get("end")) if request.args.get("end") else None

    try:
        pdf_bytes = build_financial_summary_pdf(int(user_id), start, end)
    except Exception as e:
        return {"msg": "Failed to build PDF", "error": str(e)}, 500

    today = datetime.utcnow().strftime("%Y-%m-%d")
    fname = f"moneymap-summary-{today}.pdf"

    resp = make_response(pdf_bytes)
    resp.headers["Content-Type"] = "application/pdf"
    resp.headers["Content-Disposition"] = f'attachment; filename="{fname}"'
    return resp