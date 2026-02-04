import streamlit as st
import os
import io
from PIL import Image
from datetime import datetime
import base64
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Import authentication system
from auth_system import render_login_page, check_authentication

# Import enhanced medical analysis functions
from utils_simple import (
    process_file, 
    analyze_image, 
    generate_heatmap, 
    search_pubmed,
    generate_report,
    get_latest_analyses
)

# Import chat system for collaboration
from chat_system import render_chat_interface, create_manual_chat_room

# Import QA system
from report_qa_chat import ReportQAChat
from qa_interface import render_qa_chat_interface

# Import dashboard
from dashboard import render_welcome_dashboard

# Import MongoDB collection
from db import qa_analysis_collection

# ---------------- Authentication ----------------
if not check_authentication():
    render_login_page()
    st.stop()

# ---------------- Page Config ----------------
st.set_page_config(
    page_title="Medical Image Analysis Platform",
    page_icon="🏥",
    layout="wide"
)

# ---------------- Session Initialization ----------------
for key in ["file_data", "analysis_results", "file_name", "file_type"]:
    if key not in st.session_state:
        st.session_state[key] = None

# Ensure user-specific session variables
if "user_id" not in st.session_state or "user_name" not in st.session_state:
    user_data = st.session_state.get("user_data", {})
    st.session_state.user_id = user_data.get("user_id")
    st.session_state.user_name = user_data.get("full_name", "User")

# Load OpenAI API key
openai_api_key = os.getenv("OPENAI_API_KEY")
if openai_api_key:
    st.session_state.openai_key = openai_api_key
    st.session_state.OPENAI_API_KEY = openai_api_key
else:
    st.error("⚠️ OpenAI API key not found. Please check your .env file.")
    st.stop()

# ---------------- Header ----------------
user_name = st.session_state.user_name
st.title("🏥 Advanced Medical Image Analysis")
st.markdown(f"Welcome back, **{user_name}**! Upload medical images for AI-powered analysis and collaboration")

# ---------------- Options ----------------
col1, col2, col3 = st.columns([2, 1, 1])
with col1:
    user_data = st.session_state.get("user_data", {})
    if user_data:
        st.markdown(f"👤 **{user_data.get('role', 'User').title()}** | 📧 {user_data.get('email', '')}")

with col2:
    enable_xai = st.checkbox("🔬 Explainable AI", value=True)

with col3:
    include_references = st.checkbox("📚 Medical References", value=True)

# ---------------- Logout ----------------
if st.button("🚪 Logout", key="logout_main"):
    for key in list(st.session_state.keys()):
        if key.startswith(('authenticated', 'user_', 'current_')):
            del st.session_state[key]
    st.rerun()

st.markdown("---")

# ---------------- Tabs ----------------
tab_labels = ["🏠 Dashboard", "📤 Upload & Analysis", "💬 Collaboration", "❓ Q&A", "📊 Reports"]
tab_indices = {name: idx for idx, name in enumerate(tab_labels)}
active_tab_index = st.session_state.get("active_tab_index", 0)
tabs = st.tabs(tab_labels)

# ---------------- Tab 1: Dashboard ----------------
with tabs[0]:
    render_welcome_dashboard()

