import streamlit as st
import hashlib
import uuid
from datetime import datetime
import re
import os
from dotenv import load_dotenv
from db import users_collection

# Load environment variables
load_dotenv()

class AuthSystem:
    def hash_password(self, password):
        """Hash password using SHA-256"""
        return hashlib.sha256(password.encode()).hexdigest()
    
    def validate_email(self, email):
        """Validate email format"""
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        return re.match(pattern, email) is not None
    
    def validate_password(self, password):
        """Validate password strength"""
        if len(password) < 6:
            return False, "Password must be at least 6 characters long"
        if not re.search(r'[A-Za-z]', password):
            return False, "Password must contain at least one letter"
        if not re.search(r'[0-9]', password):
            return False, "Password must contain at least one number"
        return True, "Password is valid"
    
    def register_user(self, email, password, full_name, medical_license=None, specialization=None):
        """Register a new user in MongoDB"""
        if not self.validate_email(email):
            return False, "Invalid email format"
        
        if users_collection.find_one({"email": email}):
            return False, "User already exists with this email"
        
        is_valid, message = self.validate_password(password)
        if not is_valid:
            return False, message
        
        user_data = {
            "user_id": str(uuid.uuid4()),  # Unique ID for each user
            "email": email,
            "password": self.hash_password(password),
            "full_name": full_name,
            "medical_license": medical_license,
            "specialization": specialization,
            "created_at": datetime.now().isoformat(),
            "last_login": None,
            "is_verified": False,
            "role": "doctor" if medical_license else "patient"
        }
        
        users_collection.insert_one(user_data)
        return True, "User registered successfully"
    
    def authenticate_user(self, email, password):
        """Authenticate user login from MongoDB"""
        user = users_collection.find_one({"email": email})
        if not user:
            return False, "User not found"
        
        if user["password"] != self.hash_password(password):
            return False, "Invalid password"
        
        # Update last login
        users_collection.update_one(
            {"email": email},
            {"$set": {"last_login": datetime.now().isoformat()}}
        )
        
        return True, user
    
    def get_user_profile(self, user_id):
        """Get user profile info from MongoDB"""
        user = users_collection.find_one({"user_id": user_id}, {"password": 0})
        return user if user else None
    
    def update_user_profile(self, user_id, updates):
        """Update user profile in MongoDB"""
        allowed_fields = ["full_name", "medical_license", "specialization"]
        update_fields = {k: v for k, v in updates.items() if k in allowed_fields}
        
        result = users_collection.update_one(
            {"user_id": user_id},
            {"$set": update_fields}
        )
        
        if result.matched_count == 0:
            return False, "User not found"
        return True, "Profile updated successfully"

# ---------------- Streamlit Helpers ---------------- #

def render_login_page():
    """Render the login page"""
    st.set_page_config(
        page_title="Medical Imaging Platform - Login",
        page_icon="🏥",
        layout="centered"
    )
    
    if "auth_system" not in st.session_state:
        st.session_state.auth_system = AuthSystem()
    
    st.markdown("""
    <div style="text-align: center; padding: 2rem 0;">
        <h1>🏥 Medical Imaging Analysis Platform</h1>
        <p style="font-size: 1.2rem; color: #666;">Secure AI-Powered Medical Image Analysis</p>
    </div>
    """, unsafe_allow_html=True)
    
    tab1, tab2 = st.tabs(["🔐 Login", "📝 Sign Up"])
    with tab1:
        render_login_form()
    with tab2:
        render_signup_form()

def render_login_form():
    """Render login form"""
    st.subheader("Welcome Back")
    
    with st.form("login_form"):
        email = st.text_input("Email Address", placeholder="doctor@hospital.com")
        password = st.text_input("Password", type="password")
        
        col1, col2 = st.columns([1, 1])
        with col1:
            login_button = st.form_submit_button("Login", use_container_width=True)
        with col2:
            forgot_password = st.form_submit_button("Forgot Password?", use_container_width=True)
        
        if login_button:
            if email and password:
                success, result = st.session_state.auth_system.authenticate_user(email, password)
                
                if success:
                    st.session_state.authenticated = True
                    st.session_state.user_email = email
                    st.session_state.user_id = result["user_id"]   # <-- Store user_id in session
                    st.session_state.user_data = result
                    st.session_state.user_name = result["full_name"]
                    st.success(f"Welcome back, {result['full_name']}!")
                    st.rerun()
                else:
                    st.error(result)
            else:
                st.error("Please fill in all fields")
        
        if forgot_password:
            st.info("Password reset functionality coming soon. Please contact support.")

def render_signup_form():
    """Render signup form"""
    st.subheader("Create Your Account")
    
    with st.form("signup_form"):
        st.markdown("**Personal Information**")
        full_name = st.text_input("Full Name", placeholder="Dr. John Smith")
        email = st.text_input("Email Address", placeholder="doctor@hospital.com")
        password = st.text_input("Password", type="password", help="At least 6 characters with letters and numbers")
        confirm_password = st.text_input("Confirm Password", type="password")
        
        st.markdown("**Professional Information (Optional)**")
        account_type = st.selectbox("Account Type", ["Patient", "Medical Professional"])
        medical_license = None
        specialization = None
        if account_type == "Medical Professional":
            medical_license = st.text_input("Medical License Number", placeholder="MD123456")
            specialization = st.selectbox("Specialization", [
                "General Practice",
                "Radiology",
                "Cardiology",
                "Pulmonology",
                "Orthopedics",
                "Neurology",
                "Emergency Medicine",
                "Internal Medicine",
                "Other"
            ])
        
        agree_terms = st.checkbox("I agree to the Terms of Service and Privacy Policy")
        signup_button = st.form_submit_button("Create Account", use_container_width=True)
        
        if signup_button:
            if not all([full_name, email, password, confirm_password]):
                st.error("Please fill in all required fields")
            elif password != confirm_password:
                st.error("Passwords do not match")
            elif not agree_terms:
                st.error("Please agree to the Terms of Service")
            else:
                success, message = st.session_state.auth_system.register_user(
                    email=email,
                    password=password,
                    full_name=full_name,
                    medical_license=medical_license,
                    specialization=specialization
                )
                
                if success:
                    st.success("Account created successfully! Please login.")
                    st.balloons()
                else:
                    st.error(message)

def render_user_profile():
    """Render user profile info"""
    if st.session_state.get("authenticated", False):
        user_data = st.session_state.get("user_data", {})
        return user_data
    return None

def check_authentication():
    return st.session_state.get("authenticated", False)

def require_authentication():
    if not check_authentication():
        render_login_page()
        st.stop()
