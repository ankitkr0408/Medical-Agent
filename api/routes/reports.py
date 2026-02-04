from fastapi import APIRouter, HTTPException, Depends, status, Response
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import uuid

from db import qa_analysis_collection, db
from api.routes.auth import verify_token

router = APIRouter()

# Get reports collection
reports_collection = db["reports"] if db is not None else None

# Pydantic models
class GenerateReportRequest(BaseModel):
    analysis_id: str
    title: Optional[str] = None

class ReportResponse(BaseModel):
    id: str
    title: str
    analysis_id: str
    content: str
    created_at: str
    filename: str

# Routes
@router.get("/list", response_model=List[ReportResponse])
async def get_reports(user_data: dict = Depends(verify_token)):
    """Get all reports for the user"""
    try:
        reports = list(
            reports_collection.find(
                {"user_id": user_data["user_id"]}
            ).sort("created_at", -1)
        )
        
        return [
            {
                "id": report.get("_id", ""),
                "title": report.get("title", ""),
                "analysis_id": report.get("analysis_id", ""),
                "content": report.get("content", ""),
                "created_at": report.get("created_at", ""),
                "filename": report.get("filename", "")
            }
            for report in reports
        ]
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching reports: {str(e)}"
        )

@router.post("/generate", response_model=ReportResponse, status_code=status.HTTP_201_CREATED)
async def generate_report(
    request: GenerateReportRequest,
    user_data: dict = Depends(verify_token)
):
    """Generate a report from an analysis"""
    try:
        # Get the analysis
        analysis = qa_analysis_collection.find_one(
            {"id": request.analysis_id, "user_id": user_data["user_id"]}
        )
        
        if not analysis:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Analysis not found"
            )
        
        # Generate report content
        title = request.title or f"Medical Report - {analysis.get('filename', 'Unknown')}"
        content = format_analysis_as_report(analysis, title)
        
        # Create report document
        report_id = str(uuid.uuid4())
        filename = f"report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.md"
        
        report_data = {
            "_id": report_id,
            "user_id": user_data["user_id"],
            "analysis_id": request.analysis_id,
            "title": title,
            "content": content,
            "filename": filename,
            "created_at": datetime.now().isoformat()
        }
        
        reports_collection.insert_one(report_data)
        
        return {
            "id": report_id,
            "title": title,
            "analysis_id": request.analysis_id,
            "content": content,
            "created_at": report_data["created_at"],
            "filename": filename
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating report: {str(e)}"
        )

@router.get("/{report_id}")
async def get_report(
    report_id: str,
    user_data: dict = Depends(verify_token)
):
    """Get a specific report"""
    try:
        report = reports_collection.find_one(
            {"_id": report_id, "user_id": user_data["user_id"]}
        )
        
        if not report:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Report not found"
            )
        
        return {
            "id": report.get("_id", ""),
            "title": report.get("title", ""),
            "analysis_id": report.get("analysis_id", ""),
            "content": report.get("content", ""),
            "created_at": report.get("created_at", ""),
            "filename": report.get("filename", "")
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching report: {str(e)}"
        )

@router.get("/{report_id}/download")
async def download_report(
    report_id: str,
    user_data: dict = Depends(verify_token)
):
    """Download a report as a file"""
    try:
        report = reports_collection.find_one(
            {"_id": report_id, "user_id": user_data["user_id"]}
        )
        
        if not report:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Report not found"
            )
        
        filename = report.get("filename", "report.md")
        content = report.get("content", "")
        
        return Response(
            content=content.encode('utf-8'),
            media_type="text/markdown",
            headers={
                "Content-Disposition": f'attachment; filename="{filename}"'
            }
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error downloading report: {str(e)}"
        )


def format_analysis_as_report(analysis: dict, title: str) -> str:
    """Format analysis data as a medical report"""
    
    report = f"""# {title}

**Generated:** {datetime.now().strftime('%B %d, %Y at %I:%M %p')}
**Image:** {analysis.get('filename', 'Unknown')}
**Analysis Date:** {analysis.get('date', 'Unknown')[:10]}

---

## AI Analysis

{analysis.get('analysis', 'No analysis available')}

"""
    
    # Add findings
    findings = analysis.get('findings', [])
    if findings:
        report += """
## Key Findings

"""
        for i, finding in enumerate(findings, 1):
            report += f"{i}. {finding}\n"
        report += "\n"
    
    # Add keywords
    keywords = analysis.get('keywords', [])
    if keywords:
        report += """
## Medical Keywords

"""
        report += ", ".join(keywords) + "\n\n"
    
    # Add doctor recommendations
    recommendations = analysis.get('doctor_recommendations', {})
    if recommendations:
        report += """
## Doctor Recommendations

"""
        
        urgency = recommendations.get('urgency_level', 'Unknown')
        report += f"**Urgency Level:** {urgency}\n\n"
        
        if recommendations.get('specialist_referrals'):
            report += "**Recommended Specialists:**\n"
            for specialist in recommendations['specialist_referrals']:
                report += f"- {specialist}\n"
            report += "\n"
        
        if recommendations.get('follow_up_timeframe'):
            report += f"**Follow-up Timeframe:** {recommendations['follow_up_timeframe']}\n\n"
        
        if recommendations.get('additional_tests'):
            report += "**Additional Tests Recommended:**\n"
            for test in recommendations['additional_tests']:
                report += f"- {test}\n"
            report += "\n"
    
    # Add disclaimer
    report += """
---

## Disclaimer

This report is generated by an AI system for educational and informational purposes only. It is NOT a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition.

**Generated by Medical Agent AI**
"""
    
    return report
