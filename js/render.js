import { CONFIG } from './config.js';
import { SIDE_LEFT, PLAYER_SPIKING, PLAYER_DIVING, PLAYER_LYING } from './player.js';
import { PHASE_SERVING, PHASE_FADE_OUT, PHASE_GAME_OVER } from './game.js';
import { predictBall, AI_LEVEL_NAMES } from './ai.js';

// 상태를 읽어 화면을 그린다. 상태는 절대 바꾸지 않는다.
// debug: { enabled, stats, drag, mode, level } 화면 표시용 정보
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
  drawScore(ctx, state);
  drawFade(ctx, state);
  drawMessage(ctx, state);
  drawModeText(ctx, debug.mode, debug.level);

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
// 슬라이딩·엎드림은 납작하게, 스파이크는 테두리를 굵게
function drawPlayer(ctx, player) {
  const { halfWidth, halfHeight, flatHalfHeight, spikeOutlineWidth } = CONFIG.player;
  const { colors } = CONFIG;

  const flat = player.state === PLAYER_DIVING || player.state === PLAYER_LYING;
  const drawHalfHeight = flat ? flatHalfHeight : halfHeight;
  // 납작할 때는 발이 바닥에 붙어 있도록 중심을 내린다
  const drawY = player.y + halfHeight - drawHalfHeight;

  ctx.fillStyle = player.side === SIDE_LEFT ? colors.player1 : colors.player2;
  ctx.strokeStyle = colors.playerOutline;
  ctx.lineWidth = player.state === PLAYER_SPIKING ? spikeOutlineWidth : 1;
  ctx.beginPath();
  ctx.ellipse(player.x, drawY, halfWidth, drawHalfHeight, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.lineWidth = 1;
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

// 그림자 있는 글자. align: 'left' | 'center' | 'right'
function drawText(ctx, text, x, y, font, align) {
  const { colors } = CONFIG;
  const { shadowOffset } = CONFIG.ui;
  ctx.font = font;
  ctx.textAlign = align;
  ctx.fillStyle = colors.uiShadow;
  ctx.fillText(text, x + shadowOffset, y + shadowOffset);
  ctx.fillStyle = colors.uiText;
  ctx.fillText(text, x, y);
  ctx.textAlign = 'left';
}

// 위쪽 양 끝에 점수
function drawScore(ctx, state) {
  const { width } = CONFIG;
  const { scoreFont, scoreMarginX, scoreY } = CONFIG.ui;
  drawText(ctx, String(state.score[0]), scoreMarginX, scoreY, scoreFont, 'left');
  drawText(ctx, String(state.score[1]), width - scoreMarginX, scoreY, scoreFont, 'right');
}

// 라운드 사이 어두워지기·밝아지기
function drawFade(ctx, state) {
  const { width, height, colors } = CONFIG;
  const { fadeInTicks } = CONFIG.match;

  let alpha = 0;
  if (state.phase === PHASE_SERVING) {
    alpha = Math.max(0, 1 - state.phaseTicks / fadeInTicks);
  } else if (state.phase === PHASE_FADE_OUT) {
    alpha = state.phaseTicks / fadeInTicks;
  }
  if (alpha <= 0) return;

  ctx.globalAlpha = alpha;
  ctx.fillStyle = colors.fade;
  ctx.fillRect(0, 0, width, height);
  ctx.globalAlpha = 1;
}

// 가운데 메시지: READY 깜빡임, 승리 화면
function drawMessage(ctx, state) {
  const centerX = CONFIG.width / 2;
  const { messageFont, messageY, subMessageFont, subMessageY } = CONFIG.ui;
  const { readyBlinkTicks, gameOverMinTicks } = CONFIG.match;

  if (state.phase === PHASE_SERVING) {
    const visible = Math.floor(state.phaseTicks / readyBlinkTicks) % 2 === 1;
    if (visible) drawText(ctx, 'READY', centerX, messageY, messageFont, 'center');
  }

  if (state.phase === PHASE_GAME_OVER) {
    drawText(ctx, `${state.winner + 1}P WIN!`, centerX, messageY, messageFont, 'center');
    if (state.phaseTicks >= gameOverMinTicks) {
      drawText(ctx, 'PRESS Z / ENTER', centerX, subMessageY, subMessageFont, 'center');
    }
  }
}

// 아래쪽에 조작 모드와 난이도
function drawModeText(ctx, mode, level) {
  const { colors } = CONFIG;
  const { modeFont, modeY } = CONFIG.ui;
  const usesCpu = mode.cpu.some((cpu) => cpu);
  const levelText = usesCpu ? `  ${AI_LEVEL_NAMES[level]}` : '';
  ctx.font = modeFont;
  ctx.textAlign = 'center';
  ctx.fillStyle = colors.modeText;
  ctx.fillText(`${mode.name}${levelText}  [${CONFIG.ai.modeKey}/${CONFIG.ai.levelKey}]`, CONFIG.width / 2, modeY);
  ctx.textAlign = 'left';
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

  // AI가 예측한 공 착지 지점 (바닥의 세로선)
  const landingX = predictBall(state.ball).landingX;
  ctx.strokeStyle = colors.debugLanding;
  ctx.beginPath();
  ctx.moveTo(landingX, netTopY);
  ctx.lineTo(landingX, groundY);
  ctx.stroke();

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
    `phase ${state.phase}(${state.phaseTicks}) server ${state.server + 1}P win ${state.winScore}`,
    `ai bold ${state.ai.boldness.join(',')} err ${state.ai.errorX.join(',')}`,
    `ball x${ball.x} y${ball.y} vx${ball.vx} vy${ball.vy}`,
    ...players.map(
      (p, i) => `${i + 1}P ${p.state}(${p.stateTicks}) x${p.x} y${p.y} in${p.inputX},${p.inputY}`,
    ),
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
