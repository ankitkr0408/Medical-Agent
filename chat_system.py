import streamlit as st
from datetime import datetime
import uuid
import openai
from db import chats_collection  # MongoDB collection

# ----------------------
# MongoDB CRUD functions
# ----------------------

def create_chat_room(case_id, creator_name, case_description, user_id):
    """Create a new chat room for a case in MongoDB tied to a specific user"""
    existing_room = chats_collection.find_one({"_id": case_id, "user_id": user_id})
    if existing_room:
        return case_id

    room_data = {
        "_id": case_id,
        "user_id": user_id,
        "created_at": datetime.now().isoformat(),
        "creator": creator_name,
        "description": case_description,
        "participants": [creator_name, "Dr. Sarah Chen (Cardiologist)", "Dr. Michael Rodriguez (Radiologist)", 
                        "Dr. Emily Johnson (Pulmonologist)", "Dr. David Park (Neurologist)", 
                        "Dr. Lisa Thompson (Chief Medical Officer)"],
        "consultation_stage": "initial",  # initial -> specialists -> summary -> complete
        "specialist_opinions": [],
        "messages": []
    }

    # Initial welcome message
    welcome_message = {
        "id": str(uuid.uuid4()),
        "user": "System",
        "content": f"🏥 **Multidisciplinary Consultation Started**\n\nCase: '{case_description}'\n\n**Consultation Process:**\n1. Present your case and questions\n2. Get opinions from 3-4 specialists\n3. Receive a unified summary in simple language\n4. Discuss next steps\n\nReady to begin the consultation!",
        "type": "system",
        "timestamp": datetime.now().isoformat()
    }
    room_data["messages"].append(welcome_message)

    chats_collection.insert_one(room_data)
    return case_id


def join_chat_room(case_id, user_name, user_id):
    """Join an existing chat room (filtered by user_id)"""
    room = chats_collection.find_one({"_id": case_id, "user_id": user_id})
    if not room:
        return False

    if user_name not in room["participants"]:
        chats_collection.update_one(
            {"_id": case_id, "user_id": user_id},
            {"$push": {"participants": user_name}}
        )
    return True


def add_message(case_id, user_name, message, user_id, message_type="text"):
    """Add a message to a chat room"""
    if not message.strip():
        return None

    message_data = {
        "id": str(uuid.uuid4()),
        "user": user_name,
        "content": message,
        "type": message_type,
        "timestamp": datetime.now().isoformat()
    }

    result = chats_collection.update_one(
        {"_id": case_id, "user_id": user_id},
        {"$push": {"messages": message_data}}
    )

    return message_data if result.modified_count > 0 else None


def get_available_rooms(user_id):
    """Get a list of chat rooms for the logged-in user only"""
    rooms_cursor = chats_collection.find({"user_id": user_id})
    rooms = []
    for room in rooms_cursor:
        rooms.append({
            "id": room["_id"],
            "description": room["description"],
            "creator": room["creator"],
            "created_at": room["created_at"],
            "participants": len(room["participants"])
        })
    rooms.sort(key=lambda x: x["created_at"], reverse=True)
    return rooms


def get_messages(case_id, user_id, limit=50):
    """Get the most recent messages from a chat room"""
    room = chats_collection.find_one({"_id": case_id, "user_id": user_id})
    if not room:
        return []

    messages = room.get("messages", [])
    return messages[-limit:] if len(messages) > limit else messages


# ----------------------
# OpenAI response logic
# ----------------------

def get_specialist_response(user_question, case_description, specialist_type, findings=None, api_key=None):
    """Get response from a specific medical specialist"""
    if not api_key:
        return "Please configure your OpenAI API key to get specialist responses."

    client = openai.OpenAI(api_key=api_key)

    findings_text = ""
    if findings:
        findings_text = "Key findings:\n" + "\n".join([f"{i+1}. {f}" for i, f in enumerate(findings)])

    from prompts import SPECIALIST_CONSULTATION_PROMPTS
    
    base_prompt = SPECIALIST_CONSULTATION_PROMPTS.get(specialist_type, SPECIALIST_CONSULTATION_PROMPTS["radiologist"])
    specialist_prompt = f"""{base_prompt}
    
Case: "{case_description}"
{findings_text}

Question/Context: {user_question}
"""

    system_prompt = specialist_prompt

    try:
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_question}
            ],
            max_tokens=200,
            temperature=0.3,
        )
        return response.choices[0].message.content
    except Exception as e:
        print(f"Error with OpenAI API: {e}")
        return f"I encountered an error: {str(e)}"


