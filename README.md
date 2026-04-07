# AI Voice Teacher 🎓

AI Voice Teacher is a full-stack web application that acts as an intelligent tutor. It listens to your voice, understands the topic, generates a structured presentation (PowerPoint), and narrates it back to you with synchronized slides.

## 🚀 Features

- **Voice Input**: Real-time speech-to-text using Web Speech API.
- **AI Brain**: Powered by OpenAI GPT-4o for educational content generation.
- **Auto-PPTX**: Generates professional PowerPoint files automatically.
- **TTS Narration**: Natural voice narration for each slide using OpenAI TTS.
- **Interactive Player**: Synchronized slide playback with audio.
- **Multilingual**: Supports both **English** and **Arabic**.

---

## 🏗️ Tech Stack

- **Frontend**: React (Vite), Framer Motion (Animations), Lucide Icons, Axios.
- **Backend**: Python Flask, `python-pptx`, OpenAI SDK.

---

## 🛠️ Setup Instructions

### 1. Prerequisites
- Node.js (v18+)
- Python (3.9+)
- OpenAI API Key

### 2. Backend Setup
1. Navigate to the `backend` folder:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment (optional but recommended):
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Create a `.env` file based on `.env.example` and add your OpenAI API Key:
   ```env
   OPENAI_API_KEY=sk-your-key-here
   ```
5. Start the Flask server:
   ```bash
   python app.py
   ```

### 3. Frontend Setup
1. Navigate to the `frontend` folder:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the React dev server:
   ```bash
   npm run dev
   ```

---

## 🎯 How to Use
1. Open the app in your browser (usually `http://localhost:5173`).
2. Select your preferred language (English or Arabic).
3. Click the **Microphone** button and state the topic you want to learn about (e.g., "Explain how black holes work").
4. Click **Generate Lecture**.
5. Wait for the AI to prepare the slides and audio.
6. The lecture will start automatically. You can Pause, Next/Prev slides, and **Download the PowerPoint** file.

---

## ⚠️ Notes
- Ensure your browser permits microphone access.
- The `static` folder in the backend stores temporary PPTX and Audio files.
- For Arabic support, the system uses modern fonts and RTL layout.

Enjoy learning with your AI Teacher! 🤖✨
