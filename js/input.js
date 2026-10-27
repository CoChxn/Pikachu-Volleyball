import { CONFIG } from './config.js';

// 지금 눌려 있는 키들 (e.code 값)
const pressed = new Set();

// 게임에서 쓰는 키 전체 목록
const gameKeys = new Set([...Object.values(CONFIG.keys.p1), ...Object.values(CONFIG.keys.p2)]);

// 틱 사이에 눌렸던 키 (눌렀다 바로 떼도 다음 틱에 한 번 전달)
const tapped = new Set();

// 디버그 모드 켜짐 여부 (게임 상태가 아닌 화면 표시용)
let debugEnabled = false;

// 뒤로 가기 키가 눌렸는지 (한 번 꺼내 가면 지워짐)
let backTapped = false;

window.addEventListener('keydown', (e) => {
  if (e.code === CONFIG.debug.toggleKey) {
    e.preventDefault();
    if (!e.repeat) debugEnabled = !debugEnabled;
    return;
  }
  if (e.code === CONFIG.keys.back) {
    e.preventDefault();
    if (!e.repeat) backTapped = true;
    return;
  }
  if (!gameKeys.has(e.code)) return;
  e.preventDefault(); // 방향키·Enter로 페이지가 스크롤되지 않게
  pressed.add(e.code);
  if (!e.repeat) tapped.add(e.code);
});

window.addEventListener('keyup', (e) => {
  pressed.delete(e.code);
});

// 다른 창으로 가면 keyup이 안 올 수 있으니 모두 뗀 것으로 처리
window.addEventListener('blur', () => {
  pressed.clear();
  tapped.clear();
});

// 지금 눌려 있거나, 틱 사이에 잠깐 눌렸던 키
function isDown(code) {
  return pressed.has(code) || tapped.has(code);
}

// 키 배치 하나를 { left, right, up, down, hit } 입력값으로 바꾼다
function toInput(keyMap) {
  return {
    left: isDown(keyMap.left),
    right: isDown(keyMap.right),
    up: isDown(keyMap.up),
    down: isDown(keyMap.down),
    hit: isDown(keyMap.hit),
  };
}

// 매 틱 호출: [1P 입력, 2P 입력]
export function readInputs() {
  const inputs = [toInput(CONFIG.keys.p1), toInput(CONFIG.keys.p2)];
  tapped.clear();
  return inputs;
}

export function isDebugEnabled() {
  return debugEnabled;
}

// 매 틱 호출: 지난 틱 이후 뒤로 가기 키가 눌렸는지
export function takeBackPressed() {
  const pressedBack = backTapped;
  backTapped = false;
  return pressedBack;
}

// --- 디버그용 공 던지기 (마우스 드래그) ---

let drag = null; // { startX, startY, endX, endY } 논리 좌표
let pendingThrow = null; // 다음 틱 전에 적용할 던지기

// 화면 좌표를 게임 논리 좌표로 바꾼다
function toLogical(canvas, e) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((e.clientX - rect.left) / rect.width) * CONFIG.width,
    y: ((e.clientY - rect.top) / rect.height) * CONFIG.height,
  };
}

// 드래그 거리를 공 속도로 바꾼다 (최대 속도 제한)
function dragToVelocity(d) {
  const { throwDragScale, maxThrowSpeed } = CONFIG.debug;
  const clamp = (v) => Math.min(Math.max(v, -maxThrowSpeed), maxThrowSpeed);
  return {
    vx: clamp(Math.round((d.endX - d.startX) / throwDragScale)),
    vy: clamp(Math.round((d.endY - d.startY) / throwDragScale)),
  };
}

export function setupDebugThrow(canvas) {
  canvas.addEventListener('pointerdown', (e) => {
    if (!debugEnabled) return;
    const p = toLogical(canvas, e);
    drag = { startX: p.x, startY: p.y, endX: p.x, endY: p.y };
    canvas.setPointerCapture(e.pointerId);
  });

  canvas.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const p = toLogical(canvas, e);
    drag.endX = p.x;
    drag.endY = p.y;
  });

  canvas.addEventListener('pointerup', () => {
    if (!drag) return;
    const { vx, vy } = dragToVelocity(drag);
    pendingThrow = { x: Math.round(drag.startX), y: Math.round(drag.startY), vx, vy };
    drag = null;
  });

  canvas.addEventListener('pointercancel', () => {
    drag = null;
  });
}

// 그리기용: 드래그 중이면 시작점·끝점과 예상 속도
export function getDragPreview() {
  if (!drag) return null;
  return { ...drag, ...dragToVelocity(drag) };
}

// 쌓인 던지기를 꺼내 간다 (한 번 꺼내면 비워짐)
export function takePendingThrow() {
  const t = pendingThrow;
  pendingThrow = null;
  return t;
}
