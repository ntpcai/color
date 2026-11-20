import { useEffect, useRef, useState } from 'react';
import './App.css';

const LANGUAGES = ['en', 'ja', 'taigi'];

const TITLES = {
  en: 'Colors',
  ja: '色',
  taigi: '顏色',
};

const COLORS = [
  {
    id: 'white',
    value: '#ffffff',
    en: { label: 'white', display: 'WHITE', speech: 'white' },
    ja: { label: '白', display: 'しろ', speech: 'しろ' },
    taigi: {
      label: '白色',
      display: 'pe̍h-sik',
      speech: 'pe̍h-sik',
      audio: 'white_白色_pe̍h-sik.mp3',
    },
  },
  {
    id: 'black',
    value: '#000000',
    en: { label: 'black', display: 'BLACK', speech: 'black' },
    ja: { label: '黒', display: 'くろ', speech: 'くろ' },
    taigi: {
      label: '烏色',
      display: 'oo-sik',
      speech: 'oo-sik',
      audio: 'black_烏色_oo-sik.mp3',
    },
  },
  {
    id: 'red',
    value: '#d32f2f',
    en: { label: 'red', display: 'RED', speech: 'red' },
    ja: { label: '赤', display: 'あか', speech: 'あか' },
    taigi: {
      label: '紅色',
      display: 'âng-sik',
      speech: 'âng-sik',
      audio: 'red_紅色_âng-sik.mp3',
    },
  },
  {
    id: 'blue',
    value: '#1565c0',
    en: { label: 'blue', display: 'BLUE', speech: 'blue' },
    ja: { label: '青', display: 'あお', speech: 'あお' },
    taigi: {
      label: '藍色',
      display: 'nâ-sik',
      speech: 'nâ-sik',
      audio: 'blue_藍色_nâ-sik.mp3',
    },
  },
  {
    id: 'green',
    value: '#2e7d32',
    en: { label: 'green', display: 'GREEN', speech: 'green' },
    ja: { label: '緑', display: 'みどり', speech: 'みどり' },
    taigi: {
      label: '青色',
      display: 'tshenn-sik',
      speech: 'tshenn-sik',
      audio: 'green_青色_tshenn-sik.mp3',
    },
  },
  {
    id: 'yellow',
    value: '#fdd835',
    en: { label: 'yellow', display: 'YELLOW', speech: 'yellow' },
    ja: { label: '黄色', display: 'きいろ', speech: 'きいろ' },
    taigi: {
      label: '黃色',
      display: 'n̂g-sik',
      speech: 'n̂g-sik',
      audio: 'yellow_黃色_n̂g-sik.mp3',
    },
  },
  {
    id: 'orange',
    value: '#f57c00',
    en: { label: 'orange', display: 'ORANGE', speech: 'orange' },
    ja: { label: '橙', display: 'だいだい', speech: 'だいだい' },
    taigi: {
      label: '柑仔色',
      display: 'kam-á-sik',
      speech: 'kam-á-sik',
      audio: 'orange_柑仔色_kam-á-sik.mp3',
    },
  },
  {
    id: 'purple',
    value: '#7b1fa2',
    en: { label: 'purple', display: 'PURPLE', speech: 'purple' },
    ja: { label: '紫', display: 'むらさき', speech: 'むらさき' },
    taigi: {
      label: '紫色',
      display: 'tsí-sik',
      speech: 'tsí-sik',
      audio: 'purple_紫色_tsí-sik.mp3',
    },
  },
  {
    id: 'brown',
    value: '#795548',
    en: { label: 'brown', display: 'BROWN', speech: 'brown' },
    ja: { label: '茶色', display: 'ちゃいろ', speech: 'ちゃいろ' },
    taigi: {
      label: '咖啡色',
      display: 'ka-pi-sik',
      speech: 'ka-pi-sik',
      audio: 'brown_咖啡色_ka-pi-sik.mp3',
    },
  },
  {
    id: 'pink',
    value: '#d81b60',
    en: { label: 'pink', display: 'PINK', speech: 'pink' },
    ja: { label: '桃色', display: 'ももいろ', speech: 'ももいろ' },
    taigi: {
      label: '粉紅色',
      display: 'hún-âng',
      speech: 'hún-âng',
      audio: 'pink_粉紅色_hún-âng.mp3',
    },
  },
];

const SPEECH_DELAY_MS = 120;
const RESET_TIMEOUT_MS = 5000;
const NO_SPEECH_RESET_MS = 900;

function canSpeak() {
  return (
    typeof window !== 'undefined' &&
    'speechSynthesis' in window &&
    typeof window.SpeechSynthesisUtterance === 'function'
  );
}

