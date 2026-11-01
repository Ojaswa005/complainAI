from fastapi import APIRouter, HTTPException, Depends
from ..schemas import AIRewriteRequest, AIRewriteResponse
from ..services.ai_service import rewrite_complaint

router = APIRouter(prefix="/ai", tags=["AI Rant Assistant"])

@router.post("/improve", response_model=AIRewriteResponse)
async def improve_complaint(payload: AIRewriteRequest):
    try:
        rewritten, is_fallback = await rewrite_complaint(payload.content, payload.mode)
        return AIRewriteResponse(
            original=payload.content,
            suggestion=rewritten,
            mode=payload.mode,
            is_fallback=is_fallback
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Could not generate AI suggestion: {str(e)}"
        )
