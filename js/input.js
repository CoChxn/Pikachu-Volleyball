import { CONFIG } from './config.js';

// 지금 눌려 있는 키들 (e.code 값)
const pressed = new Set();

// 게임에서 쓰는 키 전체 목록
const gameKeys = new Set([...Object.values(CONFIG.keys.p1), ...Object.values(CONFIG.keys.p2)]);

window.addEventListener('keydown', (e) => {
  if (!gameKeys.has(e.code)) return;
  e.preventDefault(); // 방향키·Enter로 페이지가 스크롤되지 않게
  pressed.add(e.code);
});

window.addEventListener('keyup', (e) => {
  pressed.delete(e.code);
});

// 다른 창으로 가면 keyup이 안 올 수 있으니 모두 뗀 것으로 처리
window.addEventListener('blur', () => {
  pressed.clear();
});

// 키 배치 하나를 { left, right, up, down, hit } 입력값으로 바꾼다
function toInput(keyMap) {
  return {
    left: pressed.has(keyMap.left),
    right: pressed.has(keyMap.right),
    up: pressed.has(keyMap.up),
    down: pressed.has(keyMap.down),
    hit: pressed.has(keyMap.hit),
  };
}

// 매 틱 호출: [1P 입력, 2P 입력]
export function readInputs() {
  return [toInput(CONFIG.keys.p1), toInput(CONFIG.keys.p2)];
}
