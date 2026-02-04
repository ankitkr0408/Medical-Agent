# report_qa_chat.py

import uuid
from datetime import datetime
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
from openai import OpenAI   # ✅ correct import
from db import db  # use existing db.py MongoDB client


# -------------------------------
# QA System for Medical Reports
# -------------------------------
class ReportQASystem:
    def __init__(self, api_key=None):
        self.api_key = api_key
        self.conversation_history = []
        self.client = OpenAI(api_key=api_key) if api_key else None  # ✅ fix

    def get_embeddings(self, text, model="text-embedding-3-small"):
        """Get embeddings for text using OpenAI API"""
        if not self.client:
            return np.random.rand(1536)  # fallback random vector
        try:
            response = self.client.embeddings.create(
                input=text,
                model=model
            )
            return response.data[0].embedding
        except Exception as e:
            print(f"Error getting embeddings: {e}")
            return np.random.rand(1536)

    def get_relevant_contexts(self, query, top_k=3):
        """Find relevant contexts for a query using embeddings similarity"""
        try:
            query_embedding = self.get_embeddings(query)
            analyses = list(db.qa_analyses.find({}))  # ✅ your Mongo collection

            if not analyses:
                return ["No previous analyses found."]

            context_scores = []
            for analysis in analyses:
                analysis_text = analysis.get("analysis", "")
                if not analysis_text.strip():
                    continue

                # Build full text from analysis + findings
                full_text = analysis_text
                if "findings" in analysis and analysis["findings"]:
                    findings_text = "\n".join([f"- {f}" for f in analysis["findings"]])
                    full_text += f"\n\nFindings:\n{findings_text}"

                full_text += f"\n\nImage: {analysis.get('filename', 'unknown')}"
                full_text += f"\nDate: {str(analysis.get('date', ''))[:10]}"

                # embedding + similarity
                context_embedding = self.get_embeddings(full_text)
                similarity_score = cosine_similarity([query_embedding], [context_embedding])[0][0]
                context_scores.append((float(similarity_score), full_text))

            # Sort contexts by similarity
            context_scores.sort(key=lambda x: x[0], reverse=True)
            top_contexts = [text for _, text in context_scores[:top_k]]

            return top_contexts if top_contexts else ["No relevant contexts found."]

        except Exception as e:
            print(f"Error in get_relevant_contexts: {e}")
            return [f"Error retrieving contexts: {str(e)}"]

    def answer_question(self, question):
        """Answer a question about medical reports using RAG"""
        if not self.client:
            return "Please provide an OpenAI API key to enable the QA system."

        contexts = self.get_relevant_contexts(question)
        if not contexts or contexts[0] == "No previous analyses found.":
            return "I don't have any medical reports to reference. Please upload and analyze some images first."

        combined_context = "\n\n---\n\n".join(contexts)
        self.conversation_history.append({"role": "user", "content": question})

        try:
            system_prompt = f"""You are a medical AI assistant answering questions about medical reports.
Use the following medical report contexts to answer the question.
If the answer cannot be found in the contexts, say so and suggest what other information might be needed.

Contexts:
{combined_context}
"""

            messages = [{"role": "system", "content": system_prompt}] + self.conversation_history

            response = self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=messages,
                max_tokens=500,
                temperature=0.3
            )

            # ✅ Correct parsing
            answer = response.choices[0].message.content.strip()

            self.conversation_history.append({"role": "assistant", "content": answer})

            # Keep only last 10 turns
            if len(self.conversation_history) > 10:
                self.conversation_history = self.conversation_history[-10:]

            return answer
        except Exception as e:
            return f"I encountered an error while answering your question: {str(e)}"

    def clear_history(self):
        """Clear stored conversation"""
        self.conversation_history = []
        return "Conversation history cleared."


# -----------------------------------
# Chat Room System for QA Collaboration
# -----------------------------------
class ReportQAChat:
    def __init__(self):
        self.qa_collection = db.qa_chats

    def create_qa_room(self, user_name, room_name, user_id):
        """Create a new QA chat room"""
        room_id = f"QA-{datetime.now().strftime('%Y%m%d%H%M%S')}"
        room_data = {
            "_id": room_id,
            "user_id": user_id,
            "room_name": room_name,
            "created_at": datetime.now().isoformat(),
            "creator": user_name,
            "messages": [{
                "id": str(uuid.uuid4()),
                "user": "Report QA System",
                "content": (
                    f"Welcome to the Report QA room: {room_name}. "
                    f"You can ask questions about your medical reports "
                    f"and I'll try to answer based on the analyses stored in the system."
                ),
                "timestamp": datetime.now().isoformat()
            }]
        }
        self.qa_collection.insert_one(room_data)
        return room_id

    def add_message(self, room_id, user_name, message):
        """Add a message to a QA room"""
        message_data = {
            "id": str(uuid.uuid4()),
            "user": user_name,
            "content": message,
            "timestamp": datetime.now().isoformat()
        }
        result = self.qa_collection.update_one(
            {"_id": room_id},
            {"$push": {"messages": message_data}}
        )
        return message_data if result.modified_count else None

    def get_messages(self, room_id, limit=50):
        """Get the most recent messages from a QA room"""
        room = self.qa_collection.find_one({"_id": room_id})
        if not room or "messages" not in room:
            return []
        return room["messages"][-limit:] if len(room["messages"]) > limit else room["messages"]

    def get_qa_rooms(self, user_id=None):
        """Get all QA rooms for a specific user"""
        query = {"user_id": user_id} if user_id else {}
        rooms = list(self.qa_collection.find(query, {"_id": 1, "room_name": 1, "creator": 1, "created_at": 1}))
        for r in rooms:
            r["id"] = r["_id"]
        # Sort rooms by created_at (newest first)
        rooms.sort(key=lambda x: x.get("created_at", ""), reverse=True)
        return rooms

    def delete_qa_room(self, room_id):
        """Delete a QA chat room"""
        result = self.qa_collection.delete_one({"_id": room_id})
        return result.deleted_count > 0
    
    def get_qa_response(self, room_id, question, user_id, api_key):
        """Get a response to a question using the QA system"""
        # Initialize QA system with API key
        qa_system = ReportQASystem(api_key=api_key)
        
        # Get answer
        answer = qa_system.answer_question(question)
        
        # Add both question and answer to the room messages
        self.add_message(room_id, "User", question)
        self.add_message(room_id, "AI Assistant", answer)
        
        return answer
