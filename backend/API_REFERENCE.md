# AI Voice Teacher - API Reference

This document provides the technical details required for a frontend developer to integrate with the AI Voice Teacher backend.

## Base URL
Default: `http://127.0.0.1:5000`

## Endpoints

### 1. Health Check
Checks if the server is alive and running correctly.
- **URL**: `/health`
- **Method**: `GET`
- **Success Response**: `OK` (200 OK)

### 2. Generate Lecture
The core endpoint that processes the topic, generates slides via AI (Gemini), creates a PPTX file, and synthesizes audio narrations.

- **URL**: `/generate`
- **Method**: `POST`
- **Headers**: `Content-Type: application/json`
- **Body Parameters**:
  - `topic` (string, required): The subject of the lecture.
  - `language` (string, optional): "English" or "Arabic". Default is "English".
  - `mode` (string, optional): "standard" or "simpler". Default is "standard".

- **Example Request**:
```json
{
  "topic": "كيف تعمل المحركات الكهربائية؟",
  "language": "Arabic",
  "mode": "standard"
}
```

- **Success Response (200 OK)**:
```json
{
  "slides": [
    {
      "title": "مقدمة عن المحركات",
      "points": ["تعريف المحرك", "تحويل الطاقة"],
      "explanation": "المحرك الكهربائي هو جهاز يحول الطاقة الكهربائية إلى طاقة حركية...",
      "audio_url": "/static/audio/audio_0_1234567.mp3?t=1234567"
    }
    // ... more slides
  ],
  "pptx_url": "/static/lesson_free.pptx"
}
```

- **Error Responses**:
  - `400 Bad Request`: If 'topic' is missing.
  - `500 Internal Server Error`: If AI processing or audio generation fails. Includes a `"details"` field with the traceback.

### 3. Static Assets
Access generated audio files and PPTX files.
- **Prefix**: `/static/`
- **Example**: `http://127.0.0.1:5000/static/audio/audio_0.mp3`

## Technical Notes
- **CORS**: Enabled for all origins (Important for browser-based calls).
- **Audio Engine**: Microsoft Edge-TTS (Free).
- **AI Model**: Google Gemini (Auto-discovered Flash/Pro based on availability).
- **Concurrency**: Audio generation is parallelized for high speed.
