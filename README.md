# 🏥 HealthIQ — AI-Driven Medical Diagnosis System

> An intelligent platform that analyzes medical reports, simulates multi-specialist AI opinions, and delivers human-readable health insights.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-health.synloop.in-blue?style=for-the-badge)](https://health.synloop.in)
[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org)
[![MongoDB](https://img.shields.io/badge/MongoDB-6-green?style=for-the-badge&logo=mongodb)](https://mongodb.com)

---

## 🌐 Live Deployment

**[https://health.synloop.in](https://health.synloop.in)**

---

## 📸 Screenshots

### 🏠 Landing Page
![Landing Page](medical-platform-nextjs/docs/screenshots/landing.png)

---

### 🔐 Login
![Login](medical-platform-nextjs/docs/screenshots/login.png)

---

### 📝 Register
![Register](medical-platform-nextjs/docs/screenshots/register.png)

---

### 📊 Dashboard
![Dashboard](medical-platform-nextjs/docs/screenshots/dashboard.png)

---

### 🔬 Report Analysis
![Report Analysis](medical-platform-nextjs/docs/screenshots/report-analysis.png)

---

### 🩺 Multi-Doctor Collaboration
![Multi-Doctor Collaboration](medical-platform-nextjs/docs/screenshots/multidoctor-collaboration.png)

---

### 💬 Q&A Chat
![Q&A Chat](medical-platform-nextjs/docs/screenshots/Q&A.png)

---

### 📋 History
![History](medical-platform-nextjs/docs/screenshots/history.png)

---

### 📍 Nearby Doctors
![Nearby Doctors](medical-platform-nextjs/docs/screenshots/nearby-doctors.png)

---


## 🚀 Key Features

| Feature | Description |
|---|---|
| 📄 Medical Report Analysis | Upload PDF/image reports — OCR extracts and structures clinical data |
| 🧠 Multi-Agent AI Doctors | Multiple AI agents independently simulate specialist opinions |
| 🧩 Multidisciplinary Diagnosis | A coordinating agent consolidates all AI insights into one report |
| 📝 Plain-Language Summaries | LLMs translate complex medical data into easy-to-understand language |
| � Speciailist Recommendations | Suggests relevant specializations (Cardiology, Nephrology, etc.) |
| � PRAG Medical Chatbot | Ask natural-language questions about your report via RAG |
| 🔐 Secure Auth | NextAuth v5 with session management |
| ⚡ Real-time Updates | Socket.io powered live interactions |

---

## 🏗️ Architecture Overview

```
User uploads report (PDF / Image)
        ↓
OCR + Image Processing (Sharp)
        ↓
AI Preprocessing Agent structures data
        ↓
Multiple domain-specific AI agents analyze independently
        ↓
Multidisciplinary agent consolidates insights
        ↓
LLM generates final human-readable summary
        ↓
RAG chatbot enables interactive Q&A on the report
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript 5 |
| Frontend | React 18, Tailwind CSS, Framer Motion, Radix UI |
| Backend | Next.js API Routes, Socket.io |
| Database | MongoDB 6 |
| Auth | NextAuth v5 |
| AI / LLM | OpenAI API, LangChain |
| Vector Store | Pinecone (RAG) |
| File Uploads | UploadThing, AWS S3 |
| Caching | Redis |
| PDF Processing | jsPDF, pdf-lib, Sharp |
| Validation | Zod |

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- MongoDB instance
- OpenAI API key
- Pinecone account
- Redis instance

### Installation

```bash
# Clone the repo
git clone https://github.com/sarvesh207590/HEALTH-IQ.git
cd HEALTH-IQ/medical-platform-nextjs

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Fill in your keys in .env

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

---

## 🎯 Use Cases

- Patients understanding complex medical reports without a doctor visit
- Early AI-driven health insights before a consultation
- Reducing dependency on immediate doctor availability
- Supporting healthcare accessibility in rural/underserved areas
- Pre-consultation medical analysis tool for clinics

---

## 📌 Roadmap

- [ ] Wearable health data integration
- [ ] Real-time lab API integration
- [ ] Multilingual report support
- [ ] Enhanced clinical validation pipeline
- [ ] Mobile app (React Native)

---

## ⚠️ Disclaimer

HealthIQ is an **AI-assisted decision-support system** and **does not replace professional medical advice**.
Always consult a qualified healthcare professional for diagnosis and treatment decisions.

---

## 👥 Team

- Ankit Kumar
- Sarthak Gupta
- Aditya Birwatkar
- Sarvesh Mokal

**Mentor:** Prof. Bhagyashree Patil

**Institution:** Pillai College of Engineering, New Panvel

---

## ⭐ Acknowledgements

Special thanks to faculty mentors and the open-source communities behind Next.js, LangChain, OpenAI, and Pinecone for making this project possible.
