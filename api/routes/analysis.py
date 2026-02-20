from fastapi import APIRouter, HTTPException, UploadFile, File, Depends, status
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import base64
import io
from PIL import Image

# Import existing utilities
from utils_simple import process_file, analyze_image, generate_heatmap, generate_report
from db import qa_analysis_collection
from api.routes.auth import verify_token

router = APIRouter()

# Pydantic models
class AnalysisRequest(BaseModel):
    filename: str
    image_data: str  # base64 encoded image
    enable_xai: bool = True

class AnalysisResponse(BaseModel):
    id: str
    analysis: str
    findings: List[str]
    keywords: List[str]
    doctor_recommendations: dict
    pubmed_articles: Optional[List[dict]] = []
    clinical_trials: Optional[List[dict]] = []
    date: str
    filename: str

class ReportRequest(BaseModel):
    include_references: bool = True

# Routes
@router.post("/upload", status_code=status.HTTP_201_CREATED)
async def upload_image(
    file: UploadFile = File(...),
    user_data: dict = Depends(verify_token)
):
    """Upload and process a medical image"""
    try:
        # Validate file type
        allowed_extensions = ["jpg", "jpeg", "png", "dcm", "nii", "nii.gz"]
        file_ext = file.filename.split('.')[-1].lower()
        if file_ext not in allowed_extensions:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File type not allowed. Allowed types: {', '.join(allowed_extensions)}"
            )
        
        # Read and process file
        contents = await file.read()
        
        # Create a file-like object for processing
        from io import BytesIO
        file_obj = BytesIO(contents)
        file_obj.name = file.filename
        
        # Process the file
        file_data = process_file(file_obj)
        
        if not file_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to process file"
            )
        
        # Convert image to base64 for storage/transmission
        buffered = BytesIO()
        file_data["data"].save(buffered, format="PNG")
        img_base64 = base64.b64encode(buffered.getvalue()).decode()
        
        return {
            "message": "File uploaded successfully",
            "filename": file.filename,
            "file_type": file_data["type"],
            "image_data": img_base64
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing file: {str(e)}"
        )

@router.post("/analyze", response_model=AnalysisResponse, status_code=status.HTTP_201_CREATED)
async def analyze_medical_image(
    request: AnalysisRequest,
    user_data: dict = Depends(verify_token)
):
    """Analyze medical image using AI"""
    try:
        # Decode base64 image
        img_bytes = base64.b64decode(request.image_data)
        image = Image.open(io.BytesIO(img_bytes))
        
        # Get OpenAI API key from environment
        import os
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="OpenAI API key not configured"
            )
        
        # Analyze image
        analysis_results = analyze_image(image, api_key, enable_xai=request.enable_xai)
        
        # Save to database
        analysis_results["filename"] = request.filename
        analysis_results["date"] = datetime.now().isoformat()
        analysis_results["user_id"] = user_data["user_id"]
        
        # Use the UUID id from analyze_image function
        analysis_id = analysis_results["id"]
        
        result = qa_analysis_collection.insert_one(analysis_results)
        
        return {
            "id": analysis_id,
            "analysis": analysis_results["analysis"],
            "findings": analysis_results.get("findings", []),
            "keywords": analysis_results.get("keywords", []),
            "doctor_recommendations": analysis_results.get("doctor_recommendations", {}),
            "date": analysis_results["date"],
            "filename": request.filename
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error analyzing image: {str(e)}"
        )

@router.get("/history")
async def get_analysis_history(
    limit: int = 10,
    user_data: dict = Depends(verify_token)
):
    """Get user's analysis history"""
    try:
        analyses = list(
            qa_analysis_collection.find(
                {"user_id": user_data["user_id"]},
                {"_id": 0}
            )
            .sort("date", -1)
            .limit(limit)
        )
        
        return {"analyses": analyses}
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching history: {str(e)}"
        )

@router.get("/{analysis_id}")
async def get_analysis(
    analysis_id: str,
    user_data: dict = Depends(verify_token)
):
    """Get specific analysis by ID"""
    try:
        analysis = qa_analysis_collection.find_one(
            {"id": analysis_id, "user_id": user_data["user_id"]},
            {"_id": 0}
        )
        
        if not analysis:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Analysis not found"
            )
        
        return analysis
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching analysis: {str(e)}"
        )

@router.post("/{analysis_id}/report")
async def generate_analysis_report(
    analysis_id: str,
    report_request: ReportRequest,
    user_data: dict = Depends(verify_token)
):
    """Generate PDF report for an analysis"""
    try:
        # Get analysis
        analysis = qa_analysis_collection.find_one(
            {"id": analysis_id, "user_id": user_data["user_id"]},
            {"_id": 0}
        )
        
        if not analysis:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Analysis not found"
            )
        
        # Generate report
        pdf_buffer = generate_report(analysis, report_request.include_references)
        
        if not pdf_buffer:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to generate report"
            )
        
        # Convert to base64
        pdf_base64 = base64.b64encode(pdf_buffer.read()).decode()
        
        return {
            "report_data": pdf_base64,
            "filename": f"medical_report_{analysis_id}.pdf"
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating report: {str(e)}"
        )
