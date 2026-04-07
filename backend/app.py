import os
import json
import asyncio
import time
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from dotenv import load_dotenv

# Import our new Brain
from brain import AI_Brain

load_dotenv()

app = Flask(__name__)
CORS(app)

# Initialize Brain
brain = AI_Brain()

# Ensure folders exist
STATIC_FOLDER = os.path.join(os.path.dirname(__file__), 'static')
AUDIO_FOLDER = os.path.join(STATIC_FOLDER, 'audio')
for folder in [STATIC_FOLDER, AUDIO_FOLDER]:
    if not os.path.exists(folder):
        os.makedirs(folder)

@app.route('/health')
def health():
    return "OK", 200

@app.route('/static/<path:filename>')
def serve_static(filename):
    return send_from_directory(STATIC_FOLDER, filename)

@app.route('/generate', methods=['POST'])
async def generate_lecture():
    data = request.json
    topic = data.get('topic', '')
    language = data.get('language', 'English')
    mode = data.get('mode', 'standard')
    level = data.get('level', 'student') # kid, student, or pro

    if not topic:
        return jsonify({"error": "Topic is required"}), 400

    try:
        # 1. Ask the Brain to generate lesson data (pass level)
        slides_data = await brain.generate_lecture_data(topic, language, level)
        
        # 2. PowerPoint Generation
        pptx_filename = "lesson_free.pptx"
        pptx_path = os.path.join(STATIC_FOLDER, pptx_filename)
        brain.create_pptx(slides_data, pptx_path)
        
        # 3. Parallel Audio Generation
        voice = "en-US-GuyNeural" if language == "English" else "ar-EG-ShakirNeural"
        tasks = []
        for i, slide in enumerate(slides_data):
            fn = f"audio_{i}_{int(time.time())}.mp3"
            path = os.path.join(AUDIO_FOLDER, fn)
            slide['audio_url'] = f"/static/audio/{fn}?t={int(time.time())}"
            if slide.get('explanation'):
                tasks.append(brain.generate_audio(slide['explanation'], path, voice))
        
        if tasks:
            await asyncio.gather(*tasks)

        return jsonify({
            "slides": slides_data,
            "pptx_url": f"/static/{pptx_filename}"
        })

    except Exception as e:
        import traceback
        error_msg = f"{str(e)}\n{traceback.format_exc()}"
        print(f"CRITICAL ERROR: {error_msg}")
        return jsonify({"error": str(e), "details": traceback.format_exc()}), 500

if __name__ == '__main__':
    # Use standard Flask run (development)
    app.run(debug=True, port=5000)
