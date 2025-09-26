# qa_interface.py

import streamlit as st
import uuid
from datetime import datetime
from db import qa_chat_collection
from report_qa_chat import ReportQASystem  # ✅ Q&A system connector


# ---------------- MongoDB CRUD Functions ----------------
def create_qa_room_db(creator_name: str, room_name: str, user_id: str) -> str:
    """Create a new Q&A room and store it in MongoDB."""
    room_id = f"QA-{datetime.now().strftime('%Y%m%d%H%M%S')}"
    room_doc = {
        "id": room_id,
        "user_id": user_id,  # 🔑 Link room to specific user
        "name": room_name,
        "creator": creator_name,
        "created_at": datetime.now().isoformat(),
        "messages": []
    }
    qa_chat_collection.insert_one(room_doc)
    return room_id


def get_qa_rooms_db(user_id: str = None) -> list:
    """Retrieve Q&A rooms from MongoDB. If user_id is given, filter by user."""
    query = {"user_id": user_id} if user_id else {}
    return list(qa_chat_collection.find(query, {"_id": 0}))


def add_message_db(room_id: str, user_name: str, content: str) -> dict:
    """Add a new message to a specific Q&A room."""
    message = {
        "id": str(uuid.uuid4()),
        "user": user_name,
        "content": content,
        "timestamp": datetime.now().isoformat()
    }
    qa_chat_collection.update_one({"id": room_id}, {"$push": {"messages": message}})
    return message


def get_messages_db(room_id: str) -> list:
    """Retrieve all messages from a specific Q&A room."""
    room = qa_chat_collection.find_one({"id": room_id}, {"_id": 0, "messages": 1})
    return room.get("messages", []) if room else []


def delete_qa_room_db(room_id: str) -> bool:
    """Delete a Q&A room by its ID."""
    res = qa_chat_collection.delete_one({"id": room_id})
    return res.deleted_count > 0


# ---------------- Streamlit Q&A Interface ----------------
def render_qa_chat_interface(user_id: str = None):
    """Render the interactive Q&A system UI in Streamlit for a specific user."""
    st.subheader("🩺 Medical Report Q&A System")

    # Initialize QA System
    if "qa_system" not in st.session_state:
        api_key = st.session_state.get("OPENAI_API_KEY", None)
        st.session_state.qa_system = ReportQASystem(api_key=api_key)

    qa_system = st.session_state.qa_system

    # User Info
    if "qa_user_name" not in st.session_state:
        st.session_state.qa_user_name = "Dr. User"
    user_name = st.text_input("Your Name", value=st.session_state.qa_user_name)
    st.session_state.qa_user_name = user_name

    # Tabs: Join or Create Room
    tab_join, tab_create = st.tabs(["Join Existing Q&A", "Create New Q&A Room"])

    with tab_join:
        qa_rooms = get_qa_rooms_db(user_id=user_id)
        if qa_rooms:
            room_options = {f"{r['name']} (by {r['creator']})": r["id"] for r in qa_rooms}
            selected_room = st.selectbox("Select Q&A Room", options=list(room_options.keys()))

            if st.button("Join Q&A Room"):
                st.session_state.current_qa_id = room_options[selected_room]
                st.rerun()
        else:
            st.info("No active Q&A rooms. Create a new one!")

    with tab_create:
        room_name = st.text_input("Q&A Room Name")
        if st.button("Create Q&A Room"):
            if room_name.strip():
                if not user_id:
                    st.error("⚠️ User ID not found. Please login first.")
                    return
                room_id = create_qa_room_db(user_name, room_name.strip(), user_id)
                st.session_state.current_qa_id = room_id
                st.rerun()
            else:
                st.error("⚠️ Please provide a valid room name.")

    # Active Room
    if "current_qa_id" in st.session_state:
        qa_id = st.session_state.current_qa_id
        qa_rooms = get_qa_rooms_db(user_id=user_id)
        current_room = next((r for r in qa_rooms if r["id"] == qa_id), None)

        if current_room:
            st.subheader(f"Q&A Room: {current_room['name']}")
            st.caption(f"Created by {current_room['creator']} on {current_room['created_at'][:10]}")

            # Display Messages
            messages = get_messages_db(qa_id)
            with st.container():
                for msg in messages:
                    is_ai = msg["user"] == "Report QA System"
                    avatar = "🤖" if is_ai else "👨‍⚕️"
                    with st.chat_message(name=msg["user"], avatar=avatar):
                        st.write(msg["content"])

            # User Input
            qa_message = st.chat_input("Ask a question about your medical reports")
            if qa_message:
                add_message_db(qa_id, user_name, qa_message)
                ai_response = qa_system.answer_question(qa_message)
                add_message_db(qa_id, "Report QA System", ai_response)
                st.rerun()

            # Room Settings (Delete option)
            with st.expander("⚙️ Room Settings"):
                if st.button("Delete Q&A Room", type="primary"):
                    if delete_qa_room_db(qa_id):
                        st.success("✅ Room deleted successfully.")
                        del st.session_state.current_qa_id
                        st.rerun()
                    else:
                        st.error("❌ Failed to delete room.")
        else:
            st.error("⚠️ This Q&A room no longer exists.")
            if st.button("Return to Room Selection"):
                del st.session_state.current_qa_id
                st.rerun()
