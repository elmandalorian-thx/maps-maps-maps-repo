import csv
import io
from typing import List
from fastapi import APIRouter, Depends, Body
from fastapi.responses import StreamingResponse
from ..middleware.auth import get_current_user
from ..models.auth import TokenData

router = APIRouter(prefix="/export", tags=["export"])


@router.post("/csv")
async def export_to_csv(
    businesses: List[dict] = Body(..., embed=True),
    current_user: TokenData = Depends(get_current_user),
):
    """Generate CSV file from business data."""
    if not businesses:
        return StreamingResponse(
            io.StringIO(""),
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=export.csv"},
        )

    # Get all field names from first business
    fieldnames = list(businesses[0].keys())

    # Create CSV in memory
    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=fieldnames)
    writer.writeheader()
    writer.writerows(businesses)

    # Seek to beginning for reading
    output.seek(0)

    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={
            "Content-Disposition": "attachment; filename=google_maps_export.csv"
        },
    )
