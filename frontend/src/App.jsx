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
        if (event.error === 'not-allowed') {
          alert('Microphone access is blocked. Please allow it in browser settings.');
        } else {
          alert('Error with speech recognition: ' + event.error);
        }
      };
    } else {
      console.warn('Speech Recognition not supported in this browser.');
    }
  }, [language]);

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      alert('Your browser does not support voice recognition. Please use Chrome or Edge, or type manually.');
      return;
    }
    
    if (isRecording) {
      recognitionRef.current.stop();
    } else {
      setTranscript('');
      try {
        recognitionRef.current.start();
        setIsRecording(true);
      } catch (err) {
        console.error('Start error:', err);
        recognitionRef.current.stop();
        setIsRecording(false);
      }
    }
  };

  const handleGenerate = async (isRetry = false) => {
    if (!transcript.trim()) return;
    setLoading(true);
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
      const msg = error.response?.data?.error || error.message || 'Network error or backend down';
      alert('Connection Error: ' + msg);
    } finally {
      setLoading(false);
    }
  };

  const playSlideAudio = () => {
    if (slides.length === 0) return;
    const currentSlide = slides[currentSlideIndex];
    if (currentSlide.audio_url) {
      const audioUrl = `${API_BASE}${currentSlide.audio_url}`;
      if (audioRef.current.src !== audioUrl) {
          audioRef.current.src = audioUrl;
      }
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const togglePlay = () => {
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
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
    if (currentSlideIndex < slides.length - 1) {
      setCurrentSlideIndex(prev => prev + 1);
    }
  };

  const prevSlide = () => {
    if (currentSlideIndex > 0) {
      setCurrentSlideIndex(prev => prev - 1);
    }
  };

  const currentSlide = slides[currentSlideIndex];
  const isArabic = true; // Always Arabic now

  return (
    <div className={`app-container ${isArabic ? 'rtl' : ''}`}>
      <audio ref={audioRef} onEnded={handleAudioEnd} />
      
      <header className="glass-header">
        <h1>{isArabic ? 'معلم الذكاء الاصطناعي الصوتي' : 'AI Voice Teacher'}</h1>
        <div className="settings-bar">
          <div className="toggle-group">
            <button onClick={() => setLanguage('Arabic Fusha')} className={language === 'Arabic Fusha' ? 'active' : ''}>فصحى</button>
            <button onClick={() => setLanguage('Arabic Saudi')} className={language === 'Arabic Saudi' ? 'active' : ''}>سعودي</button>
          </div>

          <div className="toggle-group level-toggle">
            <button onClick={() => setLevel('kid')} className={level === 'kid' ? 'active kid' : ''} title="شرح مبسط للأطفال">🧸</button>
            <button onClick={() => setLevel('student')} className={level === 'student' ? 'active student' : ''} title="شرح مدرسي متوازن">🎓</button>
            <button onClick={() => setLevel('pro')} className={level === 'pro' ? 'active pro' : ''} title="شرح عميق للمحترفين">🚀</button>
          </div>
        </div>
      </header>

      <main>
        {!slides.length ? (
          <section className="input-section glass">
            <div className="mic-container">
              <motion.button 
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className={`mic-button ${isRecording ? 'recording' : ''}`}
                onClick={toggleRecording}
              >
                {isRecording ? <MicOff size={48} /> : <Mic size={48} />}
              </motion.button>
              <p>{isRecording ? (isArabic ? 'أنا أستمع...' : 'Listening...') : (isArabic ? 'اضغط للتحدث عن موضوعك' : 'Tap to speak about your topic')}</p>
            </div>
            
            <div className="transcript-box glass">
              <textarea 
                placeholder={isArabic ? 'سوف يظهر صوتك هنا...' : 'Your speech will appear here...'}
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
              />
            </div>

            <button 
              className="generate-button glass" 
              onClick={handleGenerate} 
              disabled={loading || !transcript.trim()}
            >
              {loading ? <Loader2 className="animate-spin" /> : (isArabic ? 'توليد المحاضرة' : 'Generate Lecture')}
            </button>
          </section>
        ) : (
          <section className="player-section slide-in">
            <div className="lecture-slides-container">
              <AnimatePresence mode="wait">
                <motion.div 
                  key={currentSlideIndex}
                  initial={{ opacity: 0, x: isArabic ? -50 : 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: isArabic ? 50 : -50 }}
                  className="slide-card glass"
                >
                  <h2 className="slide-title">{currentSlide.title}</h2>
                  <ul className="slide-points">
                    {currentSlide.points.map((point, i) => (
                      <li key={i}>{point}</li>
                    ))}
                  </ul>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill" 
                      style={{ width: `${((currentSlideIndex + 1) / slides.length) * 100}%` }}
                    ></div>
                  </div>
                </motion.div>
              </AnimatePresence>

              <div className="player-controls glass">
                <button onClick={prevSlide} disabled={currentSlideIndex === 0}><ChevronLeft /></button>
                <button onClick={togglePlay} className="play-btn">
                  {isPlaying ? <Pause /> : <Play />}
                </button>
                <button onClick={nextSlide} disabled={currentSlideIndex === slides.length - 1}><ChevronRight /></button>
              </div>

              <div className="action-buttons">
                <button 
                  onClick={() => handleGenerate(true)} 
                  className="retry-btn glass" 
                  disabled={loading}
                  title={isArabic ? 'لم أفهم، اشرح بطريقة أبسط' : "I didn't understand, simplify more"}
                >
                  {loading ? <Loader2 size={20} className="spin" /> : <HelpCircle size={20} />} 
                  {isArabic ? 'لم أفهم' : "Didn't understand"}
                </button>
                <a href={`${API_BASE}${pptxUrl}`} download className="download-btn glass">
                  <Download size={20} /> {isArabic ? 'تحميل PPTX' : 'Download PPTX'}
                </a>
                <button onClick={() => setSlides([])} className="reset-btn glass">
                  <RefreshCw size={20} /> {isArabic ? 'موضوع جديد' : 'New Topic'}
                </button>
              </div>
              
              <div className="slide-counter">
                {currentSlideIndex + 1} / {slides.length}
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
