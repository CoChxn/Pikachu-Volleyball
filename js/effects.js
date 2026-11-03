import { CONFIG } from './config.js';
import { EVENT_BODY_HIT, EVENT_SPIKE, EVENT_GROUND, EVENT_LAND, EVENT_DIVE, EVENT_SCORE, EVENT_WIN } from './physics.js';

// 손맛 연출 상태: 화면에만 쓰는 값이라 게임 상태와 따로 둔다.
// 게임 상태(state)는 읽기만 하므로 연출이 경기 결과를 바꾸지 않는다.

export function createEffects() {
  return {
    rings: [], // 타격 원 { x, y, age, big }
    dust: [], // 먼지 알갱이 { x, y, vx, vy, age }
    trail: [], // 공 잔상 위치 { x, y }
    shakeTicks: 0, // 화면 흔들림 남은 틱
    shakePower: 0,
    ballAngle: 0, // 공 무늬 회전 각도 (도)
    scorePop: [0, 0], // 점수 튀어오름 남은 틱 [1P, 2P]
    lastScore: [0, 0],
  };
}

// 화면 흔들기 (더 센 흔들림이 우선)
function shake(fx, ticks, power) {
  if (power >= fx.shakePower || fx.shakeTicks <= 0) {
    fx.shakeTicks = ticks;
    fx.shakePower = power;
  }
}

// 먼지 알갱이: 위쪽 반원 방향으로 고르게 퍼짐
function addDust(fx, x, y) {
  const d = CONFIG.effects.dust;
  for (let i = 0; i < d.count; i++) {
    const angle = (d.angleFrom + ((d.angleTo - d.angleFrom) * i) / (d.count - 1)) * (Math.PI / 180);
    fx.dust.push({ x, y, vx: Math.cos(angle) * d.speed, vy: Math.sin(angle) * d.speed, age: 0 });
  }
}

// 사건 하나를 연출로
function handleEvent(fx, event) {
  const e = CONFIG.effects;
  switch (event.name) {
    case EVENT_BODY_HIT:
      fx.rings.push({ x: event.x, y: event.y, age: 0, big: false });
      break;
    case EVENT_SPIKE:
      fx.rings.push({ x: event.x, y: event.y, age: 0, big: true });
      shake(fx, e.shake.spikeTicks, e.shake.spikePower);
      break;
    case EVENT_GROUND:
    case EVENT_LAND:
    case EVENT_DIVE:
      addDust(fx, event.x, event.y);
      break;
    case EVENT_SCORE:
    case EVENT_WIN:
      shake(fx, e.shake.scoreTicks, e.shake.scorePower);
      break;
  }
}

// 한 틱마다: 새 사건으로 연출을 만들고, 있던 연출은 나이를 먹인다
export function updateEffects(fx, state) {
  const e = CONFIG.effects;

  fx.rings = fx.rings.filter((ring) => ++ring.age < e.ring.ticks);
  fx.dust = fx.dust.filter((p) => {
    p.x += p.vx;
    p.y += p.vy;
    p.vy += e.dust.gravity;
    return ++p.age < e.dust.ticks;
  });
  if (fx.shakeTicks > 0) fx.shakeTicks -= 1;

  for (const event of state.events) handleEvent(fx, event);

  // 공 회전: 가로 속도만큼 돈다
  const { ball } = state;
  fx.ballAngle = (fx.ballAngle + ball.vx * e.ball.spinPerSpeed) % 360;

  // 공 잔상: 빠를 때만 위치를 남김
  const speed = Math.max(Math.abs(ball.vx), Math.abs(ball.vy));
  if (speed >= e.trail.minSpeed) fx.trail.push({ x: ball.x, y: ball.y });
  else fx.trail.shift();
  while (fx.trail.length > e.trail.length) fx.trail.shift();

  // 점수 튀어오름: 점수가 오른 쪽
  state.score.forEach((score, side) => {
    if (score > fx.lastScore[side]) fx.scorePop[side] = e.scorePop.ticks;
    else if (fx.scorePop[side] > 0) fx.scorePop[side] -= 1;
  });
  fx.lastScore = [...state.score];
}

// 화면 흔들림 오프셋 {x, y}: 틱마다 방향이 바뀜
export function shakeOffset(fx) {
  if (fx.shakeTicks <= 0) return { x: 0, y: 0 };
  const dir = fx.shakeTicks % 2 === 0 ? 1 : -1;
  return { x: dir * fx.shakePower, y: -dir * fx.shakePower };
}
