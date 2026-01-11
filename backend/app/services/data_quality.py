"""
Data Quality Service for business data normalization and validation.

Provides functions for:
- Phone number normalization (E.164 format)
- URL validation and normalization
- Completeness scoring
- Duplicate detection
"""

import re
from typing import List, Dict, Any, Optional
from urllib.parse import urlparse


# Fields considered essential for completeness scoring
ESSENTIAL_FIELDS = [
    "business_name",
    "phone",
    "website",
    "full_address",
    "city",
    "rating",
]

# Fields considered important but not essential
IMPORTANT_FIELDS = [
    "street_address",
    "postal_code",
    "province_state",
    "categories",
    "hours",
]

# Fields considered optional/nice to have
OPTIONAL_FIELDS = [
    "international_phone",
    "google_maps_url",
    "photo_url",
    "latitude",
    "longitude",
]


def normalize_phone(phone: str) -> str:
    """
    Normalize phone number to E.164 format (+1XXXXXXXXXX for North America).

    Args:
        phone: Raw phone number string in any format

    Returns:
        Normalized phone number in E.164 format, or original if cannot normalize

    Examples:
        "613-555-1234" -> "+16135551234"
        "(613) 555-1234" -> "+16135551234"
        "1-613-555-1234" -> "+16135551234"
        "+1 613 555 1234" -> "+16135551234"
    """
    if not phone or not isinstance(phone, str):
        return phone or ""

    # Remove all non-digit characters except leading +
    cleaned = re.sub(r"[^\d+]", "", phone)

    # If it starts with +, keep it, otherwise extract just digits
    if cleaned.startswith("+"):
        digits = cleaned[1:]
        has_plus = True
    else:
        digits = cleaned
        has_plus = False

    # If empty after cleaning, return original
    if not digits:
        return phone

    # Handle North American numbers (10 or 11 digits)
    if len(digits) == 10:
        # Add +1 country code for North America
        return f"+1{digits}"
    elif len(digits) == 11 and digits.startswith("1"):
        # Already has country code 1
        return f"+{digits}"
    elif has_plus and len(digits) >= 10:
        # International number with + prefix
        return f"+{digits}"
    else:
        # Return cleaned version if we can't normalize
        return phone


def validate_url(url: str) -> bool:
    """
    Check if URL is valid.

    Args:
        url: URL string to validate

    Returns:
        True if URL is valid, False otherwise
    """
    if not url or not isinstance(url, str):
        return False

    try:
        result = urlparse(url)
        # Must have scheme and netloc (domain)
        return all([result.scheme, result.netloc])
    except Exception:
        return False


def normalize_url(url: str) -> str:
    """
    Ensure URL has https:// prefix.

    Args:
        url: URL string that may or may not have a protocol

    Returns:
        URL with https:// prefix

    Examples:
        "example.com" -> "https://example.com"
        "http://example.com" -> "https://example.com"
        "https://example.com" -> "https://example.com"
    """
    if not url or not isinstance(url, str):
        return url or ""

    url = url.strip()

    if not url:
        return ""

    # If it already has https, return as-is
    if url.startswith("https://"):
        return url

    # If it has http, upgrade to https
    if url.startswith("http://"):
        return "https://" + url[7:]

    # If it starts with //, add https:
    if url.startswith("//"):
        return "https:" + url

    # Otherwise, add https://
    return "https://" + url


