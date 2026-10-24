import { CONFIG } from './config.js';
import { SIDE_LEFT } from './player.js';

// 상태를 읽어 화면을 그린다. 상태는 절대 바꾸지 않는다.
export function draw(ctx, state, stats) {
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
  drawTickText(ctx, state, stats);
}

// 화면 가운데 네트 기둥과 꼭대기
function drawNet(ctx) {
  const { width, groundY, netWidth, netTopY, netCapHeight, colors } = CONFIG;
  const netX = (width - netWidth) / 2;

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

// 루프 확인용 임시 표시: 누적 틱 수와 실제 초당 틱 수
function drawTickText(ctx, state, stats) {
  const { tickText, colors } = CONFIG;
  ctx.fillStyle = colors.debugText;
  ctx.font = tickText.font;
  ctx.fillText(`tick ${state.tick}  ${stats.ticksPerSecond}/s`, tickText.x, tickText.y);
}
