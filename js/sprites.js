import { CONFIG } from './config.js';
import { SIDE_LEFT, PLAYER_JUMPING, PLAYER_SPIKING, PLAYER_DIVING, PLAYER_LYING } from './player.js';

// 선생님 캐릭터 그리기. 게임 상태를 읽기만 한다.
// 좌표는 캐릭터 중심 기준, 오른쪽(+x)이 얼굴이 향하는 쪽. 좌우는 ctx.scale로 뒤집는다.

const DEG = Math.PI / 180;

// 자세
export const POSE_STAND = 'stand';
export const POSE_WALK = 'walk';
export const POSE_JUMP = 'jump';
export const POSE_SPIKE = 'spike';
export const POSE_DIVE = 'dive';
export const POSE_LYING = 'lying';
export const POSE_CHEER = 'cheer';
export const POSE_SAD = 'sad';

// 득점 리액션
export const REACTION_CHEER = 'cheer';
export const REACTION_SAD = 'sad';

// 지금 그릴 자세 고르기
function choosePose(player, reaction) {
  if (player.state === PLAYER_DIVING) return POSE_DIVE;
  if (player.state === PLAYER_LYING) return POSE_LYING;
  if (reaction === REACTION_CHEER) return POSE_CHEER;
  if (reaction === REACTION_SAD) return POSE_SAD;
  if (player.state === PLAYER_SPIKING) return POSE_SPIKE;
  if (player.state === PLAYER_JUMPING) return POSE_JUMP;
  if (player.inputX !== 0) return POSE_WALK;
  return POSE_STAND;
}

// 팔 각도 [뒤 팔, 앞 팔] (도). 0 = 아래, 90 = 앞, 180 = 위, -90 = 뒤
function armAngles(pose, player, tick) {
  const a = CONFIG.teacher.arms;
  const swingPhase = Math.floor(tick / a.swingTicks) % 2 === 0 ? 1 : -1;

  switch (pose) {
    case POSE_WALK:
      return [-a.walkSwing * swingPhase, a.walkSwing * swingPhase];
    case POSE_JUMP:
      return [-a.jump, a.jump];
    case POSE_SPIKE: {
      // 스파이크 시간 동안 위-뒤에서 앞-아래로 휘두름
      const progress = 1 - player.stateTicks / CONFIG.player.spikeTicks;
      return [a.spikeBack, a.spikeStart + (a.spikeEnd - a.spikeStart) * progress];
    }
    case POSE_DIVE:
      return [a.dive, a.dive];
    case POSE_LYING:
      return [a.lying, a.lying];
    case POSE_CHEER:
      return [-a.cheer - a.cheerWave * swingPhase, a.cheer + a.cheerWave * swingPhase];
    case POSE_SAD:
      return [a.sad, -a.sad];
    default:
      return [-a.stand, a.stand];
  }
}

// 각도(도)와 길이로 팔 끝 위치
function armEnd(x, y, angle, length) {
  return { x: x + Math.sin(angle * DEG) * length, y: y + Math.cos(angle * DEG) * length };
}

// 팔 하나 (선 + 손). shoulderX: 어깨 가로 위치
function drawArm(ctx, shoulderX, angle, sleeveColor) {
  const s = CONFIG.teacher.shape;
  const hand = armEnd(shoulderX, s.shoulderY, angle, s.armLength);
  ctx.strokeStyle = sleeveColor;
  ctx.lineWidth = s.armWidth;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(shoulderX, s.shoulderY);
  ctx.lineTo(hand.x, hand.y);
  ctx.stroke();
  ctx.fillStyle = CONFIG.teacher.skin;
  ctx.beginPath();
  ctx.arc(hand.x, hand.y, s.handRadius, 0, Math.PI * 2);
  ctx.fill();
  return hand;
}

// 손에 든 출석부
function drawBook(ctx, hand, palette) {
  const b = CONFIG.teacher.book;
  ctx.lineCap = 'butt';
  ctx.fillStyle = palette.accent;
  ctx.fillRect(hand.x - b.width / 2, hand.y - b.height / 2, b.width, b.height);
  ctx.fillStyle = b.pageColor;
  ctx.fillRect(hand.x - b.width / 2, hand.y - b.height / 2, b.spine, b.height);
}

