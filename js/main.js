import { CONFIG } from './config.js';
import { createInitialState, step, TICK_MS, PHASE_GAME_OVER } from './game.js';
import { draw } from './render.js';
import {
  readInputs,
  isDebugEnabled,
  setupDebugThrow,
  takePendingThrow,
  getDragPreview,
  getMode,
  getAiLevel,
} from './input.js';
import { createAiController } from './ai.js';
import { placeBall } from './ball.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

// 캔버스 실제 픽셀 수는 논리 해상도 그대로. 확대는 CSS가 맡는다.
canvas.width = CONFIG.width;
canvas.height = CONFIG.height;

// 창 크기에 맞춰 비율을 유지하며 확대한다
function fitCanvas() {
  const dpr = window.devicePixelRatio || 1;
  // 기기 픽셀 기준 배율
  let scale = Math.min(
    (window.innerWidth * dpr) / CONFIG.width,
    (window.innerHeight * dpr) / CONFIG.height,
  );
  if (CONFIG.integerScale && scale >= 1) {
    scale = Math.floor(scale);
  }
  canvas.style.width = `${(CONFIG.width * scale) / dpr}px`;
  canvas.style.height = `${(CONFIG.height * scale) / dpr}px`;
}
window.addEventListener('resize', fitCanvas);
fitCanvas();

const state = createInitialState();

// 디버그 모드에서 마우스 드래그로 공 던지기
setupDebugThrow(canvas);

// CPU가 맡은 쪽의 입력은 키보드 대신 AI에서 가져온다
const aiControllers = [createAiController(0), createAiController(1)];

// 이번 틱 [1P, 2P] 입력. 경기 종료 화면에서는 다시 하기를 위해 키보드 그대로
function collectInputs() {
  const inputs = readInputs();
  if (state.phase === PHASE_GAME_OVER) return inputs;
  const mode = getMode();
  return inputs.map((input, side) => (mode.cpu[side] ? aiControllers[side](state, getAiLevel()) : input));
}

// 루프 확인용 측정값 (게임 상태가 아님)
const stats = { ticksPerSecond: 0 };
let ticksThisSecond = 0;
let secondStart = null;

let accumulator = 0; // 아직 처리하지 않고 쌓인 시간 (밀리초)
let lastTime = null;

// 고정 타임스텝 루프: 실제 시간은 "몇 번 step할지"에만 쓰고 물리에는 넣지 않는다
function frame(now) {
  if (lastTime === null) {
    lastTime = now;
    secondStart = now;
  }
  accumulator += now - lastTime;
  lastTime = now;

  let ticks = 0;
  while (accumulator >= TICK_MS && ticks < CONFIG.maxTicksPerFrame) {
    // 디버그 모드에서는 승리 점수를 낮춰 빠르게 확인 (틱 사이에만 적용)
    state.winScore = isDebugEnabled() ? CONFIG.debug.winScore : CONFIG.winScore;

    // 디버그 던지기는 틱 사이에만 적용
    const pendingThrow = takePendingThrow();
    if (pendingThrow) placeBall(state.ball, pendingThrow);

    const [input1P, input2P] = collectInputs();
    step(state, input1P, input2P);
    accumulator -= TICK_MS;
    ticks += 1;
  }
  // 너무 밀렸으면 남은 시간은 버린다
  if (accumulator >= TICK_MS) {
    accumulator = 0;
  }

  // 1초마다 실제 초당 틱 수 갱신
  ticksThisSecond += ticks;
  if (now - secondStart >= 1000) {
    stats.ticksPerSecond = ticksThisSecond;
    ticksThisSecond = 0;
    secondStart = now;
  }

  draw(ctx, state, {
    enabled: isDebugEnabled(),
    stats,
    drag: getDragPreview(),
    mode: getMode(),
    level: getAiLevel(),
  });
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
