import { CONFIG } from './config.js';
import { PHASE_SERVING, PHASE_SCORED, PHASE_FADE_OUT, PHASE_GAME_OVER } from './game.js';
import { drawTeacher, REACTION_CHEER, REACTION_SAD } from './sprites.js';
import { shakeOffset } from './effects.js';
import { predictBall } from './ai.js';
import { MENU_SCREENS, PAUSE_ITEMS } from './menu.js';

// 상태를 읽어 화면을 그린다. 상태는 절대 바꾸지 않는다.
// debug: { enabled, stats, drag, settings, muted, effects } 화면 표시용 정보
export function draw(ctx, state, debug) {
  const fx = debug.effects;
  const offset = shakeOffset(fx);
  // 흔들려서 비는 가장자리가 지난 화면으로 남지 않게 먼저 칠한다
  ctx.fillStyle = CONFIG.colors.ground;
  ctx.fillRect(0, 0, CONFIG.width, CONFIG.height);
  ctx.save();
  ctx.translate(offset.x, offset.y); // 화면 흔들림

  drawCourt(ctx);
  drawDust(ctx, fx);
  for (const player of state.players) {
    drawTeacher(ctx, player, state.tick, reactionOf(state, player.side));
  }
  drawTrail(ctx, fx);
  drawBall(ctx, state.ball, fx.ballAngle);
  drawRings(ctx, fx);
  drawScore(ctx, state, fx);
  ctx.restore();

  drawFade(ctx, state);
  drawMessage(ctx, state);
  if (debug.muted) {
    drawText(ctx, 'MUTE (M)', CONFIG.width / 2, CONFIG.ui.muteY, CONFIG.ui.muteFont, 'center');
  }

  if (debug.enabled) {
    drawDebug(ctx, state, debug);
  }
}

// 하늘, 바닥, 네트
function drawCourt(ctx) {
  const { width, height, groundY, colors } = CONFIG;

  ctx.fillStyle = colors.sky;
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = colors.ground;
  ctx.fillRect(0, groundY, width, height - groundY);
  ctx.fillStyle = colors.groundLine;
  ctx.fillRect(0, groundY, width, 1);

  drawNet(ctx);
}

// 시작 메뉴: 어두운 경기장 위에 제목과 항목
export function drawMenu(ctx, menu, muted) {
  const m = CONFIG.menu;
  const centerX = CONFIG.width / 2;

  drawCourt(ctx);
  drawOverlay(ctx);

  drawText(ctx, m.title, centerX, m.titleY, m.titleFont, 'center');
  const { heading, items } = MENU_SCREENS[menu.screen];
  if (heading) drawText(ctx, heading, centerX, m.headingY, m.headingFont, 'center');
  drawMenuItems(ctx, items, menu.cursor);
  drawText(ctx, m.hint, centerX, m.hintY, m.hintFont, 'center');
  drawText(ctx, `M: SOUND ${muted ? 'OFF' : 'ON'}`, centerX, m.soundY, m.hintFont, 'center');

  // 오른쪽 아래 구석에 버전
  const { versionFont, versionMargin } = CONFIG.ui;
  drawText(ctx, CONFIG.version, CONFIG.width - versionMargin, CONFIG.height - versionMargin, versionFont, 'right');
}

// 일시정지: 멈춘 경기 화면 위에 어둡게 덮고 항목 표시
export function drawPause(ctx, pauseMenu) {
  const m = CONFIG.menu;
  const centerX = CONFIG.width / 2;

  drawOverlay(ctx);
  drawText(ctx, m.pauseTitle, centerX, m.headingY, m.titleFont, 'center');
  drawMenuItems(ctx, PAUSE_ITEMS, pauseMenu.cursor);
  drawText(ctx, m.pauseHint, centerX, m.hintY, m.hintFont, 'center');
}

// 화면 전체를 반투명하게 어둡게
function drawOverlay(ctx) {
  const { width, height, colors } = CONFIG;
  ctx.globalAlpha = CONFIG.menu.overlayAlpha;
  ctx.fillStyle = colors.fade;
  ctx.fillRect(0, 0, width, height);
  ctx.globalAlpha = 1;
}

