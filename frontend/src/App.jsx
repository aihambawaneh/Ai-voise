import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Mic, MicOff, Play, Pause, ChevronRight, ChevronLeft, Download, RefreshCw, Loader2, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import './App.css';

const API_BASE = 'http://127.0.0.1:5000';

function App() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [loading, setLoading] = useState(false);
  const [slides, setSlides] = useState([]);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [pptxUrl, setPptxUrl] = useState('');
  const [language, setLanguage] = useState('Arabic Fusha');
  const [level, setLevel] = useState('student');

  const recognitionRef = useRef(null);
  const audioRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'ar-SA';

      recognitionRef.current.onresult = (event) => {
        let interimTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            setTranscript(prev => prev + event.results[i][0].transcript + ' ');
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
      };

      recognitionRef.current.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsRecording(false);
      };
    }
  }, []);

  const toggleRecording = () => {
    if (!recognitionRef.current) return;
    if (isRecording) {
      recognitionRef.current.stop();
    } else {
      setTranscript('');
      recognitionRef.current.start();
      setIsRecording(true);
    }
  };

  const handleGenerate = async (isRetry = false) => {
    if (!transcript.trim()) return;
    stopAudio();
    setLoading(true);
    setSlides([]); // Clear previous
    try {
      const response = await axios.post(`${API_BASE}/generate`, {
        topic: transcript,
        language: language,
        level: isRetry ? 'kid' : level
      });
      setSlides(response.data.slides);
      setPptxUrl(response.data.pptx_url);
      setCurrentSlideIndex(0);
      setIsPlaying(false);
    } catch (error) {
      console.error('Error generating lecture:', error);
      alert('Error: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  };

  const playSlideAudio = () => {
    if (!slides.length) return;
    const currentSlide = slides[currentSlideIndex];
    if (currentSlide.audio_url) {
      const audioUrl = `${API_BASE}${currentSlide.audio_url}`;
      if (audioRef.current.src !== audioUrl) {
        audioRef.current.src = audioUrl;
      }
      audioRef.current.play().catch(e => console.error("Audio Play Error:", e));
      setIsPlaying(true);
    }
  };

  const togglePlay = () => {
    if (isPlaying) {
      stopAudio();
    } else {
      playSlideAudio();
    }
  };

  const handleAudioEnd = () => {
    if (currentSlideIndex < slides.length - 1) {
      setCurrentSlideIndex(prev => prev + 1);
    } else {
      setIsPlaying(false);
    }
  };

  useEffect(() => {
    if (isPlaying && slides.length > 0) {
      playSlideAudio();
    }
  }, [currentSlideIndex]);

  const nextSlide = () => {
    if (currentSlideIndex < slides.length - 1) setCurrentSlideIndex(prev => prev + 1);
  };

  const prevSlide = () => {
    if (currentSlideIndex > 0) setCurrentSlideIndex(prev => prev - 1);
  };

  const currentSlide = slides[currentSlideIndex];

  return (
    <div className="app-container rtl">
      <audio ref={audioRef} onEnded={handleAudioEnd} />

      <header className="glass-header">
        <h1>{language === 'Arabic Saudi' ? 'مدرّس الـ AI السعودي' : 'معلّم الذكاء الاصطناعي'}</h1>
        <div className="settings-bar">
          <div className="toggle-group">
            <button onClick={() => setLanguage('Arabic Fusha')} className={language === 'Arabic Fusha' ? 'active' : ''}>فصحى</button>
            <button onClick={() => setLanguage('Arabic Saudi')} className={language === 'Arabic Saudi' ? 'active' : ''}>سعودي</button>
          </div>

          <div className="toggle-group level-toggle">
            <button onClick={() => setLevel('kid')} className={level === 'kid' ? 'active kid' : ''} title="أطفال">🧸</button>
            <button onClick={() => setLevel('student')} className={level === 'student' ? 'active student' : ''} title="طلاب">🎓</button>
            <button onClick={() => setLevel('pro')} className={level === 'pro' ? 'active pro' : ''} title="محترفين">🚀</button>
          </div>
        </div>
      </header>

      <main>
        {!slides.length ? (
          <section className="input-section">
            <div className="mic-container">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`mic-button ${isRecording ? 'recording' : ''}`}
                onClick={toggleRecording}
              >
                {isRecording ? <MicOff size={48} /> : <Mic size={48} />}
              </motion.button>
              <h2 style={{ fontSize: '2rem', margin: '0' }}>أهلاً بك، عن ماذا نذاكر اليوم؟</h2>
              <p style={{ color: 'var(--text-dim)' }}>{isRecording ? 'أنا أسمعك الآن...' : 'اضغط على الميكروفون وابدأ بالتحدث عن موضوعك'}</p>
            </div>

            <div className="transcript-box">
              <textarea
                placeholder="مثلاً: اشرح لي عن الثقوب السوداء..."
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
              />
            </div>

            <button
              className="generate-button"
              onClick={() => handleGenerate()}
              disabled={loading || !transcript.trim()}
            >
              {loading ? <Loader2 className="animate-spin" /> : 'توليد المحاضرة الآن'}
            </button>
          </section>
        ) : (
          <section className="player-section slide-in">
            <div className="lecture-slides-container">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentSlideIndex}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.4 }}
                  className="slide-card"
                >
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${((currentSlideIndex + 1) / slides.length) * 100}%` }}></div>
                  </div>
                  <h2 className="slide-title">{currentSlide.title}</h2>
                  <ul className="slide-points">
                    {currentSlide.points.map((point, i) => (
                      <li key={i}>{point}</li>
                    ))}
                  </ul>
                </motion.div>
              </AnimatePresence>

              <div className="player-controls">
                <button className="control-btn" onClick={prevSlide} disabled={currentSlideIndex === 0}><ChevronRight /></button>
                <button onClick={togglePlay} className="control-btn play-toggle">
                  {isPlaying ? <Pause size={32} /> : <Play size={32} />}
                </button>
                <button className="control-btn" onClick={nextSlide} disabled={currentSlideIndex === slides.length - 1}><ChevronLeft /></button>
              </div>

              <div className="action-buttons">
                <button onClick={() => handleGenerate(true)} className="action-btn" disabled={loading} title="شرح أبسط">
                  <HelpCircle size={18} /> لم أفهم جيداً
                </button>
                <a href={`${API_BASE}${pptxUrl}`} download className="action-btn primary">
                  <Download size={18} /> تحميل البوربوينت
                </a>
                <button
                  onClick={async () => {
                    stopAudio();
                    setSlides([]);
                    try { await axios.post(`${API_BASE}/clear`); } catch (e) { console.error(e); }
                  }}
                  className="action-btn"
                >
                  <RefreshCw size={18} /> موضوع جديد
                </button>
              </div>
            </div>
          </section>
        )}
      </main>

      <div className="ambient-bg">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
      </div>
    </div>
  );
}

export default App;
