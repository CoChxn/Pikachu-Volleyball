import { CONFIG } from './config.js';
import { createPlayer, updatePlayer, SIDE_LEFT, SIDE_RIGHT } from './player.js';

// 게임 상태 전체를 담는 일반 객체를 만든다
export function createInitialState() {
  return {
    tick: 0, // 지금까지 진행한 틱 수
    players: [createPlayer(SIDE_LEFT), createPlayer(SIDE_RIGHT)], // [1P, 2P]
  };
}

// 한 틱을 계산한다. 입력은 { left, right, up, down, hit } 형태로 받는다.
export function step(state, input1P, input2P) {
  state.tick += 1;
  updatePlayer(state.players[0], input1P);
  updatePlayer(state.players[1], input2P);
}

// 틱 하나의 길이 (밀리초)
export const TICK_MS = 1000 / CONFIG.tickRate;
