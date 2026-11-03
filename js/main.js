import { CONFIG } from './config.js';
import { createInitialState, step, TICK_MS, PHASE_GAME_OVER } from './game.js';
import { draw, drawMenu, drawPause } from './render.js';
import {
  readInputs,
  isDebugEnabled,
  setupDebugThrow,
  takePendingThrow,
  getDragPreview,
  takeBackPressed,
} from './input.js';
import { placeBall } from './ball.js';
import { createAiController } from './ai.js';
import {
  createMenu,
  updateMenu,
  returnToTitle,
  createPauseMenu,
  updatePauseMenu,
  PAUSE_TO_MENU,
} from './menu.js';

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

// 디버그 모드에서 마우스 드래그로 공 던지기
setupDebugThrow(canvas);

// 화면 흐름: 메뉴 → 경기 → (경기 종료 후 ESC) 메뉴
const menu = createMenu();
let state = null; // 경기 중일 때만 게임 상태가 있다
let settings = null; // 메뉴에서 고른 설정 { cpu: [1P, 2P], level, name }
let aiControllers = [];
let pauseMenu = null; // 일시정지 중일 때만 있다 (게임 상태가 아닌 화면 상태)
let holdHitUntilRelease = false; // 일시정지 해제 직후: 결정에 쓴 치기 키를 뗄 때까지 경기에 전달하지 않음

// 메뉴에서 고른 설정으로 새 경기 시작
function startGame(chosen) {
  settings = chosen;
  state = createInitialState();
  aiControllers = [createAiController(0), createAiController(1)];
  pauseMenu = null;
}

// 경기를 끝내고 메뉴로 (지금 누른 키로 메뉴가 바로 선택되지 않게)
function backToMenu(inputs) {
  state = null;
  pauseMenu = null;
  returnToTitle(menu, inputs);
}

// 일시정지 해제 직후, 치기 키를 계속 누르고 있으면 뗄 때까지 감춘다 (스파이크·슬라이딩 오작동 방지)
function maskHeldHit(inputs) {
  if (!holdHitUntilRelease) return inputs;
  if (!inputs.some((input) => input.hit)) {
    holdHitUntilRelease = false;
    return inputs;
  }
  return inputs.map((input) => ({ ...input, hit: false }));
}

// 이번 틱 [1P, 2P] 입력. CPU 쪽은 AI에서, 경기 종료 화면에서는 다시 하기를 위해 키보드 그대로
function collectInputs(keyboardInputs) {
  if (state.phase === PHASE_GAME_OVER) return keyboardInputs;
  return keyboardInputs.map((input, side) =>
    settings.cpu[side] ? aiControllers[side](state, settings.level) : input,
  );
}

// 한 틱: 메뉴 또는 경기
function tick() {
  let keyboardInputs = readInputs();
  const backPressed = takeBackPressed();

  if (!state) {
    const chosen = updateMenu(menu, keyboardInputs, backPressed);
    if (chosen) startGame(chosen);
    return;
  }

  // 경기 종료 화면에서 ESC → 메뉴로
  if (state.phase === PHASE_GAME_OVER && backPressed) {
    backToMenu(keyboardInputs);
    return;
  }

  // 일시정지 중: 경기는 멈추고 메뉴만 처리
  if (pauseMenu) {
    const choice = updatePauseMenu(pauseMenu, keyboardInputs, backPressed);
    if (choice === PAUSE_TO_MENU) {
      backToMenu(keyboardInputs);
    } else if (choice) {
      pauseMenu = null;
      holdHitUntilRelease = true;
    }
    return;
  }

  // 경기 중 ESC → 일시정지
  if (backPressed) {
    pauseMenu = createPauseMenu(keyboardInputs);
    return;
  }

  keyboardInputs = maskHeldHit(keyboardInputs);

  // 디버그 모드에서는 승리 점수를 낮춰 빠르게 확인 (틱 사이에만 적용)
  state.winScore = isDebugEnabled() ? CONFIG.debug.winScore : CONFIG.winScore;

  // 디버그 던지기는 틱 사이에만 적용
  const pendingThrow = takePendingThrow();
  if (pendingThrow) placeBall(state.ball, pendingThrow);

  const [input1P, input2P] = collectInputs(keyboardInputs);
  step(state, input1P, input2P);
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
    tick();
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

  if (state) {
    draw(ctx, state, { enabled: isDebugEnabled(), stats, drag: getDragPreview(), settings });
    if (pauseMenu) drawPause(ctx, pauseMenu);
  } else {
    drawMenu(ctx, menu);
  }
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
