import json
import hashlib
from typing import Any

def canonicalize_json(data: Any) -> bytes:
    """
    Serializes a Python dict/object into canonical JSON adhering to RFC 8785:
    - Sorted object keys
    - No unnecessary whitespace
    - UTF-8 encoding
    """
    return json.dumps(
        data,
        sort_keys=True,
        separators=(',', ':'),
        ensure_ascii=False
    ).encode('utf-8')

def hash_payload(data: Any) -> str:
    """
    Computes deterministic SHA-256 hash of canonicalized JSON.
    """
    canonical_bytes = canonicalize_json(data)
    return hashlib.sha256(canonical_bytes).hexdigest()