def check_completeness(business: Dict[str, Any]) -> Dict[str, Any]:
    """
    Calculate completeness score and identify missing fields for a business.

    The score is calculated as:
    - Essential fields: 10 points each (60 points max)
    - Important fields: 6 points each (30 points max)
    - Optional fields: ~3 points each (10 points max)

    Args:
        business: Business data dictionary

    Returns:
        Dictionary with:
        - score: Completeness score (0-100)
        - missing_fields: List of missing field names
        - field_summary: Breakdown by category
    """
    if not business or not isinstance(business, dict):
        return {
            "score": 0,
            "missing_fields": ESSENTIAL_FIELDS + IMPORTANT_FIELDS + OPTIONAL_FIELDS,
            "field_summary": {
                "essential": {"filled": 0, "total": len(ESSENTIAL_FIELDS)},
                "important": {"filled": 0, "total": len(IMPORTANT_FIELDS)},
                "optional": {"filled": 0, "total": len(OPTIONAL_FIELDS)},
            },
        }

    missing_fields = []
    essential_filled = 0
    important_filled = 0
    optional_filled = 0

    def is_filled(value: Any) -> bool:
        """Check if a field value is considered filled."""
        if value is None:
            return False
        if isinstance(value, str):
            return len(value.strip()) > 0
        if isinstance(value, (int, float)):
            return True
        if isinstance(value, bool):
            return True
        if isinstance(value, (list, dict)):
            return len(value) > 0
        return bool(value)

    # Check essential fields
    for field in ESSENTIAL_FIELDS:
        if is_filled(business.get(field)):
            essential_filled += 1
        else:
            missing_fields.append(field)

    # Check important fields
    for field in IMPORTANT_FIELDS:
        if is_filled(business.get(field)):
            important_filled += 1
        else:
            missing_fields.append(field)

    # Check optional fields
    for field in OPTIONAL_FIELDS:
        if is_filled(business.get(field)):
            optional_filled += 1
        else:
            missing_fields.append(field)

    # Calculate score
    # Essential: 60 points max (10 each for 6 fields)
    essential_score = (essential_filled / len(ESSENTIAL_FIELDS)) * 60 if ESSENTIAL_FIELDS else 0

    # Important: 30 points max (6 each for 5 fields)
    important_score = (important_filled / len(IMPORTANT_FIELDS)) * 30 if IMPORTANT_FIELDS else 0

    # Optional: 10 points max
    optional_score = (optional_filled / len(OPTIONAL_FIELDS)) * 10 if OPTIONAL_FIELDS else 0

    total_score = int(round(essential_score + important_score + optional_score))

    return {
        "score": total_score,
        "missing_fields": missing_fields,
        "field_summary": {
            "essential": {"filled": essential_filled, "total": len(ESSENTIAL_FIELDS)},
            "important": {"filled": important_filled, "total": len(IMPORTANT_FIELDS)},
            "optional": {"filled": optional_filled, "total": len(OPTIONAL_FIELDS)},
        },
    }


def find_duplicates(businesses: List[Dict[str, Any]]) -> List[List[str]]:
    """
    Find duplicate businesses in a list by place_id or by name+address combination.

    Args:
        businesses: List of business dictionaries

    Returns:
        List of duplicate groups, where each group is a list of place_ids
        that are considered duplicates of each other.

    Example:
        [["place_id_1", "place_id_2"], ["place_id_3", "place_id_4", "place_id_5"]]
        Means place_id_1 and place_id_2 are duplicates, and
        place_id_3, place_id_4, place_id_5 are duplicates of each other.
    """
    if not businesses:
        return []

    # Track seen place_ids for exact duplicates
    place_id_groups: Dict[str, List[str]] = {}

    # Track name+address combinations for soft duplicates
    name_address_groups: Dict[str, List[str]] = {}

    for business in businesses:
        if not isinstance(business, dict):
            continue

        place_id = business.get("place_id", "")
        business_name = business.get("business_name", "").lower().strip()
        full_address = business.get("full_address", "").lower().strip()

        if not place_id:
            continue

        # Check for exact place_id duplicates
        if place_id in place_id_groups:
            place_id_groups[place_id].append(place_id)
        else:
            place_id_groups[place_id] = [place_id]

        # Check for name+address duplicates (soft duplicates)
        if business_name and full_address:
            key = f"{business_name}|{full_address}"
            if key in name_address_groups:
                name_address_groups[key].append(place_id)
            else:
                name_address_groups[key] = [place_id]

    duplicate_groups = []

    # Find place_id duplicates (more than one entry with same place_id)
    for place_id, ids in place_id_groups.items():
        if len(ids) > 1:
            duplicate_groups.append(ids)

    # Find name+address duplicates
    for key, ids in name_address_groups.items():
        if len(ids) > 1:
            # Only add if not already covered by place_id duplicates
            if ids not in duplicate_groups:
                duplicate_groups.append(ids)

    return duplicate_groups