# ---------------- Tab 2: Upload & Analysis ----------------
with tabs[1]:
    uploaded_file = st.file_uploader(
        "Upload a medical image (JPEG, PNG, DICOM, NIfTI)", 
        type=["jpg", "jpeg", "png", "dcm", "nii", "nii.gz"]
    )
    
    if uploaded_file:
        try:
            file_data = process_file(uploaded_file)
            if file_data:
                st.session_state.file_data = file_data
                st.session_state.file_name = uploaded_file.name
                st.session_state.file_type = file_data["type"]
                
                st.image(file_data["data"], caption=f"Uploaded {file_data['type']} image", use_container_width=True)
                
                if st.button("🔍 Analyze Image", use_container_width=True):
                    # Display prominent medical disclaimer
                    st.warning("⚠️ **MEDICAL DISCLAIMER**: This AI analysis is for educational purposes ONLY and may contain errors. It is NOT a medical diagnosis and cannot replace professional medical examination. Always consult qualified healthcare professionals (radiologist, physician) for accurate diagnosis and treatment.")
                    
                    with st.spinner("Analyzing image..."):
                        analysis_results = analyze_image(
                            file_data["data"], 
                            st.session_state.openai_key,
                            enable_xai=enable_xai
                        )
                        
                        # Save to DB with user_id
                        analysis_results["filename"] = uploaded_file.name
                        analysis_results["date"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                        analysis_results["user_id"] = st.session_state.user_id
                        qa_analysis_collection.insert_one(analysis_results)
                        
                        st.session_state.analysis_results = analysis_results
                        st.subheader("AI-Assisted Educational Observations")
                        st.info("📋 Remember: These are AI-generated observations for educational purposes. Please review with a licensed healthcare professional.")
                        st.markdown(analysis_results["analysis"])
                        
                        if analysis_results.get("findings"):
                            st.subheader("Key Findings")
                            for idx, finding in enumerate(analysis_results["findings"], 1):
                                st.markdown(f"{idx}. {finding}")
                        
                        # Display doctor recommendations prominently
                        if analysis_results.get("doctor_recommendations"):
                            doctor_recs = analysis_results["doctor_recommendations"]
                            
                            st.subheader("🩺 Recommended Medical Specialists")
                            
                            # Primary specialist recommendation
                            if doctor_recs.get("primary_specialist"):
                                st.markdown("### 🎯 **Best Doctor to See First:**")
                                st.info(doctor_recs["primary_specialist"])
                            
                            # Urgency level
                            urgency = doctor_recs.get("urgency_level", "Routine")
                            urgency_colors = {
                                "Emergency": "🔴",
                                "Urgent": "🟡", 
                                "Routine": "🟢"
                            }
                            st.markdown(f"**Urgency Level:** {urgency_colors.get(urgency, '🟢')} {urgency}")
                            
                            # Additional specialists
                            if doctor_recs.get("additional_specialists"):
                                st.markdown("### 👥 **Additional Specialists to Consider:**")
                                for specialist in doctor_recs["additional_specialists"]:
                                    st.markdown(f"• {specialist}")
                            
                            # Questions to ask
                            if doctor_recs.get("questions_to_ask"):
                                with st.expander("❓ **Important Questions to Ask Your Doctor**"):
                                    for idx, question in enumerate(doctor_recs["questions_to_ask"], 1):
                                        st.markdown(f"{idx}. {question}")
                            
                            # Specialist criteria
                            if doctor_recs.get("specialist_criteria"):
                                with st.expander("🔍 **What to Look for in a Specialist**"):
                                    for criteria in doctor_recs["specialist_criteria"]:
                                        st.markdown(f"• {criteria}")
                        
                        if analysis_results.get("keywords"):
                            st.subheader("Keywords")
                            st.markdown(f"*{', '.join(analysis_results['keywords'])}*")
                        
                        if enable_xai:
                            st.subheader("Explainable AI Visualization")
                            overlay, heatmap = generate_heatmap(file_data["array"])
                            col1, col2 = st.columns(2)
                            with col1:
                                st.image(overlay, caption="Heatmap Overlay", use_container_width=True)
                            with col2:
                                st.image(heatmap, caption="Raw Heatmap", use_container_width=True)
                        
                        if include_references and analysis_results.get("keywords"):
                            st.subheader("Relevant Medical Literature")
                            references = search_pubmed(analysis_results["keywords"], max_results=3)
                            for ref in references:
                                st.markdown(f"- **{ref['title']}**  \n{ref['journal']}, {ref['year']} (PMID: {ref['id']})")
                        
                        st.subheader("Collaborate")
                        col1, col2 = st.columns(2)
                        with col1:
                            if st.button("Start Case Discussion"):
                                case_description = analysis_results.get("findings", ["Case discussion"])[0]
                                created_case_id = create_manual_chat_room(user_name, case_description, st.session_state.user_id)
                                st.session_state.current_case_id = created_case_id
                                st.session_state.active_tab_index = tab_indices["💬 Collaboration"]  # switch tab
                                st.rerun()
                        with col2:
                            if st.button("Start Q&A Session"):
                                if "qa_chat" not in st.session_state:
                                    st.session_state.qa_chat = ReportQAChat()
                                room_name = f"Q&A for {uploaded_file.name}"
                                created_qa_id = st.session_state.qa_chat.create_qa_room(user_name, room_name, st.session_state.user_id)
                                st.session_state.current_qa_id = created_qa_id
                                st.session_state.active_tab_index = tab_indices["❓ Q&A"]  # switch tab
                                st.rerun()
        except Exception as e:
            st.error(f"Error processing file: {str(e)}")

# ---------------- Tab 3: Collaboration ----------------
with tabs[2]:
    try:
        render_chat_interface()
    except Exception as e:
        st.error(f"Error in chat interface: {str(e)}")
        st.info("Create a manual discussion if no image is uploaded.")
        manual_creator = st.text_input("Your Name", value=user_name)
        manual_description = st.text_input("Case Description")
        if st.button("Create Manual Discussion") and manual_description:
            case_id = create_manual_chat_room(manual_creator, manual_description, st.session_state.user_id)
            st.session_state.current_case_id = case_id
            st.session_state.active_tab_index = tab_indices["💬 Collaboration"]
            st.rerun()

# ---------------- Tab 4: Q&A ----------------
with tabs[3]:
    render_qa_chat_interface(user_id=st.session_state.user_id)

# ---------------- Tab 5: Reports ----------------
with tabs[4]:
    st.subheader("Medical Reports & Analytics")
    st.markdown("### Analysis History")
    
    recent_analyses = list(qa_analysis_collection.find({"user_id": st.session_state.user_id}).sort("date", -1).limit(10))
    
    if recent_analyses:
        for idx, analysis in enumerate(recent_analyses, 1):
            with st.expander(f"{idx}. {analysis.get('filename', 'Unknown')} - {analysis.get('date', '')[:10]}"):
                st.markdown(analysis.get("analysis", "No analysis available"))
                if analysis.get("findings"):
                    st.markdown("**Key Findings:**")
                    for f_idx, finding in enumerate(analysis["findings"], 1):
                        st.markdown(f"{f_idx}. {finding}")
                
                # Display doctor recommendations if available
                if analysis.get("doctor_recommendations"):
                    doctor_recs = analysis["doctor_recommendations"]
                    st.markdown("**🩺 Doctor Recommendations:**")
                    
                    if doctor_recs.get("primary_specialist"):
                        st.markdown(f"**Primary Specialist:** {doctor_recs['primary_specialist'][:100]}...")
                    
                    if doctor_recs.get("urgency_level"):
                        urgency_colors = {"Emergency": "🔴", "Urgent": "🟡", "Routine": "🟢"}
                        urgency = doctor_recs["urgency_level"]
                        st.markdown(f"**Urgency:** {urgency_colors.get(urgency, '🟢')} {urgency}")
                
                if st.button(f"Generate Report #{idx}"):
                    pdf_buffer = generate_report(analysis, include_references)
                    if pdf_buffer:
                        b64_pdf = base64.b64encode(pdf_buffer.read()).decode()
                        href = f'<a href="data:application/pdf;base64,{b64_pdf}" download="report_{idx}.pdf">Download Report</a>'
                        st.markdown(href, unsafe_allow_html=True)
    else:
        st.info("No previous analyses found.")
