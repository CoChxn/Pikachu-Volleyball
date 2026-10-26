import { CONFIG } from './config.js';
import { resolveBallWalls, resolveBallNet } from './physics.js';

// 공 하나를 만든다 (일반 객체). 처음엔 1P 서브 위치
export function createBall() {
  const ball = { x: 0, y: 0, vx: 0, vy: 0 };
  placeBallForServe(ball, 0);
  return ball;
}

// 서브하는 쪽(0: 1P, 1: 2P) 위 하늘 꼭대기에 공을 놓는다
export function placeBallForServe(ball, server) {
  const { serveX, serveY, serveVy } = CONFIG.ball;
  ball.x = serveX[server];
  ball.y = serveY;
  ball.vx = 0;
  ball.vy = serveVy;
}

// 한 틱 동안 중력 → 이동 → 충돌 처리. 바닥에 닿았으면 true
export function updateBall(ball) {
  const prevX = ball.x;

  ball.vy += CONFIG.ball.gravity;
  ball.x += ball.vx;
  ball.y += ball.vy;

  resolveBallNet(ball, prevX);
  return resolveBallWalls(ball);
}

// 디버그용: 공을 원하는 위치·속도로 놓는다
export function placeBall(ball, { x, y, vx, vy }) {
  ball.x = x;
  ball.y = y;
  ball.vx = vx;
  ball.vy = vy;
}
