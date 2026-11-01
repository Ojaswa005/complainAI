from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, status
from pydantic import BaseModel
from typing import List, Optional
from ..auth import get_current_user
from ..models import User
from ..services.image_service import (
    process_and_save_image,
    validate_url_ssrf_safe,
    MAX_COMBINED_POST_SIZE,
    MAX_IMAGES_PER_POST
)

router = APIRouter(prefix="/uploads", tags=["Uploads"])

class ValidateUrlRequest(BaseModel):
    url: str

class ValidateUrlResponse(BaseModel):
    valid: bool
    url: str

class UploadResponse(BaseModel):
    url: str

class MultiUploadResponse(BaseModel):
    urls: List[str]

@router.post("/image", response_model=UploadResponse)
async def upload_single_image(
    file: UploadFile = File(...),
    purpose: str = Form("post"),
    current_user: User = Depends(get_current_user)
):
    """
    Upload a single image (avatar, banner, or post image).
    Enforces format (JPEG, PNG, WebP), file size limits, EXIF stripping, and sanitization.
    """
    file_bytes = await file.read()
    url = process_and_save_image(file_bytes, purpose=purpose)
    return UploadResponse(url=url)

@router.post("/images", response_model=MultiUploadResponse)
async def upload_multiple_images(
    files: List[UploadFile] = File(...),
    current_user: User = Depends(get_current_user)
):
    """
    Upload up to 4 images for a post (max 15MB total).
    """
    if len(files) > MAX_IMAGES_PER_POST:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Maximum {MAX_IMAGES_PER_POST} images allowed per post."
        )

    total_bytes = 0
    saved_urls = []

    for file in files:
        content = await file.read()
        total_bytes += len(content)
        if total_bytes > MAX_COMBINED_POST_SIZE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Total upload size exceeds 15MB limit."
            )
        url = process_and_save_image(content, purpose="post")
        saved_urls.append(url)

    return MultiUploadResponse(urls=saved_urls)

@router.post("/validate-url", response_model=ValidateUrlResponse)
def validate_image_url(
    payload: ValidateUrlRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Validates an image URL against SSRF and unsafe schemes.
    """
    safe_url = validate_url_ssrf_safe(payload.url)
    return ValidateUrlResponse(valid=True, url=safe_url)