def normalize_business(business: Dict[str, Any]) -> Dict[str, Any]:
    """
    Apply all normalizations to a business record.

    Normalizes phone numbers and URLs, and adds data quality score.

    Args:
        business: Business data dictionary

    Returns:
        Normalized business data with data_quality_score and missing_fields added
    """
    if not business or not isinstance(business, dict):
        return business

    normalized = business.copy()

    # Normalize phone numbers
    if normalized.get("phone"):
        normalized["phone"] = normalize_phone(normalized["phone"])
    if normalized.get("international_phone"):
        normalized["international_phone"] = normalize_phone(normalized["international_phone"])

    # Normalize website URL
    if normalized.get("website"):
        normalized["website"] = normalize_url(normalized["website"])

    # Calculate completeness
    completeness = check_completeness(normalized)
    normalized["data_quality_score"] = completeness["score"]
    normalized["missing_fields"] = completeness["missing_fields"]

    return normalized


def generate_quality_report(businesses: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Generate a comprehensive data quality report for a list of businesses.

    Args:
        businesses: List of business dictionaries

    Returns:
        Dictionary with quality statistics:
        - totalRecords: Total number of businesses
        - complete: Number of businesses with score >= 80
        - incomplete: Number of businesses with score < 80
        - duplicates: Number of duplicate groups found
        - duplicateRecords: Total records involved in duplicates
        - averageScore: Average completeness score
        - missingFields: Breakdown of missing fields by field name
        - scoreDistribution: Distribution of scores by range
    """
    if not businesses:
        return {
            "totalRecords": 0,
            "complete": 0,
            "incomplete": 0,
            "duplicates": 0,
            "duplicateRecords": 0,
            "averageScore": 0,
            "missingFields": {},
            "scoreDistribution": {
                "excellent": 0,  # 90-100
                "good": 0,       # 70-89
                "fair": 0,       # 50-69
                "poor": 0,       # 0-49
            },
        }

    total_records = len(businesses)
    complete = 0
    incomplete = 0
    total_score = 0
    missing_fields_count: Dict[str, int] = {}
    score_distribution = {
        "excellent": 0,  # 90-100
        "good": 0,       # 70-89
        "fair": 0,       # 50-69
        "poor": 0,       # 0-49
    }

    for business in businesses:
        completeness = check_completeness(business)
        score = completeness["score"]
        total_score += score

        # Categorize by score
        if score >= 80:
            complete += 1
        else:
            incomplete += 1

        # Score distribution
        if score >= 90:
            score_distribution["excellent"] += 1
        elif score >= 70:
            score_distribution["good"] += 1
        elif score >= 50:
            score_distribution["fair"] += 1
        else:
            score_distribution["poor"] += 1

        # Count missing fields
        for field in completeness["missing_fields"]:
            missing_fields_count[field] = missing_fields_count.get(field, 0) + 1

    # Find duplicates
    duplicate_groups = find_duplicates(businesses)
    duplicate_records = sum(len(group) for group in duplicate_groups)

    average_score = round(total_score / total_records, 1) if total_records > 0 else 0

    return {
        "totalRecords": total_records,
        "complete": complete,
        "incomplete": incomplete,
        "duplicates": len(duplicate_groups),
        "duplicateRecords": duplicate_records,
        "averageScore": average_score,
        "missingFields": missing_fields_count,
        "scoreDistribution": score_distribution,
    }