def get_multidisciplinary_summary(case_description, specialist_opinions, findings=None, api_key=None):
    """Generate a multidisciplinary summary in simple language"""
    if not api_key:
        return "Please configure your OpenAI API key to get the summary."

    client = openai.OpenAI(api_key=api_key)

    findings_text = ""
    if findings:
        findings_text = "Key findings:\n" + "\n".join([f"{i+1}. {f}" for i, f in enumerate(findings)])

    opinions_text = "\n".join([f"- {opinion}" for opinion in specialist_opinions])

    from prompts import ENHANCED_MULTIDISCIPLINARY_SUMMARY_PROMPT
    
    system_prompt = f"""{ENHANCED_MULTIDISCIPLINARY_SUMMARY_PROMPT}

Case: "{case_description}"
{findings_text}

Specialist Opinions from our team:
{opinions_text}

Please provide your comprehensive multidisciplinary summary with specific doctor recommendations."""

    try:
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": "Please provide the multidisciplinary summary."}
            ],
            max_tokens=400,
            temperature=0.2,
        )
        return response.choices[0].message.content
    except Exception as e:
        print(f"Error with OpenAI API: {e}")
        return f"I encountered an error: {str(e)}"


# ----------------------
# Streamlit interface
# ----------------------

def render_chat_interface():
    st.subheader("👨‍⚕️👩‍⚕️ Multi-Doctor Collaboration")

    if "user_name" not in st.session_state:
        st.session_state.user_name = "Dr. Anonymous"
    user_name = st.text_input("Your Name", value=st.session_state.user_name)

    user_id = st.session_state.get("user_id", None)
    if not user_id:
        st.error("You must be logged in to access chat rooms.")
        return

    tab1, tab2 = st.tabs(["Join Existing Case", "Create New Case"])

    # ---------------- Join existing
    with tab1:
        rooms = get_available_rooms(user_id)
        if rooms:
            room_options = {f"{r['id']} - {r['description']} (by {r['creator']})": r["id"] for r in rooms}
            selected_room = st.selectbox("Select Case", options=list(room_options.keys()))
            if st.button("Join Discussion"):
                selected_case_id = room_options[selected_room]
                if join_chat_room(selected_case_id, user_name, user_id):
                    st.session_state.current_case_id = selected_case_id
                    st.rerun()
        else:
            st.info("No active case discussions. Create a new one!")

    # ---------------- Create new
    with tab2:
        case_description = st.text_input("Case Description")
        can_create_discussion = "file_data" in st.session_state and st.session_state.get("file_type")
        if can_create_discussion:
            case_id = f"{st.session_state.file_type.upper()}-{datetime.now().strftime('%Y%m%d%H%M%S')}"
            if st.button("Create Discussion"):
                if case_description:
                    created_case_id = create_chat_room(case_id, user_name, case_description, user_id)
                    st.session_state.current_case_id = created_case_id
                    st.rerun()
                else:
                    st.error("Please provide a case description")
        else:
            st.info("Upload an image first to create a new case discussion")

    # ---------------- Active chat
    if "current_case_id" in st.session_state:
        case_id = st.session_state.current_case_id
        room = chats_collection.find_one({"_id": case_id, "user_id": user_id})
        if room:
            st.subheader(f"Case Discussion: {room['description']}")
            st.caption(f"Created by {room['creator']} • {len(room['participants'])} participants")

            # Consultation workflow controls
            consultation_stage = room.get("consultation_stage", "initial")
            specialist_opinions = room.get("specialist_opinions", [])
            
            # Display current stage
            stage_info = {
                "initial": "🔵 **Stage 1:** Present your case and questions",
                "specialists": f"🟡 **Stage 2:** Specialist consultation ({len(specialist_opinions)}/3 opinions received)",
                "summary": "🟢 **Stage 3:** Multidisciplinary summary ready",
                "complete": "✅ **Complete:** Consultation finished"
            }
            st.info(stage_info.get(consultation_stage, "Unknown stage"))

            # Consultation controls based on stage
            if consultation_stage == "initial":
                st.markdown("**Ready to start specialist consultation?**")
                col1, col2 = st.columns(2)
                with col1:
                    start_consultation = st.button("🩺 Start Step-by-Step", use_container_width=True)
                with col2:
                    auto_consultation = st.button("⚡ Auto Complete Consultation", use_container_width=True)
            elif consultation_stage == "specialists":
                col1, col2 = st.columns(2)
                with col1:
                    get_next_opinion = st.button("👨‍⚕️ Get Next Specialist Opinion", use_container_width=True)
                with col2:
                    if len(specialist_opinions) >= 2:
                        get_summary = st.button("📋 Get Multidisciplinary Summary", use_container_width=True)
            elif consultation_stage == "summary":
                st.success("Multidisciplinary summary completed! Continue discussion or ask follow-up questions.")

            messages = get_messages(case_id, user_id)
            chat_container = st.container()
            with chat_container:
                for msg in messages:
                    if msg["type"] == "system":
                        avatar = "🏥"
                    elif "Dr." in msg["user"]:
                        avatar = "👨‍⚕️" if "Dr. David" in msg["user"] or "Dr. Michael" in msg["user"] else "👩‍⚕️"
                    else:
                        avatar = "👤"
                    
                    with st.chat_message(name=msg["user"], avatar=avatar):
                        st.write(msg["content"])

            # Handle consultation workflow
            api_key = st.session_state.get("OPENAI_API_KEY", None)
            findings = st.session_state.get("findings", None)
            
            if consultation_stage == "initial" and 'auto_consultation' in locals() and auto_consultation:
                # Auto complete entire consultation with progress
                progress_bar = st.progress(0)
                status_text = st.empty()
                
                def update_progress(message, progress):
                    status_text.text(message)
                    progress_bar.progress(progress)
                
                success = auto_progress_consultation(case_id, user_id, api_key, findings, update_progress)
                
                if success:
                    status_text.success("✅ Complete consultation finished!")
                    progress_bar.progress(1.0)
                else:
                    status_text.error("❌ Error during consultation")
                
                # Clear progress indicators after a moment
                import time
                time.sleep(2)
                st.rerun()
            
            elif consultation_stage == "initial" and 'start_consultation' in locals() and start_consultation:
                # Update stage to specialists
                chats_collection.update_one(
                    {"_id": case_id, "user_id": user_id},
                    {"$set": {"consultation_stage": "specialists"}}
                )
                
                # Get first specialist opinion
                specialist_response = get_specialist_response(
                    "Please provide your initial assessment of this case", 
                    room["description"], 
                    "radiologist", 
                    findings, 
                    api_key
                )
                add_message(case_id, "Dr. Michael Rodriguez (Radiologist)", specialist_response, user_id)
                
                # Store opinion
                chats_collection.update_one(
                    {"_id": case_id, "user_id": user_id},
                    {"$push": {"specialist_opinions": specialist_response}}
                )
                st.rerun()
            
            elif consultation_stage == "specialists" and 'get_next_opinion' in locals() and get_next_opinion:
                # Get next specialist opinion
                specialists = ["cardiologist", "pulmonologist", "neurologist"]
                specialist_names = ["Dr. Sarah Chen (Cardiologist)", "Dr. Emily Johnson (Pulmonologist)", "Dr. David Park (Neurologist)"]
                
                if len(specialist_opinions) < 3:
                    specialist_type = specialists[len(specialist_opinions)]
                    specialist_name = specialist_names[len(specialist_opinions)]
                    
                    specialist_response = get_specialist_response(
                        "Please provide your specialist assessment of this case", 
                        room["description"], 
                        specialist_type, 
                        findings, 
                        api_key
                    )
                    add_message(case_id, specialist_name, specialist_response, user_id)
                    
                    # Store opinion
                    chats_collection.update_one(
                        {"_id": case_id, "user_id": user_id},
                        {"$push": {"specialist_opinions": specialist_response}}
                    )
                    st.rerun()
            
            elif consultation_stage == "specialists" and 'get_summary' in locals() and get_summary:
                # Generate multidisciplinary summary
                updated_room = chats_collection.find_one({"_id": case_id, "user_id": user_id})
                current_opinions = updated_room.get("specialist_opinions", [])
                
                summary_response = get_multidisciplinary_summary(
                    room["description"], 
                    current_opinions, 
                    findings, 
                    api_key
                )
                
                add_message(case_id, "Dr. Lisa Thompson (Chief Medical Officer)", 
                           f"**🏥 MULTIDISCIPLINARY SUMMARY**\n\n{summary_response}", user_id)
                
                # Update stage to summary
                chats_collection.update_one(
                    {"_id": case_id, "user_id": user_id},
                    {"$set": {"consultation_stage": "summary"}}
                )
                st.rerun()

            # Regular chat input
            message = st.chat_input("Type your message or question here...")
            if message:
                add_message(case_id, user_name, message, user_id)
                st.rerun()

            with st.expander("Add Image Annotation"):
                annotation = st.text_area("Describe what you see in the image")
                if st.button("Submit Annotation"):
                    add_message(case_id, user_name, annotation, user_id, message_type="annotation")
                    st.rerun()


