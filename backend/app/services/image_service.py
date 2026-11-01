import io
import os
import uuid
import socket
import ipaddress
import urllib.parse
from typing import Tuple, List, Optional
from PIL import Image, ImageOps
from fastapi import HTTPException, status, UploadFile

# Directory for uploads
UPLOAD_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "uploads"))
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Constraints
MAX_AVATAR_SIZE = 2 * 1024 * 1024       # 2 MB
MAX_BANNER_SIZE = 5 * 1024 * 1024       # 5 MB
MAX_POST_IMAGE_SIZE = 5 * 1024 * 1024   # 5 MB per image
MAX_COMBINED_POST_SIZE = 15 * 1024 * 1024 # 15 MB total
MAX_IMAGES_PER_POST = 4

ALLOWED_PIL_FORMATS = {"JPEG", "PNG", "WEBP"}
ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "image/webp"}

def validate_url_ssrf_safe(url: str) -> str:
    """
    Validates that a URL uses http/https and does not resolve to private,
    loopback, link-local, multicast, or reserved IP addresses.
    """
    clean_url = url.strip()
    parsed = urllib.parse.urlparse(clean_url)

    if parsed.scheme.lower() not in ("http", "https"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid image URL scheme. Only HTTP and HTTPS URLs are allowed."
        )

    hostname = parsed.hostname
    if not hostname:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid image URL: missing host."
        )

    # Disallow known localhost / local domain strings immediately
    if hostname.lower() in ("localhost", "127.0.0.1", "0.0.0.0", "::1", "metadata.google.internal"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Access to internal/loopback network addresses is blocked."
        )

    # DNS Resolution & IP safety check
    try:
        addr_info = socket.getaddrinfo(hostname, None)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unable to resolve hostname '{hostname}'."
        )

    for entry in addr_info:
        sockaddr = entry[4]
        ip_str = sockaddr[0]
        try:
            ip_obj = ipaddress.ip_address(ip_str)
            if (
                ip_obj.is_private
                or ip_obj.is_loopback
                or ip_obj.is_link_local
                or ip_obj.is_multicast
                or ip_obj.is_reserved
                or ip_obj.is_unspecified
            ):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Access to private or local network addresses is blocked."
                )
        except HTTPException:
            raise
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid IP address resolution for image URL."
            )

    return clean_url

def process_and_save_image(file_bytes: bytes, purpose: str = "post") -> str:
    """
    Validates file format, strips EXIF metadata, resizes if oversized,
    and saves to disk with a unique safe filename. Returns the public relative URL.
    """
    if purpose == "avatar":
        max_size = MAX_AVATAR_SIZE
        max_dim = (512, 512)
    elif purpose == "banner":
        max_size = MAX_BANNER_SIZE
        max_dim = (1920, 1080)
    else:
        max_size = MAX_POST_IMAGE_SIZE
        max_dim = (2048, 2048)

    if len(file_bytes) > max_size:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File exceeds maximum allowed size of {max_size // (1024 * 1024)}MB."
        )

    try:
        img_buffer = io.BytesIO(file_bytes)
        img = Image.open(img_buffer)
        raw_format = img.format
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is not a valid image."
        )

    if not raw_format or raw_format.upper() not in ALLOWED_PIL_FORMATS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Format '{raw_format}' is not allowed. Only JPEG, PNG, and WebP images are accepted."
        )

    # Normalize orientation and strip EXIF
    try:
        img = ImageOps.exif_transpose(img)
    except Exception:
        pass

    # Ensure image mode is RGB or RGBA (drop palettes, CMYK, etc.)
    if img.mode in ("RGBA", "LA") or (img.mode == "P" and "transparency" in img.info):
        clean_img = img.convert("RGBA")
        out_ext = ".webp"
        save_format = "WEBP"
    else:
        clean_img = img.convert("RGB")
        out_ext = ".webp"
        save_format = "WEBP"

    # Resize preserving aspect ratio if oversized
    clean_img.thumbnail(max_dim, Image.Resampling.LANCZOS)

    # Create new image to guarantee completely stripped metadata
    clean_canvas = Image.new(clean_img.mode, clean_img.size)
    clean_canvas.paste(clean_img)

    # Generate safe unique filename
    unique_name = f"{uuid.uuid4().hex}{out_ext}"
    safe_path = os.path.join(UPLOAD_DIR, unique_name)

    # Verify no path traversal
    if not os.path.abspath(safe_path).startswith(UPLOAD_DIR):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file path."
        )

    clean_canvas.save(safe_path, format=save_format, quality=85, optimize=True)

    return f"/uploads/{unique_name}"
