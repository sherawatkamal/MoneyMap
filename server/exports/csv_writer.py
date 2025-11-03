from typing import Iterable, Dict
from flask import Response
import io, csv

COLUMNS = ["type", "id", "amount", "created_at"]

def rows_to_csv_response(rows: Iterable[Dict], filename: str) -> Response:
    buf = io.StringIO()
    writer = csv.DictWriter(buf, fieldnames=COLUMNS)
    writer.writeheader()
    for r in rows:
        writer.writerow({k: r.get(k, "") for k in COLUMNS})
    data = buf.getvalue().encode("utf-8")
    buf.close()

    resp = Response(data, mimetype="text/csv")
    resp.headers["Content-Disposition"] = f'attachment; filename="{filename}"'
    return resp
