import { useEffect, useRef, useState } from 'react';
import './App.css';

const COLORS = [
  { name: 'white', value: '#ffffff' },
  { name: 'black', value: '#000000' },
  { name: 'red', value: '#d32f2f' },
  { name: 'blue', value: '#1565c0' },
  { name: 'green', value: '#2e7d32' },
  { name: 'yellow', value: '#fdd835' },
  { name: 'orange', value: '#f57c00' },
  { name: 'purple', value: '#7b1fa2' },
];

const SPEECH_DELAY_MS = 120;
const RESET_TIMEOUT_MS = 5000;

function canSpeak() {
  return (
    typeof window !== 'undefined' &&
    'speechSynthesis' in window &&
    typeof window.SpeechSynthesisUtterance === 'function'
  );
}

function pickVoice(voices) {
  return (
    voices.find((voice) => voice.lang === 'en-US') ||
    voices.find((voice) => voice.lang.toLowerCase().startsWith('en')) ||
    voices[0] ||
    null
  );
}

function relativeLuminance(hex) {
  const channels = [1, 3, 5].map((start) => {
    const value = parseInt(hex.slice(start, start + 2), 16) / 255;
    return value <= 0.03928
      ? value / 12.92
      : ((value + 0.055) / 1.055) ** 2.4;
  });

  return (
    0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2]
  );
}

function textColorFor(background) {
  return relativeLuminance(background) > 0.179 ? '#000000' : '#ffffff';
}

function App() {
  const [activeColor, setActiveColor] = useState(null);
  const resetTimer = useRef(null);
  const speakTimer = useRef(null);
  const utteranceRef = useRef(null);

  useEffect(() => {
    if (!canSpeak()) {
      return undefined;
    }

    const synth = window.speechSynthesis;

    const loadVoices = () => {
      synth.getVoices();
    };

    loadVoices();
    if (typeof synth.addEventListener === 'function') {
      synth.addEventListener('voiceschanged', loadVoices);
    }

    return () => {
      if (typeof synth.removeEventListener === 'function') {
        synth.removeEventListener('voiceschanged', loadVoices);
      }
      if (speakTimer.current) {
        clearTimeout(speakTimer.current);
      }
      if (resetTimer.current) {
        clearTimeout(resetTimer.current);
      }
      if (utteranceRef.current) {
        utteranceRef.current.onend = null;
        utteranceRef.current.onerror = null;
      }
      synth.cancel();
    };
  }, []);

  const handlePress = (color) => {
    if (canSpeak()) {
      window.speechSynthesis.cancel();
    }

    if (speakTimer.current) {
      clearTimeout(speakTimer.current);
      speakTimer.current = null;
    }
    if (utteranceRef.current) {
      utteranceRef.current.onend = null;
      utteranceRef.current.onerror = null;
      utteranceRef.current = null;
    }
    if (resetTimer.current) {
      clearTimeout(resetTimer.current);
      resetTimer.current = null;
    }

    setActiveColor(color.name);

    const reset = () => {
      if (resetTimer.current) {
        clearTimeout(resetTimer.current);
        resetTimer.current = null;
      }
      setActiveColor((current) => (current === color.name ? null : current));
    };

    if (!canSpeak()) {
      resetTimer.current = setTimeout(reset, 900);
      return;
    }

    const synth = window.speechSynthesis;
    resetTimer.current = setTimeout(reset, RESET_TIMEOUT_MS);

    speakTimer.current = setTimeout(() => {
      speakTimer.current = null;

      const utterance = new window.SpeechSynthesisUtterance(color.name);
      utterance.lang = 'en-US';
      utterance.rate = 0.85;
      utterance.pitch = 1;
      utterance.onend = reset;
      utterance.onerror = reset;

      const voice = pickVoice(synth.getVoices());
      if (voice) {
        utterance.voice = voice;
      }

      utteranceRef.current = utterance;
      synth.speak(utterance);
    }, SPEECH_DELAY_MS);
  };

  return (
    <main className="app">
      <h1 className="title">Colors</h1>
      <div className="color-grid">
        {COLORS.map((color) => {
          const isActive = activeColor === color.name;

          return (
            <button
              key={color.name}
              type="button"
              className={`color-button${isActive ? ' is-active' : ''}`}
              data-color={color.name}
              style={{
                backgroundColor: color.value,
                color: textColorFor(color.value),
              }}
              onClick={() => handlePress(color)}
              aria-label={color.name}
            >
              {isActive ? color.name.toUpperCase() : color.name}
            </button>
          );
        })}
      </div>
    </main>
  );
}

export default App;
