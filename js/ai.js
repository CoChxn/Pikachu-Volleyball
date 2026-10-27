import { CONFIG } from './config.js';
import { updateBall } from './ball.js';
import { spikeVelocity } from './physics.js';
import { SIDE_LEFT, PLAYER_STANDING, PLAYER_JUMPING, PLAYER_SPIKING } from './player.js';
import { PHASE_RALLY } from './game.js';

// 난이도
export const AI_EASY = 0;
export const AI_NORMAL = 1;
export const AI_HARD = 2;
export const AI_LEVEL_NAMES = ['EASY', 'NORMAL', 'HARD'];

const NO_INPUT = { left: false, right: false, up: false, down: false, hit: false };

// 공을 복사해 한 틱씩 미리 굴려 본다 (선수는 무시). 각 틱의 공 위치 목록과 착지 정보
export function predictBall(ball) {
  const b = { ...ball };
  const path = [];
  for (let t = 1; t <= CONFIG.ai.maxPredictTicks; t++) {
    const touched = updateBall(b);
    path.push({ ...b });
    if (touched) return { path, landingX: b.x, landingTicks: t };
  }
  return { path, landingX: b.x, landingTicks: CONFIG.ai.maxPredictTicks };
}

// 이 x가 side 쪽 코트인지
function isOnSide(x, side) {
  const onLeft = x < CONFIG.width / 2;
  return side === SIDE_LEFT ? onLeft : !onLeft;
}

// 공 중심이 캐릭터 사각형 안에 있는지 (physics.js의 판정과 같음)
function overlaps(ballPos, x, y) {
  const { halfWidth, halfHeight } = CONFIG.player;
  return Math.abs(ballPos.x - x) <= halfWidth && Math.abs(ballPos.y - y) <= halfHeight;
}

// 서 있을 때 몸 중심 y
function standingY() {
  return CONFIG.groundY - CONFIG.player.halfHeight;
}

// 앞으로 n틱 동안 내 몸 중심 y 목록 (지금 세로 속도 vy에서 시작, 착지하면 멈춤)
function futureYs(y, vy, n) {
  const ys = [];
  for (let t = 0; t < n; t++) {
    y += vy;
    vy += CONFIG.player.gravity;
    if (y >= standingY()) {
      y = standingY();
      vy = 0;
    }
    ys.push(y);
  }
  return ys;
}

// path에서 앞으로 n틱 안에 몸(x 고정, ys 높이)과 공이 겹치는 첫 틱 번호 (없으면 -1)
function firstContactTick(path, x, ys) {
  for (let t = 0; t < ys.length && t < path.length; t++) {
    if (overlaps(path[t], x, ys[t])) return t;
  }
  return -1;
}

// 공을 받을 x: 공이 머리 높이까지 내려오는 곳 (그런 순간이 없으면 착지 지점)
function receiveX(prediction) {
  const headY = standingY() - CONFIG.player.halfHeight;
  for (const p of prediction.path) {
    if (p.vy > 0 && p.y >= headY) return p.x;
  }
  return prediction.landingX;
}

// 스파이크 방향 고르기: 후보마다 결과를 미리 굴려 상대가 받기 어려운 쪽
function chooseSpike(state, side, contactBall, level) {
  if (level === AI_EASY) return { inputX: 0, inputY: 0 };

  const { speed, halfWidth } = CONFIG.player;
  const { minBounceSpeed } = CONFIG.ball;
  const opponent = state.players[1 - side];
  const toward = side === SIDE_LEFT ? 1 : -1;
  // 몸 충돌 처리 후 세로 속도 (최소 세기 보장)
  const incomingVy = Math.max(Math.abs(contactBall.vy), minBounceSpeed);

  let best = { inputX: 0, inputY: 0 };
  let bestScore = -Infinity;
  for (const inputX of [0, toward]) {
    for (const inputY of [-1, 0, 1]) {
      const v = spikeVelocity(side, inputX, inputY, incomingVy);
      const result = predictBall({ ...contactBall, vx: v.vx, vy: v.vy });
      if (isOnSide(result.landingX, side)) continue; // 내 코트에 떨어지면 탈락

      // 보통: 상대에게서 먼 곳. 어려움: 상대가 그 시간 안에 걸어서 닿을 거리까지 뺀다
      let score = Math.abs(result.landingX - opponent.x);
      if (level === AI_HARD) score -= speed * result.landingTicks + halfWidth;
      if (score > bestScore) {
        bestScore = score;
        best = { inputX, inputY };
      }
    }
  }
  return best;
}

