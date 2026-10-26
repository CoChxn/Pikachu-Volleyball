import { CONFIG } from './config.js';
import { SIDE_LEFT } from './player.js';

// 상태를 읽어 화면을 그린다. 상태는 절대 바꾸지 않는다.
// debug: { enabled, stats, drag } 화면 표시용 정보
export function draw(ctx, state, debug) {
  const { width, height, groundY, colors } = CONFIG;

  // 하늘
  ctx.fillStyle = colors.sky;
  ctx.fillRect(0, 0, width, height);

  // 바닥
  ctx.fillStyle = colors.ground;
  ctx.fillRect(0, groundY, width, height - groundY);
  ctx.fillStyle = colors.groundLine;
  ctx.fillRect(0, groundY, width, 1);

  drawNet(ctx);
  for (const player of state.players) {
    drawPlayer(ctx, player);
  }
  drawBall(ctx, state.ball);

  if (debug.enabled) {
    drawDebug(ctx, state, debug);
  }
}

// 네트 기둥의 왼쪽 x
function netLeftX() {
  return (CONFIG.width - CONFIG.netWidth) / 2;
}

// 화면 가운데 네트 기둥과 꼭대기
function drawNet(ctx) {
  const { groundY, netWidth, netTopY, netCapHeight, colors } = CONFIG;
  const netX = netLeftX();

  ctx.fillStyle = colors.net;
  ctx.fillRect(netX, netTopY, netWidth, groundY - netTopY);
  ctx.fillStyle = colors.netCap;
  ctx.fillRect(netX, netTopY, netWidth, netCapHeight);
}

// 캐릭터 임시 그림: 몸 크기에 맞춘 타원 (진짜 그래픽은 7단계)
function drawPlayer(ctx, player) {
  const { halfWidth, halfHeight } = CONFIG.player;
  const { colors } = CONFIG;

  ctx.fillStyle = player.side === SIDE_LEFT ? colors.player1 : colors.player2;
  ctx.strokeStyle = colors.playerOutline;
  ctx.beginPath();
  ctx.ellipse(player.x, player.y, halfWidth, halfHeight, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
}

// 공 임시 그림
function drawBall(ctx, ball) {
  const { colors } = CONFIG;
  ctx.fillStyle = colors.ball;
  ctx.strokeStyle = colors.ballOutline;
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, CONFIG.ball.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
}

// 디버그 표시: 충돌 영역, 수치, 드래그 조준선
function drawDebug(ctx, state, debug) {
  const { colors, groundY, netWidth, netTopY } = CONFIG;
  const { halfWidth, halfHeight } = CONFIG.player;
  const { radius, netTopBounceDepth } = CONFIG.ball;

  ctx.strokeStyle = colors.debugHitbox;

  // 캐릭터 충돌 사각형
  for (const p of state.players) {
    ctx.strokeRect(p.x - halfWidth, p.y - halfHeight, halfWidth * 2, halfHeight * 2);
  }

  // 공 충돌 원
  ctx.beginPath();
  ctx.arc(state.ball.x, state.ball.y, radius, 0, Math.PI * 2);
  ctx.stroke();

  // 네트 기둥, 꼭대기 띠(공 아랫면이 여기 들어오면 위로 튕김)
  ctx.strokeRect(netLeftX(), netTopY, netWidth, groundY - netTopY);
  ctx.fillStyle = colors.debugNetTop;
  ctx.fillRect(netLeftX(), netTopY, netWidth, netTopBounceDepth);

  drawDebugText(ctx, state, debug.stats);
  if (debug.drag) {
    drawDragPreview(ctx, debug.drag);
  }
}

// 왼쪽 위에 수치 표시
function drawDebugText(ctx, state, stats) {
  const { colors } = CONFIG;
  const { font, textX, textY, lineHeight } = CONFIG.debug;
  const { ball, players } = state;

  const lines = [
    `tick ${state.tick}  ${stats.ticksPerSecond}/s`,
    `ball x${ball.x} y${ball.y} vx${ball.vx} vy${ball.vy}`,
    ...players.map((p, i) => `${i + 1}P ${p.state} x${p.x} y${p.y}`),
    'drag: throw ball',
  ];

  ctx.fillStyle = colors.debugText;
  ctx.font = font;
  lines.forEach((line, i) => {
    ctx.fillText(line, textX, textY + lineHeight * i);
  });
}

// 드래그 조준선: 시작점(공이 놓일 곳)에서 끝점까지
function drawDragPreview(ctx, drag) {
  const { colors } = CONFIG;
  const { dragStartRadius, font } = CONFIG.debug;

  ctx.strokeStyle = colors.debugDrag;
  ctx.fillStyle = colors.debugDrag;
  ctx.beginPath();
  ctx.arc(drag.startX, drag.startY, dragStartRadius, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(drag.startX, drag.startY);
  ctx.lineTo(drag.endX, drag.endY);
  ctx.stroke();

  ctx.font = font;
  ctx.fillText(`vx${drag.vx} vy${drag.vy}`, drag.endX, drag.endY);
}
