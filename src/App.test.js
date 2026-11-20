import { act, fireEvent, render, screen } from '@testing-library/react';
import App from './App';

const COLOR_NAMES = [
  'white',
  'black',
  'red',
  'blue',
  'green',
  'yellow',
  'orange',
  'purple',
  'brown',
  'pink',
];

let voices;
let utterances;
let audioElements;
let speechSynthesisMock;

const languageButton = () =>
  screen.getByRole('button', { name: /switch language/i });

beforeEach(() => {
  jest.useFakeTimers();

  voices = [
    { name: 'French', lang: 'fr-FR' },
    { name: 'English', lang: 'en-US' },
    { name: 'Japanese', lang: 'ja-JP' },
  ];
  utterances = [];
  audioElements = [];
  speechSynthesisMock = {
    getVoices: jest.fn(() => voices),
    cancel: jest.fn(),
    speak: jest.fn((utterance) => utterances.push(utterance)),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  };

  Object.defineProperty(window, 'speechSynthesis', {
    configurable: true,
    value: speechSynthesisMock,
  });
  window.SpeechSynthesisUtterance = class SpeechSynthesisUtterance {
    constructor(text) {
      this.text = text;
    }
  };
  window.Audio = class Audio {
    constructor(src) {
      this.src = src;
      this.play = jest.fn(() => Promise.resolve());
      this.pause = jest.fn();
      audioElements.push(this);
    }
  };
});

afterEach(() => {
  jest.clearAllTimers();
  jest.useRealTimers();
  delete window.speechSynthesis;
  delete window.SpeechSynthesisUtterance;
  delete window.Audio;
});

test('renders the Colors title and every color button', () => {
  render(<App />);

  expect(screen.getByRole('heading', { name: /colors/i })).toBeInTheDocument();

  COLOR_NAMES.forEach((name) => {
    expect(screen.getByRole('button', { name })).toBeInTheDocument();
  });
});

test('speaks the pressed color with an explicitly selected voice', () => {
  render(<App />);

  fireEvent.click(screen.getByRole('button', { name: 'purple' }));

  expect(speechSynthesisMock.cancel).toHaveBeenCalled();
  expect(speechSynthesisMock.speak).not.toHaveBeenCalled();

  act(() => {
    jest.advanceTimersByTime(120);
  });

  expect(speechSynthesisMock.speak).toHaveBeenCalledTimes(1);
  expect(utterances[0].text).toBe('purple');
  expect(utterances[0].voice).toBe(voices[1]);
});

test('highlights the active color and clears it when speech ends', () => {
  render(<App />);
  const button = screen.getByRole('button', { name: 'blue' });

  fireEvent.click(button);
  expect(button).toHaveTextContent('BLUE');

  act(() => {
    jest.advanceTimersByTime(120);
  });

  act(() => {
    utterances[0].onend();
  });

  expect(button).toHaveTextContent('blue');
});

test('falls back to a timed reset when speech synthesis is unavailable', () => {
  delete window.speechSynthesis;
  delete window.SpeechSynthesisUtterance;

  render(<App />);
  const button = screen.getByRole('button', { name: 'red' });

  fireEvent.click(button);
  expect(button).toHaveTextContent('RED');

  act(() => {
    jest.advanceTimersByTime(900);
  });

  expect(button).toHaveTextContent('red');
});

test('switches to Japanese, shows kanji, and speaks the kana', () => {
  render(<App />);

  fireEvent.click(languageButton());

  expect(screen.getByRole('heading', { name: /色/ })).toBeInTheDocument();

  const button = screen.getByRole('button', { name: '白' });
  expect(button).toHaveTextContent('白');

  fireEvent.click(button);
  expect(button).toHaveTextContent('しろ');

  act(() => {
    jest.advanceTimersByTime(120);
  });

  expect(speechSynthesisMock.speak).toHaveBeenCalledTimes(1);
  expect(utterances[0].text).toBe('しろ');
  expect(utterances[0].lang).toBe('ja-JP');
  expect(utterances[0].voice).toBe(voices[2]);

  act(() => {
    utterances[0].onend();
  });

  expect(button).toHaveTextContent('白');
});

test('switches to Taigi and plays the matching audio clip', () => {
  render(<App />);

  fireEvent.click(languageButton());
  fireEvent.click(languageButton());

  expect(screen.getByRole('heading', { name: /顏色/ })).toBeInTheDocument();

  const button = screen.getByRole('button', { name: '咖啡色' });
  fireEvent.click(button);

  expect(button).toHaveTextContent('ka-pi-sik');
  expect(audioElements).toHaveLength(1);
  expect(audioElements[0].src).toBe('/audio/brown_咖啡色_ka-pi-sik.mp3');
  expect(audioElements[0].play).toHaveBeenCalled();
  expect(speechSynthesisMock.speak).not.toHaveBeenCalled();

  act(() => {
    audioElements[0].onended();
  });

  expect(button).toHaveTextContent('咖啡色');
});

test('cycles back to English after Taigi', () => {
  render(<App />);

  fireEvent.click(languageButton());
  fireEvent.click(languageButton());
  fireEvent.click(languageButton());

  expect(screen.getByRole('heading', { name: /colors/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'white' })).toBeInTheDocument();
});
