from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from ..database import get_db
from ..models import User
from ..schemas import UserResponse, UserCreate, LoginRequest, Token
from ..auth import create_access_token, get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/login", response_model=Token)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    ident = payload.username_or_email.strip().lower()
    user = db.query(User).filter(
        (User.username.ilike(ident)) | (User.email.ilike(ident))
    ).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password"
        )
        
    access_token = create_access_token({"sub": user.id, "email": user.email, "username": user.username})
    return Token(access_token=access_token, user=UserResponse.from_orm(user))

@router.post("/register", response_model=Token)
def register(payload: UserCreate, db: Session = Depends(get_db)):
    # Check if username or email already exists
    existing = db.query(User).filter(
        (User.username.ilike(payload.username)) | (User.email.ilike(payload.email))
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username or email is already registered"
        )
        
    user = User(
        username=payload.username.lower(),
        display_name=payload.display_name or payload.username,
        email=payload.email.lower(),
        avatar_url=payload.avatar_url or f"https://api.dicebear.com/7.x/bottts/svg?seed={payload.username}",
        bio=payload.bio or "AI tester & complaint enthusiast.",
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    access_token = create_access_token({"sub": user.id, "email": user.email, "username": user.username})
    return Token(access_token=access_token, user=UserResponse.from_orm(user))

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.get("/demo-users", response_model=List[UserResponse])
def get_demo_users(db: Session = Depends(get_db)):
    """List available demo users for quick switching/testing"""
    users = db.query(User).limit(6).all()
    return users

@router.post("/demo-switch/{username}", response_model=Token)
def demo_switch(username: str, db: Session = Depends(get_db)):
    """Convenience endpoint to switch to a demo account instantly"""
    user = db.query(User).filter(User.username.ilike(username)).first()
    if not user:
        raise HTTPException(status_code=404, detail="Demo user not found")
        
    access_token = create_access_token({"sub": user.id, "email": user.email, "username": user.username})
    return Token(access_token=access_token, user=UserResponse.from_orm(user))
