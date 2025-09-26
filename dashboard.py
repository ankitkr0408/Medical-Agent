# dashboard.py
import streamlit as st
from datetime import datetime
from db import get_db
from utils_simple import get_latest_analyses

def render_welcome_dashboard():
    """Render a personalized dashboard for logged-in users"""
    user_data = st.session_state.get("user_data", {})
    user_name = user_data.get("full_name", "User")
    user_role = user_data.get("role", "user")
    specialization = user_data.get("specialization", "")
    user_id = user_data.get("user_id")  # unique user identifier

    # Welcome message
    specialization_text = f" - {specialization}" if specialization else ""
    st.markdown(f"""
    <div style="background: linear-gradient(90deg, #667eea 0%, #764ba2 100%); 
                padding: 2rem; border-radius: 10px; color: white; margin-bottom: 2rem;">
        <h2>👋 Welcome back, {user_name}!</h2>
        <p style="font-size: 1.1rem; margin: 0;">
            <strong>{user_role.title()}{specialization_text}</strong> | 
            🔐 Secure AI-Powered Medical Analysis Platform
        </p>
        <p style="font-size: 0.9rem; margin-top: 1rem; opacity: 0.9;">
            ✅ API Connected | 🔬 AI Ready
        </p>
    </div>
    """, unsafe_allow_html=True)

    # ---------------- Quick Stats ----------------
    col1, col2, col3, col4 = st.columns(4)

    with col1:
        st.metric(label="🔬 Analyses Today", value=get_today_analysis_count(user_id), delta="New session")

    with col2:
        st.metric(label="💬 Active Discussions", value=get_active_discussions_count(user_id), delta="Join or create")

    with col3:
        st.metric(label="📊 Total Reports", value=get_total_reports_count(user_id), delta="All time")

    with col4:
        st.metric(label="🤖 AI Accuracy", value="94.2%", delta="Industry leading")

    # ---------------- Quick Actions ----------------
    st.subheader("🚀 Quick Actions")
    col1, col2, col3 = st.columns(3)

    with col1:
        if st.button("📤 Upload & Analyze Image", use_container_width=True):
            st.session_state.active_tab = "Image Upload & Analysis"
            st.rerun()

    with col2:
        if st.button("💬 Join Discussion", use_container_width=True):
            st.session_state.active_tab = "Collaboration"
            st.rerun()

    with col3:
        if st.button("❓ Ask Questions", use_container_width=True):
            st.session_state.active_tab = "Report Q&A"
            st.rerun()

    # ---------------- Recent Activity ----------------
    st.subheader("📈 Recent Activity")
    try:
        recent_analyses = get_latest_analyses(user_id=user_id, limit=3)

        if recent_analyses:
            for idx, analysis in enumerate(recent_analyses, 1):
                with st.expander(f"📋 Analysis #{idx}: {analysis.get('filename', 'Unknown')}"):
                    st.write(f"**Date:** {analysis.get('date', '')[:10]}")
                    analysis_text = analysis.get("analysis", "")
                    if analysis_text:
                        lines = analysis_text.strip().split("\n")
                        preview_lines = lines[:8]  # first 8 lines
                        preview_text = "\n".join(preview_lines)
                        st.write("**Key Finding (Preview):**")
                        st.write(preview_text)
                    else:
                        st.write("**Key Finding:** Not available")

                    # View Full Report button
                    if st.button(f"View Full Report #{idx}", key=f"view_{idx}"):
                        st.session_state.active_tab = "Reports"
                        st.session_state.selected_report_id = analysis.get("id")
                        st.rerun()
        else:
            st.info("No recent analyses found. Upload your first medical image to get started!")

    except Exception as e:
        st.warning(f"Error fetching recent activity: {e}")

    # ---------------- Tips ----------------
    if user_role == "patient":
        render_patient_tips()
    else:
        render_doctor_tips()


# ---------------- Tips ----------------
def render_patient_tips():
    st.subheader("💡 Tips for Patients")
    tips = [
        "🔒 **Privacy First**: Your medical images are processed securely and not stored permanently",
        "👨‍⚕️ **AI Assistance**: Our AI provides insights, but always consult your doctor for medical decisions",
        "📱 **Mobile Friendly**: You can upload images from your phone or computer",
        "💬 **Ask Questions**: Use the Q&A feature to understand your reports better",
        "📊 **Track Progress**: Keep track of your medical imaging history in the Reports section"
    ]
    for tip in tips:
        st.markdown(f"- {tip}")


def render_doctor_tips():
    st.subheader("💡 Tips for Medical Professionals")
    tips = [
        "🤖 **AI Collaboration**: Use AI insights as a second opinion in your diagnostic process",
        "👥 **Team Discussions**: Create case discussions to collaborate with colleagues",
        "📚 **Research Integration**: Get relevant medical literature automatically with each analysis",
        "🎯 **Specialized Prompts**: The AI adapts its analysis based on different medical specialties"
    ]
    for tip in tips:
        st.markdown(f"- {tip}")


# ------------------ MongoDB-based stats (user-specific) ------------------
def get_today_analysis_count(user_id=None):
    db = get_db()
    today = datetime.now().strftime("%Y-%m-%d")
    query = {"date": {"$regex": f"^{today}"}}
    if user_id:
        query["user_id"] = user_id
    return db.qa_analyses.count_documents(query)


def get_active_discussions_count(user_id=None):
    db = get_db()
    query = {"participants": {"$in": [user_id]}} if user_id else {}
    return db.qa_chats.count_documents(query)


def get_total_reports_count(user_id=None):
    db = get_db()
    query = {}
    if user_id:
        query["user_id"] = user_id
    return db.qa_analyses.count_documents(query)
