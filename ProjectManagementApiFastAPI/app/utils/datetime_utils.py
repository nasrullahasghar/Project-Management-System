from datetime import datetime , timezone
from typing import Optional

def to_utc_naive(date: Optional[datetime]) -> Optional[datetime]:
    if date is None:
        return None
    if date.tzinfo is not None:
        return date.astimezone(timezone.utc).replace(tzinfo=None)
    return date