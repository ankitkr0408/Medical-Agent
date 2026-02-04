from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel
from typing import List
from datetime import datetime

# Import existing Q&A system
from report_qa_chat import ReportQAChat
from db import qa_chat_collection
from api.routes.auth import verify_token

router = APIRouter()
qa_chat_system = ReportQAChat()

# Pydantic models
class CreateQASessionRequest(BaseModel):
    room_name: str
    creator_name: str

class AskQuestionRequest(BaseModel):
    question: str

class QASessionResponse(BaseModel):
    id: str
    room_name: str
    creator: str
    created_at: str

# Routes
@router.post("/create", response_model=QASessionResponse, status_code=status.HTTP_201_CREATED)
async def create_qa_session(
    request: CreateQASessionRequest,
    user_data: dict = Depends(verify_token)
):
    """Create a new Q&A session"""
    try:
        room_id = qa_chat_system.create_qa_room(
            request.creator_name,
            request.room_name,
            user_data["user_id"]
        )
        
        # Get room details
        room = qa_chat_collection.find_one({"_id": room_id, "user_id": user_data["user_id"]})
        
        return {
            "id": room_id,
            "room_name": room["room_name"],
            "creator": room["creator"],
            "created_at": room["created_at"]
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating Q&A session: {str(e)}"
        )

@router.get("/sessions", response_model=List[QASessionResponse])
async def get_qa_sessions(user_data: dict = Depends(verify_token)):
    """Get all Q&A sessions for the user"""
    try:
        sessions = list(
            qa_chat_collection.find(
                {"user_id": user_data["user_id"]}
            )
            .sort("created_at", -1)
        )
        
        return [
            {
                "id": session.get("_id", ""),
                "room_name": session.get("room_name", ""),
                "creator": session.get("creator", ""),
                "created_at": session.get("created_at", "")
            }
            for session in sessions
        ]
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching Q&A sessions: {str(e)}"
        )

@router.post("/{session_id}/question")
async def ask_question(
    session_id: str,
    request: AskQuestionRequest,
    user_data: dict = Depends(verify_token)
):
    """Ask a question in Q&A session"""
    try:
        # Verify session exists and belongs to user
        session = qa_chat_collection.find_one(
            {"_id": session_id, "user_id": user_data["user_id"]}
        )
        
        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Q&A session not found"
            )
        
        # Get answer from Q&A system
        import os
        api_key = os.getenv("OPENAI_API_KEY")
        
        answer = qa_chat_system.get_qa_response(
            session_id,
            request.question,
            user_data["user_id"],
            api_key
        )
        
        return {
            "question": request.question,
            "answer": answer,
            "timestamp": datetime.now().isoformat()
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing question: {str(e)}"
        )

@router.get("/{session_id}/history")
async def get_qa_history(
    session_id: str,
    user_data: dict = Depends(verify_token)
):
    """Get Q&A history for a session"""
    try:
        session = qa_chat_collection.find_one(
            {"_id": session_id, "user_id": user_data["user_id"]}
        )
        
        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Q&A session not found"
            )
        
        messages = session.get("messages", [])
        
        return {
            "session_id": session_id,
            "room_name": session.get("room_name", ""),
            "messages": messages
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching Q&A history: {str(e)}"
        )