def create_manual_chat_room(creator_name, case_description, user_id):
    case_id = f"CASE-{datetime.now().strftime('%Y%m%d%H%M%S')}"
    return create_chat_room(case_id, creator_name, case_description, user_id)


def auto_progress_consultation(case_id, user_id, api_key, findings=None, progress_callback=None):
    """Automatically progress through all specialist consultations with progress updates"""
    room = chats_collection.find_one({"_id": case_id, "user_id": user_id})
    if not room:
        return False
    
    specialists = [
        ("radiologist", "Dr. Michael Rodriguez (Radiologist)", "🔬 Analyzing imaging details..."),
        ("cardiologist", "Dr. Sarah Chen (Cardiologist)", "❤️ Evaluating cardiac implications..."),
        ("pulmonologist", "Dr. Emily Johnson (Pulmonologist)", "🫁 Assessing respiratory aspects...")
    ]
    
    specialist_opinions = []
    
    # Add consultation start message
    start_message = {
        "id": str(uuid.uuid4()),
        "user": "System",
        "content": "🏥 **Starting Multidisciplinary Consultation**\n\nOur specialist team is now reviewing your case...",
        "type": "system",
        "timestamp": datetime.now().isoformat()
    }
    chats_collection.update_one(
        {"_id": case_id, "user_id": user_id},
        {"$push": {"messages": start_message}}
    )
    
    # Get all specialist opinions
    for i, (specialist_type, specialist_name, status_msg) in enumerate(specialists):
        if progress_callback:
            progress_callback(status_msg, (i + 1) / (len(specialists) + 1))
        
        specialist_response = get_specialist_response(
            "Please provide your specialist assessment of this case", 
            room["description"], 
            specialist_type, 
            findings, 
            api_key
        )
        
        # Add message to chat
        add_message(case_id, specialist_name, f"**{specialist_name.split('(')[1][:-1]} Opinion:**\n\n{specialist_response}", user_id)
        specialist_opinions.append(specialist_response)
    
    # Update room with all opinions
    chats_collection.update_one(
        {"_id": case_id, "user_id": user_id},
        {
            "$set": {
                "consultation_stage": "specialists",
                "specialist_opinions": specialist_opinions
            }
        }
    )
    
    # Generate summary
    if progress_callback:
        progress_callback("📋 Preparing multidisciplinary summary...", 0.9)
    
    summary_response = get_multidisciplinary_summary(
        room["description"], 
        specialist_opinions, 
        findings, 
        api_key
    )
    
    add_message(case_id, "Dr. Lisa Thompson (Chief Medical Officer)", 
               f"**🏥 MULTIDISCIPLINARY SUMMARY**\n\n{summary_response}", user_id)
    
    # Add completion message
    completion_message = {
        "id": str(uuid.uuid4()),
        "user": "System",
        "content": "✅ **Consultation Complete**\n\nYour multidisciplinary consultation is now complete. You can ask follow-up questions or discuss the findings with our team.",
        "type": "system",
        "timestamp": datetime.now().isoformat()
    }
    chats_collection.update_one(
        {"_id": case_id, "user_id": user_id},
        {"$push": {"messages": completion_message}}
    )
    
    # Update stage to complete
    chats_collection.update_one(
        {"_id": case_id, "user_id": user_id},
        {"$set": {"consultation_stage": "summary"}}
    )
    
    if progress_callback:
        progress_callback("✅ Consultation complete!", 1.0)
    
    return True
