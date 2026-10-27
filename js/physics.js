import { CONFIG } from './config.js';
import { randomInt } from './rng.js';
import { SIDE_LEFT, PLAYER_SPIKING } from './player.js';

// 공-벽, 공-천장, 공-바닥: 넘어갔으면 경계로 되돌리고 속도 방향을 뒤집는다
// 바닥에 닿았으면 true
export function resolveBallWalls(ball) {
  const { width, groundY } = CONFIG;
  const { radius, ceilingY, ceilingBounceVy } = CONFIG.ball;

  // 왼쪽 벽
  if (ball.x < radius) {
    ball.x = radius;
    ball.vx = Math.abs(ball.vx);
  }
  // 오른쪽 벽
  if (ball.x > width - radius) {
    ball.x = width - radius;
    ball.vx = -Math.abs(ball.vx);
  }
  // 천장 (원작: 반쯤 나갔다가 위로 가던 힘을 잃고 떨어짐)
  if (ball.y < ceilingY && ball.vy < 0) {
    ball.vy = ceilingBounceVy;
  }
  // 바닥
  if (ball.y > groundY - radius) {
    ball.y = groundY - radius;
    ball.vy = -Math.abs(ball.vy);
    return true;
  }
  return false;
}

// 공-네트: 꼭대기 띠에 닿으면 위로, 그보다 아래면 원래 있던 쪽으로 튕긴다
export function resolveBallNet(ball, prevX) {
  const { width, netWidth, netTopY } = CONFIG;
  const { radius, netTopBounceDepth } = CONFIG.ball;

  const netCenterX = width / 2;
  const reachX = netWidth / 2 + radius; // 공 중심이 이 거리 안이면 네트와 겹침
  const topY = netTopY - radius; // 공 아랫면이 네트 꼭대기에 닿는 공 중심 y
  const topBandBottomY = topY + netTopBounceDepth;

  if (ball.y <= topY) return; // 네트보다 위

  // 이번 틱에 네트 중심선을 건너갔는지 (빠른 공이 네트를 뚫지 않게)
  const crossed = prevX < netCenterX !== ball.x < netCenterX;
  const overlapping = Math.abs(ball.x - netCenterX) < reachX;
  if (!crossed && !overlapping) return;

  if (ball.y <= topBandBottomY) {
    // 꼭대기: 위로 튕김
    ball.y = topY;
    ball.vy = -Math.abs(ball.vy);
    return;
  }

  // 기둥 옆면: 원래 있던 쪽으로 밀어내고 가로로 튕김
  if (prevX < netCenterX) {
    ball.x = netCenterX - reachX;
    ball.vx = -Math.abs(ball.vx);
  } else {
    ball.x = netCenterX + reachX;
    ball.vx = Math.abs(ball.vx);
  }
}

// 공-캐릭터: 공 중심이 캐릭터 사각형 안에 들어오면 튕긴다
export function resolveBallPlayer(state, player) {
  const { ball } = state;
  const { halfWidth, halfHeight } = CONFIG.player;
  const { bodyBounceDivisor, minBounceSpeed } = CONFIG.ball;

  const dx = ball.x - player.x;
  const touching = Math.abs(dx) <= halfWidth && Math.abs(ball.y - player.y) <= halfHeight;
  if (!touching) {
    player.ballContact = false;
    return;
  }
  // 겹쳐 있는 동안에는 한 번만 튕긴다
  if (player.ballContact) return;
  player.ballContact = true;

  // 몸 충돌: 중심에서 멀리 맞을수록 옆으로 세게 (소수점 버림)
  ball.vx = Math.trunc(dx / bodyBounceDivisor);
  if (ball.vx === 0) {
    ball.vx = randomInt(state, 3) - 1; // -1, 0, 1 중 하나 (원작)
  }
  // 항상 위로, 최소 세기 보장
  ball.vy = -Math.max(Math.abs(ball.vy), minBounceSpeed);

  // 스파이크: 상대 코트 쪽으로, 방향키에 따라 세기·각도
  if (player.state === PLAYER_SPIKING) {
    const v = spikeVelocity(player.side, player.inputX, player.inputY, ball.vy);
    ball.vx = v.vx;
    ball.vy = v.vy;
  }
}

// 스파이크 후 공 속도 (AI도 같은 함수로 결과를 미리 계산)
// vy: 몸 충돌 처리 후의 세로 속도
export function spikeVelocity(side, inputX, inputY, vy) {
  const { spikeSpeedX, spikeVyMultiplier } = CONFIG.ball;
  const toward = side === SIDE_LEFT ? 1 : -1;
  return {
    vx: toward * (Math.abs(inputX) + 1) * spikeSpeedX,
    vy: Math.abs(vy) * inputY * spikeVyMultiplier,
  };
}
