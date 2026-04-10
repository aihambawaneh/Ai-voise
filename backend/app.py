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

    import uuid
    request_id = str(uuid.uuid4())
    user_folder = os.path.join(AUDIO_FOLDER, request_id)
    if not os.path.exists(user_folder):
        os.makedirs(user_folder)

    try:
        # 1. Ask the Brain to generate lesson data (pass level)
        slides_data = await brain.generate_lecture_data(topic, language, level)
        
        # 2. PowerPoint Generation - Unique Name
        pptx_filename = f"lesson_{request_id}.pptx"
        pptx_path = os.path.join(STATIC_FOLDER, pptx_filename)
        brain.create_pptx(slides_data, pptx_path)
        
        # 3. Parallel Audio Generation
        voice_map = {
            "English": "en-US-GuyNeural",
            "Arabic Fusha": "ar-EG-ShakirNeural",
            "Arabic Saudi": "ar-SA-HamedNeural"
        }
        voice = voice_map.get(language, "ar-EG-ShakirNeural")
        
        tasks = []
        for i, slide in enumerate(slides_data):
            fn = f"audio_{i}.mp3"
            path = os.path.join(user_folder, fn)
            # URL relative to static
            slide['audio_url'] = f"/static/audio/{request_id}/{fn}"
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
