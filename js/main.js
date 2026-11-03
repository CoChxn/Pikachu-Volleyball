import { CONFIG } from './config.js';
import { createInitialState, step, TICK_MS, PHASE_GAME_OVER } from './game.js';
import { draw, drawMenu, drawPause, drawChoice, drawOnlineLobby, drawOnlineHud } from './render.js';
import {
  readInputs,
  isDebugEnabled,
  setupDebugThrow,
  takePendingThrow,
  getDragPreview,
  takeBackPressed,
  takeTypedKeys,
  isMuted,
} from './input.js';
import { playEvents, playSound } from './sound.js';
import { createEffects, updateEffects } from './effects.js';
import { placeBall } from './ball.js';
import { createAiController } from './ai.js';
import {
  createMenu,
  updateMenu,
  returnToTitle,
  createPauseMenu,
  updatePauseMenu,
  PAUSE_TO_MENU,
  createChoiceMenu,
  updateChoiceMenu,
} from './menu.js';
import {
  createOnlineSession,
  updateOnline,
  leaveOnline,
  ONLINE_LOBBY,
  ONLINE_ENDED,
} from './online.js';

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
let effects = createEffects(); // 손맛 연출 (화면 전용)
let pauseMenu = null; // 일시정지 중일 때만 있다 (게임 상태가 아닌 화면 상태)
let holdHitUntilRelease = false; // 일시정지 해제 직후: 결정에 쓴 치기 키를 뗄 때까지 경기에 전달하지 않음
let online = null; // 온라인 대전 중일 때만 있다 (게임 상태는 online.state)
let onlineMenu = null; // 온라인: 나가기 확인 / 연결 끊김 안내 창

const NO_INPUT = { left: false, right: false, up: false, down: false, hit: false };

// 온라인 고르기 창 항목
const LEAVE_STAY = 'stay';
const LEAVE_YES = 'leave';
const LEAVE_ITEMS = [
  { label: 'NO', value: LEAVE_STAY },
  { label: 'YES', value: LEAVE_YES },
];
const ENDED_ITEMS = [{ label: 'MENU', value: LEAVE_YES }];

// 메뉴에서 고른 설정으로 새 경기 시작
function startGame(chosen) {
  settings = chosen;
  effects = createEffects();
  if (chosen.online) {
    // 온라인: 연결이 되고 방장이 시드를 정하면 경기가 시작된다
    online = createOnlineSession(chosen.role, chosen.code, performance.now());
    onlineMenu = null;
    return;
  }
  state = createInitialState();
  aiControllers = [createAiController(0), createAiController(1)];
  effects = createEffects();
  pauseMenu = null;
}

// 경기를 끝내고 메뉴로 (지금 누른 키로 메뉴가 바로 선택되지 않게)
function backToMenu(inputs) {
  state = null;
  pauseMenu = null;
  online = null;
  onlineMenu = null;
  returnToTitle(menu, inputs);
}

// 온라인에서는 한 사람이 한 키보드를 쓰므로 두 키 배치 중 아무 쪽으로나 조작
function mergeInputs(inputs) {
  const merged = { ...NO_INPUT };
  for (const input of inputs) {
    for (const key of Object.keys(merged)) merged[key] = merged[key] || input[key];
  }
  return merged;
}

