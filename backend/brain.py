import os
import json
import asyncio
import time
import google.generativeai as genai
import edge_tts
from pptx import Presentation
from dotenv import load_dotenv

# Load env in brain too
load_dotenv()

# Configure Gemini
api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    print("❌ ERROR: GEMINI_API_KEY IS MISSING IN .env FILE!")
else:
    print(f"✅ API Key found: {api_key[:5]}...")

genai.configure(api_key=api_key)

def get_best_model():
    try:
        models = [m.name for m in genai.list_models()]
        print(f"📦 Available models: {models}")
        
        for m in genai.list_models():
            if 'generateContent' in m.supported_generation_methods:
                if '1.5-flash' in m.name:
                    return m.name
        for m in genai.list_models():
            if 'generateContent' in m.supported_generation_methods:
                return m.name
    except Exception as e:
        print(f"❌ Error listing models: {e}")
    return 'gemini-1.5-flash'

class AI_Brain:
    def __init__(self):
        self.model_name = get_best_model()
        print(f"USING MODEL: {self.model_name}")
        self.model = genai.GenerativeModel(
            self.model_name,
            generation_config={"response_mime_type": "application/json"}
        )

    async def generate_audio(self, text, output_path, voice):
        communicate = edge_tts.Communicate(text, voice)
        await communicate.save(output_path)

    async def generate_lecture_data(self, topic, language, level='student'):
        # Dynamic style instruction based on Level
        num_slides = "3-5"
        if level == 'kid':
            style_instruction = "Explain like I'm 5 years old. Use magic stories, simple analogies, and no complex terms. Use lots of visual-sounding metaphors."
        elif level == 'pro':
            num_slides = "6-10"
            style_instruction = "Provide an exhaustive, high-level, and rigorously detailed academic lecture. Use professional, serious terminology. Explore deep technical mechanisms, historical context, and formal definitions. Do not simplify; treat the user as an expert. Ensure every explanation is dense with high-quality information."
        else:
            style_instruction = "Act as a helpful school teacher. Explain clearly with balance between simplicity and detail."

        prompt = f"""
        Act as a professional teacher for a '{level}' level student. 
        Style: {style_instruction}
        Topic: '{topic}'. 
        Language: {language}. 
        Slides: {num_slides}.
        
        Return output as a strict JSON array:
        [
          {{
            "title": "Professional Slide Title",
            "points": ["Dense technical point", "Detailed sub-point"],
            "explanation": "Extremely detailed and serious narration covering all technical aspects of this slide."
          }}
        ]
        """

        response = self.model.generate_content(prompt)
        text_content = response.text.strip()
        
        try:
            return json.loads(text_content)
        except json.JSONDecodeError:
            import re
            match = re.search(r'\[.*\]', text_content, re.DOTALL)
            if match:
                return json.loads(match.group())
            raise ValueError("Could not parse JSON. Raw: " + text_content)

    def create_pptx(self, slides_data, output_path):
        prs = Presentation()
        for i, slide_info in enumerate(slides_data):
            slide_layout = prs.slide_layouts[1]
            slide = prs.slides.add_slide(slide_layout)
            slide.shapes.title.text = slide_info.get('title', f"Slide {i+1}")
            tf = slide.placeholders[1].text_frame
            tf.text = ""
            for point in slide_info.get('points', []):
                p = tf.add_paragraph()
                p.text = point
        prs.save(output_path)
