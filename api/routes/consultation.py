from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect, Depends, status
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import json

# Import existing utilities
from chat_system import (
    create_chat_room, get_available_rooms, get_messages,
    add_message, get_specialist_response, get_multidisciplinary_summary,
    auto_progress_consultation
)
from db import chats_collection
from api.routes.auth import verify_token

router = APIRouter()

# Pydantic models
class CreateConsultationRequest(BaseModel):
    case_description: str
    creator_name: str

class SendMessageRequest(BaseModel):
    message: str
    user_name: str

class ConsultationRoom(BaseModel):
    id: str
    description: str
    creator: str
    created_at: str
    participants: int
    consultation_stage: str

# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: dict = {}

    async def connect(self, websocket: WebSocket, room_id: str):
        await websocket.accept()
        if room_id not in self.active_connections:
            self.active_connections[room_id] = []
        self.active_connections[room_id].append(websocket)

    def disconnect(self, websocket: WebSocket, room_id: str):
        if room_id in self.active_connections:
            self.active_connections[room_id].remove(websocket)

    async def broadcast(self, room_id: str, message: dict):
        if room_id in self.active_connections:
            for connection in self.active_connections[room_id]:
                await connection.send_json(message)

manager = ConnectionManager()

# Routes
@router.post("/create", response_model=ConsultationRoom, status_code=status.HTTP_201_CREATED)
async def create_consultation(
    request: CreateConsultationRequest,
    user_data: dict = Depends(verify_token)
):
    """Create a new consultation case"""
    try:
        # Generate case ID
        case_id = f"CASE-{datetime.now().strftime('%Y%m%d%H%M%S')}"
        
        # Create chat room
        room_id = create_chat_room(
            case_id,
            request.creator_name,
            request.case_description,
            user_data["user_id"]
        )
        
        # Get room details
        room = chats_collection.find_one({"_id": room_id, "user_id": user_data["user_id"]})
        
        return {
            "id": room_id,
            "description": room["description"],
            "creator": room["creator"],
            "created_at": room["created_at"],
            "participants": len(room["participants"]),
            "consultation_stage": room.get("consultation_stage", "initial")
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating consultation: {str(e)}"
        )

@router.get("/rooms", response_model=List[ConsultationRoom])
async def get_consultation_rooms(user_data: dict = Depends(verify_token)):
    """Get all consultation rooms for the user"""
    try:
        rooms = get_available_rooms(user_data["user_id"])
        return [
            {
                "id": room["id"],
                "description": room["description"],
                "creator": room["creator"],
                "created_at": room["created_at"],
                "participants": room["participants"],
                "consultation_stage": "initial"  # Will be updated from DB
            }
            for room in rooms
        ]
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching rooms: {str(e)}"
        )

@router.get("/{consultation_id}")
async def get_consultation(
    consultation_id: str,
    user_data: dict = Depends(verify_token)
):
    """Get consultation details"""
    try:
        room = chats_collection.find_one(
            {"_id": consultation_id, "user_id": user_data["user_id"]}
        )
        
        if not room:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Consultation not found"
            )
        
        messages = get_messages(consultation_id, user_data["user_id"])
        
        # Transform messages to match frontend interface
        transformed_messages = []
        for msg in messages:
            sender = msg.get("user", "Unknown")
            
            # Extract specialist type from sender name
            specialist_type = None
            if "Radiologist" in sender:
                specialist_type = "radiologist"
            elif "Cardiologist" in sender:
                specialist_type = "cardiologist"
            elif "Pulmonologist" in sender:
                specialist_type = "pulmonologist"
            elif "Neurologist" in sender:
                specialist_type = "neurologist"
            elif "Chief Medical Officer" in sender:
                specialist_type = "summary"
            
            transformed_messages.append({
                "sender": sender,
                "message": msg.get("content", ""),
                "timestamp": msg.get("timestamp", ""),
                "specialist_type": specialist_type
            })
        
        return {
            "id": consultation_id,
            "description": room["description"],
            "creator": room["creator"],
            "created_at": room["created_at"],
            "participants": room["participants"],
            "consultation_stage": room.get("consultation_stage", "initial"),
            "specialist_opinions": room.get("specialist_opinions", []),
            "messages": transformed_messages
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching consultation: {str(e)}"
        )

@router.post("/{consultation_id}/message")
async def send_consultation_message(
    consultation_id: str,
    request: SendMessageRequest,
    user_data: dict = Depends(verify_token)
):
    """Send a message in consultation"""
    try:
        message = add_message(
            consultation_id,
            request.user_name,
            request.message,
            user_data["user_id"]
        )
        
        if not message:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to send message"
            )
        
        # Broadcast to WebSocket clients
        await manager.broadcast(consultation_id, {
            "type": "new_message",
            "data": message
        })
        
        # Return transformed message for frontend
        return {
            "sender": message.get("user", "Unknown"),
            "message": message.get("content", ""),
            "timestamp": message.get("timestamp", ""),
            "specialist_type": message.get("specialist_type")
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error sending message: {str(e)}"
        )

@router.post("/{consultation_id}/start")
async def start_consultation(
    consultation_id: str,
    user_data: dict = Depends(verify_token)
):
    """Start specialist consultation (step-by-step)"""
    try:
        import os
        api_key = os.getenv("OPENAI_API_KEY")
        
        room = chats_collection.find_one(
            {"_id": consultation_id, "user_id": user_data["user_id"]}
        )
        
        if not room:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Consultation not found"
            )
        
        # Update stage
        chats_collection.update_one(
            {"_id": consultation_id, "user_id": user_data["user_id"]},
            {"$set": {"consultation_stage": "specialists"}}
        )
        
        # Get first specialist opinion
        specialist_response = get_specialist_response(
            "Please provide your initial assessment of this case",
            room["description"],
            "radiologist",
            None,
            api_key
        )
        
        add_message(
            consultation_id,
            "Dr. Michael Rodriguez (Radiologist)",
            specialist_response,
            user_data["user_id"]
        )
        
        # Store opinion
        chats_collection.update_one(
            {"_id": consultation_id, "user_id": user_data["user_id"]},
            {"$push": {"specialist_opinions": specialist_response}}
        )
        
        return {"message": "Consultation started successfully"}
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error starting consultation: {str(e)}"
        )

@router.post("/{consultation_id}/auto-complete")
async def auto_complete_consultation(
    consultation_id: str,
    user_data: dict = Depends(verify_token)
):
    """Auto-complete entire consultation"""
    try:
        import os
        api_key = os.getenv("OPENAI_API_KEY")
        
        def progress_callback(message: str, progress: float):
            # Could broadcast progress via WebSocket
            pass
        
        success = auto_progress_consultation(
            consultation_id,
            user_data["user_id"],
            api_key,
            None,
            progress_callback
        )
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to complete consultation"
            )
        
        return {"message": "Consultation completed successfully"}
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error completing consultation: {str(e)}"
        )

@router.websocket("/{consultation_id}/ws")
async def websocket_endpoint(websocket: WebSocket, consultation_id: str):
    """WebSocket endpoint for real-time consultation updates"""
    await manager.connect(websocket, consultation_id)
    try:
        while True:
            data = await websocket.receive_text()
            message_data = json.loads(data)
            
            # Process message (add to database, etc.)
            # Broadcast to all connected clients
            await manager.broadcast(consultation_id, {
                "type": "message",
                "data": message_data
            })
    except WebSocketDisconnect:
        manager.disconnect(websocket, consultation_id)
