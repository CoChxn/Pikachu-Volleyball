import { CONFIG } from './config.js';
import { createPlayer, updatePlayer, resetPlayer, trackHitKey, SIDE_LEFT, SIDE_RIGHT } from './player.js';
import { createBall, updateBall, placeBallForServe } from './ball.js';
import { resolveBallPlayer } from './physics.js';

// 경기 흐름 상태
export const PHASE_SERVING = 'serving'; // 서브 대기 (멈춤, READY)
export const PHASE_RALLY = 'rally'; // 랠리
export const PHASE_SCORED = 'scored'; // 득점 연출 (슬로모션)
export const PHASE_FADE_OUT = 'fadeOut'; // 어두워진 뒤 리셋
export const PHASE_GAME_OVER = 'gameOver'; // 경기 종료

// 게임 상태 전체를 담는 일반 객체를 만든다
export function createInitialState() {
  return {
    tick: 0, // 지금까지 진행한 틱 수
    phase: PHASE_SERVING,
    phaseTicks: 0, // 지금 경기 흐름 상태가 된 뒤 지난 틱 수
    score: [0, 0], // [1P, 2P]
    server: SIDE_LEFT, // 다음에 서브할 쪽 (첫 서브는 1P)
    winner: null, // 경기가 끝나면 이긴 쪽
    winScore: CONFIG.winScore, // 승리 점수
    players: [createPlayer(SIDE_LEFT), createPlayer(SIDE_RIGHT)], // [1P, 2P]
    ball: createBall(),
    rngSeed: CONFIG.rngInitialSeed, // 난수 상태
  };
}

// 경기 흐름 상태를 바꾼다
function setPhase(state, phase) {
  state.phase = phase;
  state.phaseTicks = 0;
}

// 새 라운드: 캐릭터와 공을 서브 위치로
function startRound(state) {
  setPhase(state, PHASE_SERVING);
  for (const player of state.players) {
    resetPlayer(player);
  }
  placeBallForServe(state.ball, state.server);
}

// 새 경기: 점수 0:0, 1P 서브
function startMatch(state) {
  state.score = [0, 0];
  state.server = SIDE_LEFT;
  state.winner = null;
  startRound(state);
}

// 캐릭터·공·충돌을 한 틱 진행한다. 공이 바닥에 닿았으면 true
function simulate(state, inputs) {
  state.players.forEach((player, i) => updatePlayer(player, inputs[i]));
  const touchedGround = updateBall(state.ball);
  for (const player of state.players) {
    resolveBallPlayer(state, player);
  }
  return touchedGround;
}

// 멈춰 있는 동안: 입력은 무시하고 치기 키 기록만 갱신
function freeze(state, inputs) {
  state.players.forEach((player, i) => trackHitKey(player, inputs[i]));
}

// 공이 닿은 위치로 득점: 네트 왼쪽이면 2P, 오른쪽이면 1P. 득점한 쪽이 다음 서브
function scorePoint(state) {
  const scorer = state.ball.x < CONFIG.width / 2 ? SIDE_RIGHT : SIDE_LEFT;
  state.score[scorer] += 1;
  state.server = scorer;

  if (state.score[scorer] >= state.winScore) {
    state.winner = scorer;
    setPhase(state, PHASE_GAME_OVER);
  } else {
    setPhase(state, PHASE_SCORED);
  }
}

// 한 틱을 계산한다. 입력은 { left, right, up, down, hit } 형태로 받는다.
export function step(state, input1P, input2P) {
  const inputs = [input1P, input2P];
  const m = CONFIG.match;
  state.tick += 1;
  state.phaseTicks += 1;

  switch (state.phase) {
    case PHASE_SERVING:
      freeze(state, inputs);
      if (state.phaseTicks >= m.serveTicks) setPhase(state, PHASE_RALLY);
      break;

    case PHASE_RALLY:
      if (simulate(state, inputs)) scorePoint(state);
      break;

    case PHASE_SCORED:
      // 슬로모션: 정해진 틱마다 한 번만 진행 (득점은 더 나지 않음)
      if (state.phaseTicks % m.slowMotionInterval === 0) {
        simulate(state, inputs);
      } else {
        freeze(state, inputs);
      }
      if (state.phaseTicks >= m.slowMotionInterval * m.slowMotionSteps) setPhase(state, PHASE_FADE_OUT);
      break;

    case PHASE_FADE_OUT:
      freeze(state, inputs);
      if (state.phaseTicks >= m.fadeOutTicks) startRound(state);
      break;

    case PHASE_GAME_OVER: {
      // 치기 키가 새로 눌렸는지 (캐릭터 갱신 전에 확인)
      const restart = inputs.some((input, i) => input.hit && !state.players[i].prevHit);
      simulate(state, inputs); // 계속 움직일 수 있지만 득점은 없음
      if (state.phaseTicks >= m.gameOverMinTicks && restart) startMatch(state);
      break;
    }
  }
}

// 틱 하나의 길이 (밀리초)
export const TICK_MS = 1000 / CONFIG.tickRate;