// 메뉴 항목 목록: 선택된 항목은 노란색과 > 표시
function drawMenuItems(ctx, items, cursor) {
  const { colors } = CONFIG;
  const m = CONFIG.menu;
  const centerX = CONFIG.width / 2;

  items.forEach((item, i) => {
    const y = m.itemStartY + m.itemGap * i;
    const selected = i === cursor;
    drawText(ctx, item.label, centerX, y, m.itemFont, 'center', selected ? colors.menuSelected : colors.uiText);
    if (selected) {
      ctx.font = m.itemFont;
      const left = centerX - ctx.measureText(item.label).width / 2 - m.cursorGapX;
      drawText(ctx, '>', left, y, m.itemFont, 'right', colors.menuSelected);
    }
  });
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

// 득점 리액션: 득점 연출·경기 종료 때 이긴 쪽은 만세, 진 쪽은 시무룩
function reactionOf(state, side) {
  if (state.phase === PHASE_SCORED || state.phase === PHASE_FADE_OUT) {
    return side === state.server ? REACTION_CHEER : REACTION_SAD;
  }
  if (state.phase === PHASE_GAME_OVER) {
    return side === state.winner ? REACTION_CHEER : REACTION_SAD;
  }
  return null;
}

// 배구공: 흰 공에 휘어진 줄무늬, angle(도)만큼 회전
function drawBall(ctx, ball, angle) {
  const { colors } = CONFIG;
  const { radius } = CONFIG.ball;
  const b = CONFIG.effects.ball;

  ctx.save();
  ctx.translate(ball.x, ball.y);
  ctx.rotate((angle * Math.PI) / 180);
  ctx.fillStyle = colors.ball;
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fill();

  // 줄무늬: 중심에서 같은 간격으로 휘어져 나가는 곡선
  ctx.save();
  ctx.clip();
  ctx.strokeStyle = b.stripeColor;
  ctx.lineWidth = b.stripeWidth;
  for (let i = 0; i < b.stripeCount; i++) {
    ctx.rotate((Math.PI * 2) / b.stripeCount);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(b.stripeBend, -radius / 2, 0, -radius);
    ctx.stroke();
  }
  ctx.restore();

  ctx.strokeStyle = colors.ballOutline;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

// 공 잔상: 오래된 것일수록 옅게
function drawTrail(ctx, fx) {
  const { radius } = CONFIG.ball;
  const t = CONFIG.effects.trail;
  fx.trail.forEach((pos, i) => {
    ctx.globalAlpha = (t.alpha * (i + 1)) / fx.trail.length;
    ctx.fillStyle = CONFIG.colors.ball;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;
}

// 타격 원 (스파이크는 크게 + 별빛 선)
function drawRings(ctx, fx) {
  const r = CONFIG.effects.ring;
  const s = CONFIG.effects.star;
  for (const ring of fx.rings) {
    const progress = ring.age / r.ticks; // 0 → 1
    ctx.globalAlpha = 1 - progress;
    ctx.strokeStyle = r.color;
    ctx.lineWidth = r.width;
    const from = ring.big ? r.bigFrom : r.smallFrom;
    const to = ring.big ? r.bigTo : r.smallTo;
    ctx.beginPath();
    ctx.arc(ring.x, ring.y, from + (to - from) * progress, 0, Math.PI * 2);
    ctx.stroke();

    if (ring.big) {
      ctx.strokeStyle = s.color;
      ctx.lineWidth = s.width;
      const outer = s.outerFrom + (s.outerTo - s.outerFrom) * progress;
      for (let i = 0; i < s.count; i++) {
        const a = (Math.PI * 2 * i) / s.count;
        ctx.beginPath();
        ctx.moveTo(ring.x + Math.cos(a) * s.inner, ring.y + Math.sin(a) * s.inner);
        ctx.lineTo(ring.x + Math.cos(a) * outer, ring.y + Math.sin(a) * outer);
        ctx.stroke();
      }
    }
  }
  ctx.globalAlpha = 1;
  ctx.lineWidth = 1;
}

// 먼지 알갱이: 시간이 갈수록 옅게
function drawDust(ctx, fx) {
  const d = CONFIG.effects.dust;
  ctx.fillStyle = d.color;
  for (const p of fx.dust) {
    ctx.globalAlpha = 1 - p.age / d.ticks;
    ctx.beginPath();
    ctx.arc(p.x, p.y, d.radius, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

// 그림자 있는 글자. align: 'left' | 'center' | 'right'
function drawText(ctx, text, x, y, font, align, color = CONFIG.colors.uiText) {
  const { colors } = CONFIG;
  const { shadowOffset } = CONFIG.ui;
  ctx.font = font;
  ctx.textAlign = align;
  ctx.fillStyle = colors.uiShadow;
  ctx.fillText(text, x + shadowOffset, y + shadowOffset);
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
  ctx.textAlign = 'left';
}

// 위쪽 양 끝에 점수
// 점수가 오르면 잠깐 커졌다 돌아옴
function drawScore(ctx, state, fx) {
  const { width } = CONFIG;
  const { scoreFont, scoreMarginX, scoreY } = CONFIG.ui;
  const pop = CONFIG.effects.scorePop;
  const xs = [scoreMarginX, width - scoreMarginX];
  const aligns = ['left', 'right'];

  state.score.forEach((score, side) => {
    const scale = 1 + (pop.scale * fx.scorePop[side]) / pop.ticks;
    ctx.save();
    ctx.translate(xs[side], scoreY);
    ctx.scale(scale, scale);
    drawText(ctx, String(score), 0, 0, scoreFont, aligns[side]);
    ctx.restore();
  });
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
      drawText(ctx, 'Z/ENTER: AGAIN   ESC: MENU', centerX, subMessageY, subMessageFont, 'center');
    }
  }
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

  drawDebugText(ctx, state, debug);
  if (debug.drag) {
    drawDragPreview(ctx, debug.drag);
  }
}

// 왼쪽 위에 수치 표시
function drawDebugText(ctx, state, debug) {
  const { stats } = debug;
  const { colors } = CONFIG;
  const { font, textX, textY, lineHeight } = CONFIG.debug;
  const { ball, players } = state;

  const lines = [
    `tick ${state.tick}  ${stats.ticksPerSecond}/s`,
    `phase ${state.phase}(${state.phaseTicks}) server ${state.server + 1}P win ${state.winScore}`,
    `${debug.settings.name}  ai bold ${state.ai.boldness.join(',')} err ${state.ai.errorX.join(',')}`,
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
