"""
HISAB — Cryptographic Credential Protection & Razorpay API Verifier.
Protects API credentials using AES-256-GCM encryption and PBKDF2-HMAC-SHA256 salted hashing.
"""

import os
import re
import base64
import hashlib
import secrets
from typing import Tuple, Dict, Any, Optional
import httpx
from cryptography.hazmat.primitives.ciphers.aead import AESGCM


# Derive or load 256-bit AES master key from environment or fallback deterministic key
_MASTER_KEY_HEX = os.getenv("HISAB_MASTER_CRYPTO_KEY")
if not _MASTER_KEY_HEX:
    # 32 bytes = 256 bits
    _MASTER_KEY = hashlib.sha256(b"HISAB_AUTHORITATIVE_FINTECH_KEY_2026_MASTER").digest()
else:
    _MASTER_KEY = bytes.fromhex(_MASTER_KEY_HEX.strip())


def mask_key_id(key_id: Optional[str]) -> str:
    """Masks a Razorpay Key ID for safe display (e.g., rzp_test_K2918••••)."""
    if not key_id:
        return "Not Configured"
    cleaned = key_id.strip()
    if len(cleaned) <= 8:
        return "••••••••"
    prefix = cleaned[:10]
    return f"{prefix}••••"


def hash_credential(secret: str, salt: Optional[str] = None) -> Tuple[str, str]:
    """
    Hashes an API secret or webhook secret using PBKDF2-HMAC-SHA256 with a unique salt.
    Returns (hex_hash, hex_salt). Cannot be reversed.
    """
    if not salt:
        salt_bytes = secrets.token_bytes(16)
        salt_hex = salt_bytes.hex()
    else:
        salt_bytes = bytes.fromhex(salt)
        salt_hex = salt

    derived = hashlib.pbkdf2_hmac("sha256", secret.encode("utf-8"), salt_bytes, 100_000)
    return derived.hex(), salt_hex


def verify_credential_hash(secret: str, stored_hash: str, salt: str) -> bool:
    """Verifies a candidate secret against a stored PBKDF2 hash in constant time."""
    candidate_hash, _ = hash_credential(secret, salt=salt)
    return secrets.compare_digest(candidate_hash, stored_hash)


def encrypt_credential(secret: str) -> str:
    """
    Encrypts an API secret using AES-256-GCM authenticated encryption.
    Returns base64-encoded string containing nonce + ciphertext + tag.
    """
    aesgcm = AESGCM(_MASTER_KEY)
    nonce = secrets.token_bytes(12)  # 96-bit nonce for AES-GCM
    ciphertext = aesgcm.encrypt(nonce, secret.encode("utf-8"), None)
    payload = nonce + ciphertext
    return base64.b64encode(payload).decode("ascii")


def decrypt_credential(encrypted_b64: str) -> Optional[str]:
    """Decrypts an AES-256-GCM encrypted credential."""
    try:
        payload = base64.b64decode(encrypted_b64.encode("ascii"))
        if len(payload) < 28:
            return None
        nonce = payload[:12]
        ciphertext = payload[12:]
        aesgcm = AESGCM(_MASTER_KEY)
        decrypted = aesgcm.decrypt(nonce, ciphertext, None)
        return decrypted.decode("utf-8")
    except Exception:
        return None


def verify_razorpay_api_credentials(
    key_id: str,
    key_secret: str,
    timeout_sec: float = 3.5,
) -> Tuple[bool, str, Dict[str, Any]]:
    """
    Tests live connection to Razorpay API with basic authentication.
    Falls back gracefully to format inspection if network is unreachable or in sandbox.
    """
    clean_key = key_id.strip()
    clean_secret = key_secret.strip()

    # Syntax sanity check
    if not (clean_key.startswith("rzp_test_") or clean_key.startswith("rzp_live_")):
        return False, "Invalid Key ID format. Razorpay keys must start with 'rzp_test_' or 'rzp_live_'.", {}

    if len(clean_secret) < 10:
        return False, "Key Secret is too short. Please verify your Razorpay API Secret.", {}

    # Attempt live validation ping to Razorpay API
    try:
        with httpx.Client(timeout=timeout_sec) as client:
            resp = client.get(
                "https://api.razorpay.com/v1/payments",
                auth=(clean_key, clean_secret),
                params={"count": 1},
            )
            if resp.status_code == 200:
                data = resp.json()
                items_count = data.get("count", 0)
                return True, f"Credentials verified successfully via live Razorpay API. (Items accessible: {items_count})", {
                    "live_verified": True,
                    "status_code": 200,
                    "entity": "payments_feed",
                }
            elif resp.status_code == 401:
                return False, "Authentication failed. Razorpay rejected this Key ID / Key Secret combination (HTTP 401 Unauthorized).", {
                    "live_verified": True,
                    "status_code": 401,
                }
            else:
                return False, f"Razorpay API responded with status {resp.status_code}: {resp.text[:100]}", {}
    except (httpx.ConnectError, httpx.TimeoutException, httpx.NetworkError) as net_err:
        # If offline or isolated network, accept valid test keys
        if clean_key.startswith("rzp_test_") and len(clean_secret) >= 16:
            return True, "Key format verified (Local Sandbox / Offline Mode active).", {
                "live_verified": False,
                "offline_mode": True,
                "network_note": str(net_err),
            }
        return False, f"Could not reach Razorpay API: {str(net_err)}", {}
    except Exception as e:
        return False, f"Unexpected error while validating credentials: {str(e)}", {}
