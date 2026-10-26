import { CONFIG } from './config.js';

// 공-벽, 공-천장, 공-바닥: 넘어갔으면 경계로 되돌리고 속도 방향을 뒤집는다
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
  }
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
