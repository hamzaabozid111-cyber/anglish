import { useRef, useState } from 'react';
import * as Speech from 'expo-speech';
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from 'expo-speech-recognition';

let voices = [];
let voicesLoaded = false;

async function ensureVoices() {
  if (voicesLoaded) return;
  try {
    voices = (await Speech.getAvailableVoicesAsync()) || [];
  } catch (e) {
    voices = [];
  }
  voicesLoaded = true;
}

const FEM = /female|samantha|zira|susan|karen|moira|hazel|salma|laila|fiona|tessa|victoria|serena|-x-[a-z]{3}#female/i;
const MAL = /\bmale\b|daniel|david|mark|alex|fred|tarik|maged|ahmed|oliver|arthur|george|james|-x-[a-z]{3}#male/i;

function pickVoice(lang, who) {
  const want = lang.toLowerCase().replace('_', '-');
  const pre = want.slice(0, 2);
  let list = voices.filter((v) => (v.language || '').toLowerCase().replace('_', '-') === want);
  if (!list.length) list = voices.filter((v) => (v.language || '').toLowerCase().startsWith(pre));
  if (!list.length) return undefined;
  const re = who === 'f' ? FEM : MAL;
  const hit = list.find((v) => re.test(`${v.identifier || ''} ${v.name || ''}`));
  return (hit || list[0]).identifier;
}

export const RATE = { slow: 0.7, normal: 0.95, fast: 1.25 };

// who: 'm' | 'f' (صوت المدرب) | 'p' (صوت اللاعب)
export async function speak(text, { lang = 'en-US', who = 'm', rate = 1, onStart, onDone } = {}) {
  await ensureVoices();
  const voice = pickVoice(lang, who === 'p' ? 'm' : who);
  Speech.speak(text, {
    language: lang,
    voice,
    rate,
    pitch: who === 'f' ? 1.25 : who === 'p' ? 0.85 : 1,
    onStart,
    onDone,
    onStopped: onDone,
    onError: onDone,
  });
}

export function stopSpeaking() {
  try {
    Speech.stop();
  } catch (e) {}
}

// المدرب بيتكلم عربي وإنجليزي
export function coachSay(coach, ar, en) {
  if (ar) speak(ar, { lang: 'ar', who: coach });
  if (en) speak(en, { lang: 'en-US', who: coach });
}

/* ---------- تشابه الجمل (لتقييم النطق) ---------- */
function norm(s) {
  return (s || '')
    .toLowerCase()
    .replace(/[^a-z0-9' ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function lev(a, b) {
  const m = a.length;
  const n = b.length;
  if (!m) return n;
  if (!n) return m;
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = cur;
  }
  return prev[n];
}

export function similarity(a, b) {
  const x = norm(a);
  const y = norm(b);
  if (!x || !y) return 0;
  return 1 - lev(x, y) / Math.max(x.length, y.length);
}

/* ---------- الميكروفون ---------- */
export function useMic(onFinal) {
  const [listening, setListening] = useState(false);
  const [heard, setHeard] = useState('');
  const [err, setErr] = useState('');
  const cb = useRef(onFinal);
  cb.current = onFinal;

  useSpeechRecognitionEvent('start', () => setListening(true));
  useSpeechRecognitionEvent('end', () => setListening(false));
  useSpeechRecognitionEvent('result', (e) => {
    const t = (e.results && e.results[0] && e.results[0].transcript) || '';
    setHeard(t);
    if (e.isFinal && t) cb.current(t);
  });
  useSpeechRecognitionEvent('error', (e) => {
    setListening(false);
    setErr((e && (e.message || e.error)) || 'error');
  });

  async function start() {
    setErr('');
    setHeard('');
    stopSpeaking();
    try {
      const p = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!p.granted) {
        setErr('permission');
        return;
      }
      ExpoSpeechRecognitionModule.start({
        lang: 'en-US',
        interimResults: true,
        maxAlternatives: 1,
        continuous: false,
      });
    } catch (e) {
      setErr('unavailable');
    }
  }

  function stop() {
    try {
      ExpoSpeechRecognitionModule.stop();
    } catch (e) {}
  }

  return { listening, heard, err, start, stop };
}