// 방향 값(-1, 0, 1)을 키 입력으로
function directionKeys(input, inputX, inputY) {
  input.left = inputX < 0;
  input.right = inputX > 0;
  input.up = inputY < 0;
  input.down = inputY > 0;
}

// AI 한 틱 판단: 상태를 읽기만 하고 키 입력 { left, right, up, down, hit }를 돌려준다
export function computeAiInput(state, side, level) {
  if (state.phase !== PHASE_RALLY) return { ...NO_INPUT };

  const cfg = CONFIG.ai;
  const { halfWidth, speed, diveSpeed, jumpSpeed, spikeTicks } = CONFIG.player;
  const me = state.players[side];
  const toward = side === SIDE_LEFT ? 1 : -1; // 상대 코트 방향
  const boldness = state.ai.boldness[side];
  const input = { ...NO_INPUT };

  const prediction = predictBall(state.ball);
  const ballComing = isOnSide(prediction.landingX, side);

  // 목표 위치: 공이 올 거면 받을 곳 뒤쪽, 아니면 내 코트 기본 위치(대담할수록 네트 가까이)
  let targetX;
  if (ballComing) {
    const error = level === AI_EASY ? state.ai.errorX[side] : 0;
    targetX = receiveX(prediction) + error - toward * cfg.receiveOffsetX;
  } else {
    const wallX = side === SIDE_LEFT ? 0 : CONFIG.width;
    const homeX = (wallX + CONFIG.width / 2) / 2;
    targetX = homeX + toward * boldness * cfg.boldStepX;
  }
  const dx = targetX - me.x;
  const moveX = Math.abs(dx) > cfg.moveDeadzone ? Math.sign(dx) : 0;

  // 공중: 스파이크 시간 안에 공과 닿을 것 같으면 치기 (스파이크 중엔 방향만 유지)
  if (me.state === PLAYER_JUMPING || me.state === PLAYER_SPIKING) {
    const ys = futureYs(me.y, me.vy, spikeTicks);
    const contact = firstContactTick(prediction.path, me.x, ys);
    if (contact >= 0) {
      const spike = chooseSpike(state, side, prediction.path[contact], level);
      directionKeys(input, spike.inputX, spike.inputY);
      input.hit = me.state === PLAYER_JUMPING;
    } else {
      directionKeys(input, moveX, 0);
    }
    return input;
  }

  if (me.state !== PLAYER_STANDING) return input; // 슬라이딩·엎드림 중엔 조작 불가

  directionKeys(input, moveX, 0);
  if (!ballComing) return input;

  // 슬라이딩: 곧 떨어지는데 걸어서는 못 닿고 슬라이딩으로는 닿을 때 (대담하면 안 함)
  const distance = Math.abs(prediction.landingX - me.x) - halfWidth;
  const ticks = prediction.landingTicks;
  if (
    boldness < cfg.diveMaxBoldness &&
    ticks <= cfg.diveTriggerTicks &&
    distance > speed * ticks &&
    distance <= diveSpeed * ticks
  ) {
    directionKeys(input, Math.sign(prediction.landingX - me.x), 0);
    input.hit = true;
    return input;
  }

  // 빠르게 날아오는 스파이크는 점프하지 않고 몸으로 받는다
  if (Math.abs(state.ball.vx) >= CONFIG.ball.spikeSpeedX) return input;

  // 점프: 지금 뛰면 공중에서 공과 만날 때 (대담할수록 더 먼 공에도 뜀)
  const reach = cfg.jumpReachX + boldness * cfg.jumpReachPerBold;
  const ys = futureYs(me.y, -jumpSpeed, cfg.jumpLookTicks);
  for (let t = 0; t < ys.length && t < prediction.path.length; t++) {
    const p = prediction.path[t];
    if (ys[t] < standingY() && Math.abs(p.x - me.x) <= reach && Math.abs(p.y - ys[t]) <= CONFIG.player.halfHeight) {
      input.up = true;
      break;
    }
  }
  return input;
}

// AI 조작기: 쉬움은 몇 틱마다 한 번만 판단하고 그 사이엔 같은 방향을 유지 (입력 쪽 기억이라 게임 상태 밖)
export function createAiController(side) {
  let held = { ...NO_INPUT };
  let ticksUntilThink = 0;

  return function nextInput(state, level) {
    if (level !== AI_EASY) return computeAiInput(state, side, level);

    if (ticksUntilThink <= 0) {
      held = computeAiInput(state, side, level);
      ticksUntilThink = CONFIG.ai.easyReactionTicks;
      ticksUntilThink -= 1;
      return held;
    }
    ticksUntilThink -= 1;
    return { ...held, hit: false }; // 치기는 판단한 틱에만
  };
}