function pickVoice(voices, language) {
  const primary = language === 'ja' ? 'ja-JP' : 'en-US';
  const prefix = language === 'ja' ? 'ja' : 'en';

  return (
    voices.find((voice) => voice.lang === primary) ||
    voices.find((voice) => voice.lang.toLowerCase().startsWith(prefix)) ||
    voices[0] ||
    null
  );
}

function stopPlayback({ resetTimer, speakTimer, utteranceRef, audioRef }) {
  if (speakTimer.current) {
    clearTimeout(speakTimer.current);
    speakTimer.current = null;
  }
  if (resetTimer.current) {
    clearTimeout(resetTimer.current);
    resetTimer.current = null;
  }
  if (utteranceRef.current) {
    utteranceRef.current.onend = null;
    utteranceRef.current.onerror = null;
    utteranceRef.current = null;
  }
  if (audioRef.current) {
    audioRef.current.onended = null;
    audioRef.current.onerror = null;
    if (typeof audioRef.current.pause === 'function') {
      audioRef.current.pause();
    }
    audioRef.current = null;
  }
  if (canSpeak()) {
    window.speechSynthesis.cancel();
  }
}

function audioUrl(filename) {
  return `${process.env.PUBLIC_URL || ''}/audio/${filename}`;
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
  const [language, setLanguage] = useState('en');
  const [activeColor, setActiveColor] = useState(null);
  const resetTimer = useRef(null);
  const speakTimer = useRef(null);
  const utteranceRef = useRef(null);
  const audioRef = useRef(null);

  useEffect(() => {
    const synth = canSpeak() ? window.speechSynthesis : null;

    const loadVoices = () => {
      if (synth) {
        synth.getVoices();
      }
    };

    if (synth) {
      loadVoices();
      if (typeof synth.addEventListener === 'function') {
        synth.addEventListener('voiceschanged', loadVoices);
      }
    }

    return () => {
      if (synth && typeof synth.removeEventListener === 'function') {
        synth.removeEventListener('voiceschanged', loadVoices);
      }
      stopPlayback({ resetTimer, speakTimer, utteranceRef, audioRef });
    };
  }, []);

  const handleLanguageChange = () => {
    stopPlayback({ resetTimer, speakTimer, utteranceRef, audioRef });
    setActiveColor(null);
    setLanguage((current) => {
      const nextIndex = (LANGUAGES.indexOf(current) + 1) % LANGUAGES.length;
      return LANGUAGES[nextIndex];
    });
  };

  const handlePress = (color) => {
    stopPlayback({ resetTimer, speakTimer, utteranceRef, audioRef });

    const translation = color[language];
    const active = `${language}:${color.id}`;
    setActiveColor(active);

    const reset = () => {
      if (resetTimer.current) {
        clearTimeout(resetTimer.current);
        resetTimer.current = null;
      }
      setActiveColor((current) => (current === active ? null : current));
    };

    resetTimer.current = setTimeout(reset, RESET_TIMEOUT_MS);

    if (language === 'taigi') {
      const audio = new Audio(audioUrl(translation.audio));
      audio.onended = reset;
      audio.onerror = reset;
      audioRef.current = audio;

      const playPromise = audio.play();
      if (playPromise && typeof playPromise.catch === 'function') {
        playPromise.catch(reset);
      }
      return;
    }

    if (!canSpeak()) {
      if (resetTimer.current) {
        clearTimeout(resetTimer.current);
      }
      resetTimer.current = setTimeout(reset, NO_SPEECH_RESET_MS);
      return;
    }

    const synth = window.speechSynthesis;

    speakTimer.current = setTimeout(() => {
      speakTimer.current = null;

      const utterance = new window.SpeechSynthesisUtterance(translation.speech);
      utterance.lang = language === 'ja' ? 'ja-JP' : 'en-US';
      utterance.rate = 0.85;
      utterance.pitch = 1;
      utterance.onend = reset;
      utterance.onerror = reset;

      const voice = pickVoice(synth.getVoices(), language);
      if (voice) {
        utterance.voice = voice;
      }

      utteranceRef.current = utterance;
      synth.speak(utterance);
    }, SPEECH_DELAY_MS);
  };

  return (
    <main className="app">
      <h1 className="title">
        <button
          type="button"
          className="title-button"
          onClick={handleLanguageChange}
          aria-label={`${TITLES[language]}, switch language`}
        >
          {TITLES[language]}
        </button>
      </h1>
      <div className="color-grid">
        {COLORS.map((color) => {
          const translation = color[language];
          const isActive = activeColor === `${language}:${color.id}`;

          return (
            <button
              key={color.id}
              type="button"
              className={`color-button${isActive ? ' is-active' : ''}`}
              data-color={color.id}
              style={{
                backgroundColor: color.value,
                color: textColorFor(color.value),
              }}
              onClick={() => handlePress(color)}
              aria-label={translation.label}
            >
              {isActive ? translation.display : translation.label}
            </button>
          );
        })}
      </div>
    </main>
  );
}

export default App;
