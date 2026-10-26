import { CONFIG } from './config.js';
import { resolveBallWalls, resolveBallNet } from './physics.js';

// 공 하나를 만든다 (일반 객체)
export function createBall() {
  const { startX, startY, startVx, startVy } = CONFIG.ball;
  return { x: startX, y: startY, vx: startVx, vy: startVy };
}

// 한 틱 동안 중력 → 이동 → 충돌 처리
export function updateBall(ball) {
  const prevX = ball.x;

  ball.vy += CONFIG.ball.gravity;
  ball.x += ball.vx;
  ball.y += ball.vy;

  resolveBallNet(ball, prevX);
  resolveBallWalls(ball);
}

// 디버그용: 공을 원하는 위치·속도로 놓는다
export function placeBall(ball, { x, y, vx, vy }) {
  ball.x = x;
  ball.y = y;
  ball.vx = vx;
  ball.vy = vy;
}