// 다리와 몸통 (옷, 칼라, 넥타이)
function drawBody(ctx, palette) {
  const s = CONFIG.teacher.shape;
  ctx.fillStyle = CONFIG.teacher.shoeColor;
  for (const legX of [-s.legX, s.legX]) {
    ctx.beginPath();
    ctx.ellipse(legX, s.legY, s.legRx, s.legRy, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = palette.outfit;
  ctx.beginPath();
  ctx.roundRect(-s.bodyHalfWidth, s.bodyTop, s.bodyHalfWidth * 2, s.bodyBottom - s.bodyTop, s.bodyCorner);
  ctx.fill();

  // 셔츠 칼라 (V자 흰 삼각형 두 개)
  ctx.fillStyle = CONFIG.teacher.collarColor;
  for (const dir of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(0, s.bodyTop + s.collarDepth);
    ctx.lineTo(dir * s.collarWidth, s.bodyTop);
    ctx.lineTo(0, s.bodyTop);
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillStyle = palette.accent;
  ctx.fillRect(-s.tieWidth / 2, s.bodyTop + s.collarDepth, s.tieWidth, s.tieLength);
}

// 짧은 머리카락 (얼굴 위에 덮어 그림, 머리 원 안쪽만)
function drawHair(ctx, palette) {
  const s = CONFIG.teacher.shape;
  const h = CONFIG.teacher.hair;
  ctx.save();
  ctx.beginPath();
  ctx.arc(0, s.headY, s.headRadius, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = palette.hair;
  const lineY = s.headY - h.hairLine;
  ctx.fillRect(-s.headRadius, s.headY - s.headRadius, s.headRadius * 2, lineY - (s.headY - s.headRadius));
  // 뒤쪽 옆머리 (귀 쪽)
  ctx.fillRect(-s.headRadius, s.headY - s.headRadius, h.sideWidth, s.headRadius + h.sideLength);
  // 앞머리 한 가닥
  ctx.beginPath();
  ctx.ellipse(h.fringeX, lineY, h.fringeRx, h.fringeRy, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// 얼굴: 안경, 눈, 입
function drawFace(ctx, pose, palette, blinking) {
  const s = CONFIG.teacher.shape;
  const f = CONFIG.teacher.face;
  const eyeY = s.headY + f.eyeOffsetY;

  ctx.strokeStyle = f.lineColor;
  ctx.fillStyle = f.lineColor;
  ctx.lineWidth = f.lineWidth;

  // 눈 (자세에 따라 모양이 다름)
  for (const ex of f.eyeX) {
    ctx.beginPath();
    if (pose === POSE_SPIKE) {
      // 결연한 눈 > <
      const dir = ex === f.eyeX[0] ? 1 : -1;
      ctx.moveTo(ex - dir * f.eyeSize, eyeY - f.eyeSize);
      ctx.lineTo(ex + dir * f.eyeSize, eyeY);
      ctx.lineTo(ex - dir * f.eyeSize, eyeY + f.eyeSize);
      ctx.stroke();
    } else if (pose === POSE_CHEER) {
      // 웃는 눈 ^ ^
      ctx.arc(ex, eyeY + f.eyeSize, f.eyeSize, Math.PI * 1.15, Math.PI * 1.85);
      ctx.stroke();
    } else if (pose === POSE_LYING) {
      // 어지러운 눈 (작은 동그라미)
      ctx.arc(ex, eyeY, f.eyeSize, 0, Math.PI * 1.5);
      ctx.stroke();
    } else if (pose === POSE_SAD || blinking) {
      // 감은 눈 / 시무룩한 눈 -
      ctx.moveTo(ex - f.eyeSize, eyeY);
      ctx.lineTo(ex + f.eyeSize, eyeY);
      ctx.stroke();
    } else {
      ctx.arc(ex, eyeY, f.pupilRadius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // 안경 (슬라이딩·엎드림 땐 비뚤어짐)
  const tilt = pose === POSE_DIVE || pose === POSE_LYING ? f.glassesTilt : 0;
  ctx.save();
  ctx.translate(0, eyeY);
  ctx.rotate(tilt * DEG);
  ctx.strokeStyle = palette.glasses;
  ctx.lineWidth = f.glassesWidth;
  for (const ex of f.eyeX) {
    ctx.beginPath();
    ctx.arc(ex, 0, f.glassesRadius, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.moveTo(f.eyeX[0] + f.glassesRadius, 0);
  ctx.lineTo(f.eyeX[1] - f.glassesRadius, 0);
  ctx.moveTo(f.eyeX[0] - f.glassesRadius, 0);
  ctx.lineTo(f.templeX, 0);
  ctx.stroke();
  ctx.restore();

  // 입
  const mouthY = s.headY + f.mouthOffsetY;
  ctx.strokeStyle = f.lineColor;
  ctx.fillStyle = f.mouthColor;
  ctx.lineWidth = f.lineWidth;
  ctx.beginPath();
  if (pose === POSE_JUMP || pose === POSE_DIVE) {
    ctx.arc(f.mouthX, mouthY, f.mouthOpenRadius, 0, Math.PI * 2); // "오!"
    ctx.fill();
  } else if (pose === POSE_CHEER) {
    ctx.arc(f.mouthX, mouthY - f.mouthSize / 2, f.mouthSize, 0, Math.PI); // 활짝
    ctx.fill();
  } else if (pose === POSE_SAD || pose === POSE_LYING) {
    ctx.arc(f.mouthX, mouthY + f.mouthSize, f.mouthSize, Math.PI * 1.2, Math.PI * 1.8); // 시무룩
    ctx.stroke();
  } else {
    ctx.arc(f.mouthX, mouthY - f.mouthSize, f.mouthSize, Math.PI * 0.2, Math.PI * 0.8); // 미소
    ctx.stroke();
  }
}

// 선생님 한 명 그리기
// tick: 깜빡임·걸음용 시간, reaction: 득점 리액션(없으면 null)
export function drawTeacher(ctx, player, tick, reaction) {
  const t = CONFIG.teacher;
  const s = t.shape;
  const palette = t.palettes[player.side];
  const pose = choosePose(player, reaction);

  // 얼굴 방향: 기본은 네트 쪽, 슬라이딩·엎드림은 미끄러진 방향
  let facing = player.side === SIDE_LEFT ? 1 : -1;
  const flat = pose === POSE_DIVE || pose === POSE_LYING;
  if (flat && player.diveDirection !== 0) facing = player.diveDirection;

  // 걸을 때 들썩임, 시무룩하면 살짝 내려앉음
  let offsetY = 0;
  if (pose === POSE_WALK) offsetY = -(Math.floor(tick / t.walkBobTicks) % 2) * t.walkBob;
  if (pose === POSE_SAD) offsetY = t.sadDropY;

  // 깜빡임: 양쪽이 동시에 깜빡이지 않게 쪽마다 시간을 어긋나게
  const blinkTime = (tick + player.side * t.blinkSideOffset) % t.blinkInterval;
  const blinking = blinkTime < t.blinkTicks;

  const [backAngle, frontAngle] = armAngles(pose, player, tick);

  ctx.save();
  ctx.translate(player.x, player.y);
  ctx.scale(facing, 1);
  if (flat) {
    // 앞으로 엎드린 모습: 바닥에 붙도록 내리고 90도 눕힘
    ctx.translate(0, s.flatOffsetY);
    ctx.rotate(s.flatAngle * DEG);
  }
  ctx.translate(0, offsetY);

  drawArm(ctx, s.shoulderBackX, backAngle, palette.outfit);
  // 엎드린 자세는 앞 팔도 몸 뒤에 (얼굴을 가리지 않게)
  if (flat) {
    drawBook(ctx, drawArm(ctx, s.shoulderFrontX, frontAngle, palette.outfit), palette);
  }
  drawBody(ctx, palette);

  ctx.fillStyle = t.skin;
  ctx.beginPath();
  ctx.arc(0, s.headY, s.headRadius, 0, Math.PI * 2);
  ctx.fill();
  drawHair(ctx, palette);
  drawFace(ctx, pose, palette, blinking);

  if (!flat) {
    drawBook(ctx, drawArm(ctx, s.shoulderFrontX, frontAngle, palette.outfit), palette);
  }

  ctx.restore();
}