// 온라인 한 틱: 대기실, 경기, 끝남 처리. 경기는 멈추지 않는다 (한쪽만 멈추면 어긋나므로)
function tickOnline(keyboardInputs, backPressed) {
  const session = online;
  const now = performance.now();

  // 끝남(상대가 나감·연결 끊김·오류): 안내 창에서 Z/Enter 또는 ESC → 메뉴
  if (session.phase === ONLINE_ENDED) {
    if (!onlineMenu || onlineMenu.items !== ENDED_ITEMS) {
      onlineMenu = createChoiceMenu(ENDED_ITEMS, keyboardInputs);
    }
    if (backPressed || updateChoiceMenu(onlineMenu, keyboardInputs)) backToMenu(keyboardInputs);
    return;
  }

  // 대기실: ESC로 취소
  if (session.phase === ONLINE_LOBBY) {
    if (backPressed) {
      leaveOnline(session);
      backToMenu(keyboardInputs);
      return;
    }
    updateOnline(session, NO_INPUT, now, () => {});
    return;
  }

  // 경기 중 ESC → 나가기 확인 창 (그동안 내 입력은 없음)
  if (onlineMenu) {
    const choice = backPressed ? LEAVE_STAY : updateChoiceMenu(onlineMenu, keyboardInputs);
    if (choice === LEAVE_YES) {
      leaveOnline(session);
      backToMenu(keyboardInputs);
      return;
    }
    if (choice === LEAVE_STAY) {
      onlineMenu = null;
      holdHitUntilRelease = true;
    }
  } else if (backPressed) {
    onlineMenu = createChoiceMenu(LEAVE_ITEMS, keyboardInputs);
  }

  const localInput = onlineMenu ? NO_INPUT : mergeInputs(maskHeldHit(keyboardInputs));
  updateOnline(session, localInput, now, () => {
    updateEffects(effects, session.state);
    if (!isMuted()) playEvents(session.state.events);
  });
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
  const typedKeys = takeTypedKeys();

  if (online) {
    tickOnline(keyboardInputs, backPressed);
    return;
  }

  if (!state) {
    const before = { screen: menu.screen, cursor: menu.cursor };
    const chosen = updateMenu(menu, keyboardInputs, backPressed, typedKeys);
    playMenuSound(before, menu, chosen);
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
    const before = { screen: null, cursor: pauseMenu.cursor };
    const choice = updatePauseMenu(pauseMenu, keyboardInputs, backPressed);
    playMenuSound(before, { screen: null, cursor: pauseMenu.cursor }, choice);
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
  updateEffects(effects, state);
  if (!isMuted()) playEvents(state.events);
}

// 메뉴 효과음: 고르거나 화면이 바뀌면 "띵", 커서만 움직이면 "삑"
function playMenuSound(before, after, chosen) {
  if (isMuted()) return;
  if (chosen || before.screen !== after.screen) playSound('menuSelect');
  else if (before.cursor !== after.cursor) playSound('menuMove');
}

// 온라인 화면: 대기실 또는 경기, 그 위에 나가기 확인·끝남 안내
function drawOnline(view, now) {
  if (online.state) {
    draw(ctx, online.state, { ...view, drag: null });
    drawOnlineHud(ctx, online, now);
  } else {
    drawOnlineLobby(ctx, online);
  }
  if (online.phase === ONLINE_ENDED) {
    drawChoice(ctx, online.endReason, ENDED_ITEMS, 0, null);
  } else if (onlineMenu) {
    drawChoice(ctx, CONFIG.menu.leaveTitle, LEAVE_ITEMS, onlineMenu.cursor, null);
  }
}

// 온라인 중에 탭을 닫거나 다른 페이지로 가면 상대에게 바로 알린다 (안 그러면 시간 초과까지 기다림)
window.addEventListener('pagehide', () => {
  if (online) leaveOnline(online);
});

// 테스트용: 주소에 ?test 를 붙이면 자동 점검이 상태를 읽을 수 있게 한다 (읽기 전용)
if (new URLSearchParams(window.location.search).has('test')) {
  window.volleyTest = { online: () => online, state: () => state };
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

  const view = {
    enabled: isDebugEnabled(),
    stats,
    drag: getDragPreview(),
    settings,
    muted: isMuted(),
    effects,
  };
  if (online) {
    drawOnline(view, now);
  } else if (state) {
    draw(ctx, state, view);
    if (pauseMenu) drawPause(ctx, pauseMenu);
  } else {
    drawMenu(ctx, menu, isMuted());
  }
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
