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
];

let voices;
let utterances;
let speechSynthesisMock;

beforeEach(() => {
  jest.useFakeTimers();

  voices = [
    { name: 'French', lang: 'fr-FR' },
    { name: 'English', lang: 'en-US' },
  ];
  utterances = [];
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
});

afterEach(() => {
  jest.clearAllTimers();
  jest.useRealTimers();
  delete window.speechSynthesis;
  delete window.SpeechSynthesisUtterance;
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
