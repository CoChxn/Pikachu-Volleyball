import { CONFIG } from './config.js';

// 효과음: Web Audio API로 소리를 직접 만든다 (소리 파일 없음)
// 게임 상태는 읽기만 하고, 소리는 게임 결과에 영향을 주지 않는다.

let audio = null; // AudioContext (브라우저는 사용자가 키를 누른 뒤에만 소리를 허용)
let noiseBuffer = null; // "칙" 소리용 잡음 (한 번만 만들어 재사용)

// 첫 키 입력이나 클릭 때 오디오를 켠다
function unlockAudio() {
  if (!audio) {
    audio = new AudioContext();
    noiseBuffer = createNoiseBuffer();
  }
  if (audio.state === 'suspended') audio.resume();
}
window.addEventListener('keydown', unlockAudio);
window.addEventListener('pointerdown', unlockAudio);

// 무작위 잡음 (소리 전용이라 Math.random을 써도 게임 결과와 무관)
function createNoiseBuffer() {
  const length = Math.floor(audio.sampleRate * CONFIG.sound.noiseSeconds);
  const buffer = audio.createBuffer(1, length, audio.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  return buffer;
}

// 소리 크기를 빠르게 올렸다가 서서히 줄이는 증폭기
function envelope(start, duration, volume) {
  const gain = audio.createGain();
  const peak = volume * CONFIG.sound.masterVolume;
  gain.gain.setValueAtTime(peak, start);
  gain.gain.exponentialRampToValueAtTime(CONFIG.sound.silence, start + duration);
  gain.connect(audio.destination);
  return gain;
}

// 음 하나: 주파수가 from에서 to로 바뀌는 짧은 소리
function playTone(part, start) {
  const osc = audio.createOscillator();
  osc.type = part.wave;
  osc.frequency.setValueAtTime(part.from, start);
  osc.frequency.exponentialRampToValueAtTime(part.to, start + part.duration);
  osc.connect(envelope(start, part.duration, part.volume));
  osc.start(start);
  osc.stop(start + part.duration);
}

// 잡음: 특정 높이(filter)만 남긴 "칙/팡" 소리
function playNoise(part, start) {
  const source = audio.createBufferSource();
  source.buffer = noiseBuffer;
  const filter = audio.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = part.filter;
  source.connect(filter);
  filter.connect(envelope(start, part.duration, part.volume));
  source.start(start);
  source.stop(start + part.duration);
}

// 이름으로 효과음 하나 재생 (config.js의 sound.effects)
export function playSound(name) {
  const parts = CONFIG.sound.effects[name];
  if (!audio || !parts) return;
  const now = audio.currentTime;
  for (const part of parts) {
    const start = now + (part.delay ?? 0);
    if (part.kind === 'noise') playNoise(part, start);
    else playTone(part, start);
  }
}

// 이번 틱의 사건들을 소리로
export function playEvents(events) {
  for (const name of events) {
    playSound(name);
  }
}
