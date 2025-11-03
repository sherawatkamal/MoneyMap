# exports/service.py
from datetime import datetime
from typing import List, Dict, Optional, Iterable, Tuple
from db_utils import get_connection, decrypt_value

ALLOWED_TYPES = {"incomes", "expenses", "savings"}

def _query_table(user_id: int, table: str, start: Optional[datetime], end: Optional[datetime]) -> Iterable[Tuple[int, bytes, datetime]]:
    conn = get_connection()
    cur = conn.cursor()

    clauses = ["user_id = %s"]
    params = [user_id]
    if start:
        clauses.append("created_at >= %s")
        params.append(start)
    if end:
        clauses.append("created_at < %s")
        params.append(end)

    where_sql = " AND ".join(clauses)
    sql = f"SELECT id, amount_encrypted, created_at FROM {table} WHERE {where_sql} ORDER BY created_at ASC"
    cur.execute(sql, tuple(params))
    rows = cur.fetchall()
    cur.close()
    conn.close()
    return rows

def _singular(t: str) -> str:
    return t[:-1] if t.endswith("s") else t

def fetch_financial_rows(user_id: int, which: str, start: Optional[datetime] = None, end: Optional[datetime] = None) -> List[Dict]:
    # returns different rows with type, id, amount, and time created
    tables = []
    if which == "all":
        tables = ["incomes", "expenses", "savings"]
    elif which in ALLOWED_TYPES:
        tables = [which]
    else:
        raise ValueError("type must be one of incomes|expenses|savings|all")

    out: List[Dict] = []
    for t in tables:
        for rid, enc_amt, created_at in _query_table(user_id, t, start, end):
            dec = decrypt_value(enc_amt)
            if dec is None:
                # skip rows we cannot decrypt
                continue
            try:
                amount = float(dec)
            except (TypeError, ValueError):
                continue
            out.append({
                "type": _singular(t),
                "id": rid,
                "amount": amount,
                "created_at": created_at.isoformat() if hasattr(created_at, "isoformat") else str(created_at),
            })
    return out
