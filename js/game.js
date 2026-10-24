import { CONFIG } from './config.js';

// 게임 상태 전체를 담는 일반 객체를 만든다
export function createInitialState() {
  return {
    tick: 0, // 지금까지 진행한 틱 수
  };
}

// 한 틱을 계산한다. 입력은 { left, right, up, down, hit } 형태로 받는다.
// 1단계에서는 틱 수만 센다. 2단계부터 캐릭터·공 계산이 들어온다.
export function step(state, input1P, input2P) {
  state.tick += 1;
}

// 틱 하나의 길이 (밀리초)
export const TICK_MS = 1000 / CONFIG.tickRate;
