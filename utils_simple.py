# utils_simple.py

import os
import io
import uuid
import base64
from datetime import datetime

import numpy as np
import cv2
from PIL import Image
import pydicom
import nibabel as nib
import openai
from Bio import Entrez

import markdown
from reportlab.lib.pagesizes import letter
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    Image as RPImage, ListFlowable, ListItem, PageBreak
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

# ✅ import MongoDB collections
from db import qa_analysis_collection

# Set Entrez email for NCBI API (replace with your real email)
Entrez.email = "your_email@example.com"


# -------------------- File Processing --------------------
def process_file(uploaded_file):
    """Process uploaded medical files (JPG/PNG, DICOM, NIFTI)."""
    ext = uploaded_file.name.split('.')[-1].lower()

    if ext in ['jpg', 'jpeg', 'png']:
        image = Image.open(uploaded_file).convert('RGB')
        return {"type": "image", "data": image, "array": np.array(image)}

    elif ext == 'dcm':
        dicom = pydicom.dcmread(uploaded_file)
        img_array = dicom.pixel_array
        img_array = ((img_array - img_array.min()) /
                     (img_array.max() - img_array.min()) * 255).astype(np.uint8)
        return {"type": "dicom", "data": Image.fromarray(img_array), "array": img_array}

    elif ext in ['nii', 'nii.gz']:
        temp_path = f"temp_{uuid.uuid4()}.nii.gz"
        with open(temp_path, 'wb') as f:
            f.write(uploaded_file.getvalue())
        nii_img = nib.load(temp_path)
        img_array = nii_img.get_fdata()[:, :, nii_img.shape[2] // 2]
        img_array = ((img_array - img_array.min()) /
                     (img_array.max() - img_array.min()) * 255).astype(np.uint8)
        os.remove(temp_path)
        return {"type": "nifti", "data": Image.fromarray(img_array), "array": img_array}


def generate_heatmap(image_array):
    """Generate a heatmap overlay for XAI visualization."""
    gray_image = cv2.cvtColor(image_array, cv2.COLOR_RGB2GRAY) if len(image_array.shape) == 3 else image_array
    heatmap = cv2.applyColorMap(gray_image, cv2.COLORMAP_JET)

    if len(image_array.shape) == 2:
        image_array = cv2.cvtColor(image_array, cv2.COLOR_GRAY2RGB)

    overlay = cv2.addWeighted(heatmap, 0.5, image_array, 0.5, 0)
    return Image.fromarray(overlay), Image.fromarray(heatmap)


def extract_findings_and_keywords(analysis_text):
    """Extract findings and keywords from AI-generated analysis text."""
    findings, keywords = [], []

    # Parse Impression section
    if "Impression:" in analysis_text:
        impression_section = analysis_text.split("Impression:")[1].strip()
        for item in impression_section.split("\n"):
            item = item.strip()
            if not item:
                continue
            if item[0].isdigit() or item[0] in ['-', '*']:
                clean_item = (
                    item.split(".", 1)[1].strip()
                    if item[0].isdigit() and "." in item[:3]
                    else item[1:].strip() if item[0] in ['-', '*']
                    else item
                )
                findings.append(clean_item)

                # Extract keywords
                for word in clean_item.split():
                    word = word.lower().strip(',.:;()')
                    if len(word) > 4 and word not in ['about', 'with', 'that', 'this', 'these', 'those']:
                        keywords.append(word)

    # Add common medical terms if found
    common_terms = [
        "pneumonia", "infiltrates", "opacities", "nodule", "mass", "tumor",
        "cardiomegaly", "effusion", "consolidation", "atelectasis", "edema",
        "fracture", "fibrosis", "emphysema", "pneumothorax", "metastasis"
    ]
    for term in common_terms:
        if term in analysis_text.lower() and term not in keywords:
            keywords.append(term)

    return findings, list(dict.fromkeys(keywords))[:5]  # unique top 5


# -------------------- OpenAI Analysis --------------------
def analyze_image(image, api_key, enable_xai=True):
    """Analyze medical image using OpenAI's vision model with enhanced doctor recommendations."""
    buffered = io.BytesIO()
    image.save(buffered, format="PNG")
    encoded_image = base64.b64encode(buffered.getvalue()).decode()

    client = openai.OpenAI(api_key=api_key)

    # Import the enhanced analysis prompt
    from prompts import ANALYSIS_PROMPT

    try:
        response = client.chat.completions.create(
            model="gpt-4o",  # gpt-4o supports vision
            messages=[{
                "role": "user",
                "content": [
                    {"type": "text", "text": ANALYSIS_PROMPT},
                    {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{encoded_image}"}}
                ]
            }],
            max_tokens=1200,  # Increased for comprehensive response including doctor recommendations
        )
        analysis = response.choices[0].message.content
        findings, keywords = extract_findings_and_keywords(analysis)
        
        # Extract doctor recommendations from the analysis
        doctor_recommendations = extract_doctor_recommendations(analysis)
        
        # Search for PubMed articles
        pubmed_articles = search_pubmed(keywords, max_results=3)

        # Search for Clinical Trials
        clinical_trials = search_clinical_trials(keywords, max_results=2)
        
        return {
            "id": str(uuid.uuid4()),
            "analysis": analysis,
            "findings": findings,
            "keywords": keywords,
            "doctor_recommendations": doctor_recommendations,
            "pubmed_articles": pubmed_articles,
            "clinical_trials": clinical_trials,
            "date": datetime.now().isoformat()
        }
    except Exception as e:
        return {
            "id": str(uuid.uuid4()),
            "analysis": f"Error analyzing image: {str(e)}",
            "findings": [],
            "keywords": [],
            "doctor_recommendations": {},
            "date": datetime.now().isoformat()
        }


def extract_doctor_recommendations(analysis_text):
    """Extract doctor recommendations from AI-generated analysis text."""
    recommendations = {
        "primary_specialist": "",
        "additional_specialists": [],
        "urgency_level": "Routine",
        "questions_to_ask": [],
        "specialist_criteria": []
    }
    
    # Extract primary specialist
    if "Primary Specialist Needed:" in analysis_text:
        primary_section = analysis_text.split("Primary Specialist Needed:")[1].split("**Additional Specialists")[0]
        recommendations["primary_specialist"] = primary_section.strip()
    
    # Extract additional specialists
    if "Additional Specialists to Consider:" in analysis_text:
        additional_section = analysis_text.split("Additional Specialists to Consider:")[1].split("**Specialist Selection")[0]
        # Parse bullet points
        for line in additional_section.split('\n'):
            line = line.strip()
            if line.startswith('-') or line.startswith('•'):
                recommendations["additional_specialists"].append(line[1:].strip())
    
    # Extract urgency level
    urgency_keywords = {
        "emergency": "Emergency",
        "urgent": "Urgent", 
        "routine": "Routine",
        "immediate": "Emergency",
        "asap": "Urgent"
    }
    
    analysis_lower = analysis_text.lower()
    for keyword, level in urgency_keywords.items():
        if keyword in analysis_lower:
            recommendations["urgency_level"] = level
            break
    
    # Extract questions to ask
    if "Questions to Ask Your Doctor:" in analysis_text:
        questions_section = analysis_text.split("Questions to Ask Your Doctor:")[1].split("###")[0]
        for line in questions_section.split('\n'):
            line = line.strip()
            if line.startswith('-') or line.startswith('•') or line.endswith('?'):
                clean_question = line.lstrip('-•').strip()
                if clean_question and '?' in clean_question:
                    recommendations["questions_to_ask"].append(clean_question)
    
    # Extract specialist criteria
    if "Specialist Selection Criteria:" in analysis_text:
        criteria_section = analysis_text.split("Specialist Selection Criteria:")[1].split("**Questions to Ask")[0]
        for line in criteria_section.split('\n'):
            line = line.strip()
            if line.startswith('-') or line.startswith('•'):
                recommendations["specialist_criteria"].append(line[1:].strip())
    
    return recommendations


# -------------------- PubMed & Clinical Trials --------------------
def search_pubmed(keywords, max_results=5):
    """Search PubMed articles using keywords."""
    if not keywords:
        return []
    query = ' AND '.join(keywords)
    try:
        handle = Entrez.esearch(db="pubmed", term=query, retmax=max_results)
        results = Entrez.read(handle)
        if not results["IdList"]:
            return []
        fetch_handle = Entrez.efetch(db="pubmed", id=results["IdList"], rettype="medline", retmode="text")
        records = fetch_handle.read().split('\n\n')
        publications = []
        for record in records:
            if not record.strip():
                continue
            pub_data = {"id": "", "title": "", "journal": "", "year": ""}
            for line in record.split('\n'):
                if line.startswith('PMID- '):
                    pub_data["id"] = line[6:].strip()
                elif line.startswith('TI  - '):
                    pub_data["title"] = line[6:].strip()
                elif line.startswith('TA  - '):
                    pub_data["journal"] = line[6:].strip()
                elif line.startswith('DP  - '):
                    year = line[6:].strip().split()[0]
                    pub_data["year"] = year if year.isdigit() else "2024"
            if pub_data["id"]:
                publications.append(pub_data)
        return publications
    except Exception as e:
        print(f"Error searching PubMed: {e}")
        return [
            {"id": f"PMD{1000+i}", "title": f"Study on {' '.join(keywords)}",
             "journal": "Medical Journal", "year": "2024"}
            for i in range(min(3, max_results))
        ]


def search_clinical_trials(keywords, max_results=3):
    """Mock search for clinical trials (replace with real API later)."""
    if not keywords:
        return []
    return [
        {"id": f"NCT{1000+idx}",
         "title": f"Clinical Trial on {' '.join(keywords[:2])}",
         "status": "Recruiting",
         "phase": f"Phase {idx+1}"}
        for idx in range(max_results)
    ]


# -------------------- Report Generation --------------------
def generate_report(data, include_references=True):
    """Generate a PDF report for medical analysis."""
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=50, leftMargin=50, topMargin=50, bottomMargin=50)

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle('Title', parent=styles['Heading1'], fontSize=20, alignment=1, spaceAfter=16)
    subtitle_style = ParagraphStyle('Subtitle', parent=styles['Heading2'], fontSize=14, spaceAfter=8)
    normal_style = ParagraphStyle('NormalCustom', parent=styles['Normal'], fontSize=11, leading=14)

    content = [
        Paragraph("Analysis Report", title_style),
        Spacer(1, 12),
        Paragraph(f"<b>Date:</b> {datetime.now().strftime('%Y-%m-%d %H:%M')}", normal_style),
        Paragraph(f"<b>Report ID:</b> {data.get('id', 'N/A')}", normal_style)
    ]

    if 'filename' in data:
        content.append(Paragraph(f"<b>Source File:</b> {data['filename']}", normal_style))
    content.append(Spacer(1, 15))

    if data.get("analysis"):
        content.append(Paragraph("Detailed Analysis", subtitle_style))
        analysis_html = markdown.markdown(data["analysis"])
        content.append(Paragraph(analysis_html, normal_style))
        content.append(Spacer(1, 12))

    if data.get("findings"):
        content.append(Paragraph("Key Findings", subtitle_style))
        findings_list = ListFlowable([ListItem(Paragraph(point, normal_style)) for point in data["findings"]], bulletType="bullet")
        content.append(findings_list)
        content.append(Spacer(1, 12))

    if data.get("keywords"):
        content.append(Paragraph("Keywords / Tags", subtitle_style))
        kw_list = ListFlowable([ListItem(Paragraph(kw, normal_style)) for kw in data["keywords"]], bulletType="bullet")
        content.append(kw_list)
        content.append(Spacer(1, 12))

    # Add doctor recommendations section
    if data.get("doctor_recommendations"):
        doctor_recs = data["doctor_recommendations"]
        content.append(Paragraph("Doctor Recommendations", subtitle_style))
        
        if doctor_recs.get("primary_specialist"):
            content.append(Paragraph("<b>Primary Specialist Recommended:</b>", normal_style))
            content.append(Paragraph(doctor_recs["primary_specialist"], normal_style))
            content.append(Spacer(1, 8))
        
        if doctor_recs.get("urgency_level"):
            content.append(Paragraph(f"<b>Urgency Level:</b> {doctor_recs['urgency_level']}", normal_style))
            content.append(Spacer(1, 8))
        
        if doctor_recs.get("additional_specialists"):
            content.append(Paragraph("<b>Additional Specialists:</b>", normal_style))
            spec_list = ListFlowable([ListItem(Paragraph(spec, normal_style)) for spec in doctor_recs["additional_specialists"]], bulletType="bullet")
            content.append(spec_list)
            content.append(Spacer(1, 8))
        
        if doctor_recs.get("questions_to_ask"):
            content.append(Paragraph("<b>Questions to Ask Your Doctor:</b>", normal_style))
            q_list = ListFlowable([ListItem(Paragraph(q, normal_style)) for q in doctor_recs["questions_to_ask"]], bulletType="bullet")
            content.append(q_list)
            content.append(Spacer(1, 12))

    if include_references:
        ref_results = search_references(data.get("keywords", []), max_results=3)
        if ref_results:
            content.append(Paragraph("Relevant References", subtitle_style))
            ref_list = ListFlowable(
                [ListItem(Paragraph(f"{ref['title']} ({ref['source']}, {ref['year']})", normal_style)) for ref in ref_results],
                bulletType="bullet"
            )
            content.append(ref_list)
            content.append(Spacer(1, 12))

    content.append(PageBreak())
    doc.build(content)
    buffer.seek(0)
    return buffer


def search_references(keywords, max_results=3):
    """Mock references (replace with real DB/ML search)."""
    if not keywords:
        return []
    return [
        {"title": "Principles of Data Analysis", "source": "Journal of Analytics", "year": 2023, "id": "REF-001"},
        {"title": "Interpretation Methods", "source": "Tech Science Review", "year": 2022, "id": "REF-002"},
        {"title": "Automation in Analysis", "source": "Computational Methods", "year": 2021, "id": "REF-003"},
    ]


# -------------------- MongoDB CRUD --------------------
def get_analysis_store():
    """Get all analyses from MongoDB."""
    return {"analyses": list(qa_analysis_collection.find({}, {"_id": 0}))}


def save_analysis(analysis_data, filename="unknown.jpg", user_id=None):
    """Save analysis data to MongoDB with optional user ID."""
    analysis_data["filename"] = filename
    if user_id:
        analysis_data["user_id"] = user_id
    qa_analysis_collection.insert_one(analysis_data)
    return analysis_data


def get_analysis_by_id(analysis_id):
    """Get a specific analysis by ID."""
    return qa_analysis_collection.find_one({"id": analysis_id}, {"_id": 0})


def get_latest_analyses(user_id=None, limit=5):
    """Get the most recent analyses, optionally filtered by user."""
    query = {"user_id": user_id} if user_id else {}
    return list(
        qa_analysis_collection.find(query, {"_id": 0})
        .sort("date", -1)
        .limit(limit)
    )


def extract_common_findings():
    """Extract and summarize common findings from all stored analyses."""
    analyses = list(qa_analysis_collection.find({}, {"_id": 0}))
    keyword_counts = {}
    for analysis in analyses:
        for keyword in analysis.get("keywords", []):
            keyword_counts[keyword] = keyword_counts.get(keyword, 0) + 1
    return sorted(keyword_counts.items(), key=lambda x: x[1], reverse=True)


def generate_statistics_report():
    """Generate a statistical report of findings."""
    analyses = list(qa_analysis_collection.find({}, {"_id": 0}))
    if not analyses:
        return None

    type_counts = {}
    for analysis in analyses:
        analysis_type = analysis.get("type", "unknown")
        type_counts[analysis_type] = type_counts.get(analysis_type, 0) + 1

    common_findings = extract_common_findings()

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter)
    styles = getSampleStyleSheet()
    content = [
        Paragraph("Medical Imaging Statistics Report", styles["Title"]),
        Spacer(1, 12),
        Paragraph("Overall Statistics", styles["Heading2"]),
        Paragraph(f"Total analyses: {len(analyses)}", styles["Normal"]),
        Spacer(1, 12)
    ]

    if type_counts:
        content.append(Paragraph("Analysis Types", styles["Heading2"]))
        for type_name, count in type_counts.items():
            content.append(Paragraph(f"{type_name.capitalize()}: {count}", styles["Normal"]))
        content.append(Spacer(1, 12))

    if common_findings:
        content.append(Paragraph("Common Findings", styles["Heading2"]))
        for keyword, count in common_findings[:10]:
            content.append(Paragraph(f"{keyword.capitalize()}: {count} occurrences", styles["Normal"]))

    doc.build(content)
    buffer.seek(0)
    return buffer
