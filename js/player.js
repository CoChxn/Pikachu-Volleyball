import { CONFIG } from './config.js';

// 진영
export const SIDE_LEFT = 0;
export const SIDE_RIGHT = 1;

// 캐릭터 상태
export const PLAYER_STANDING = 'standing';
export const PLAYER_JUMPING = 'jumping';
export const PLAYER_SPIKING = 'spiking'; // 공중에서 치는 자세
export const PLAYER_DIVING = 'diving'; // 슬라이딩
export const PLAYER_LYING = 'lying'; // 슬라이딩 후 엎드림

// 서 있을 때 몸 중심의 y 좌표
function standingY() {
  return CONFIG.groundY - CONFIG.player.halfHeight;
}

// 진영별로 몸 중심이 갈 수 있는 x 범위 (벽과 네트 사이)
function xRange(side) {
  const { width, netWidth } = CONFIG;
  const { halfWidth } = CONFIG.player;
  const netLeft = (width - netWidth) / 2;
  const netRight = (width + netWidth) / 2;

  if (side === SIDE_LEFT) {
    return [halfWidth, netLeft - halfWidth];
  }
  return [netRight + halfWidth, width - halfWidth];
}

// 두 키로 -1, 0, 1 방향을 만든다
function axis(negative, positive) {
  let value = 0;
  if (negative) value -= 1;
  if (positive) value += 1;
  return value;
}

// 캐릭터 하나를 만든다 (일반 객체)
export function createPlayer(side) {
  const { width } = CONFIG;
  const { startOffsetX } = CONFIG.player;

  return {
    side,
    x: side === SIDE_LEFT ? startOffsetX : width - startOffsetX,
    y: standingY(),
    vy: 0, // 세로 속도 (음수면 위로)
    state: PLAYER_STANDING,
    stateTicks: 0, // 스파이크·엎드림 상태가 남은 틱 수
    diveDirection: 0, // 슬라이딩 방향 (-1 왼쪽, 1 오른쪽)
    inputX: 0, // 이번 틱 가로 입력 (-1, 0, 1)
    inputY: 0, // 이번 틱 세로 입력 (-1 위, 0, 1 아래)
    prevHit: false, // 지난 틱에 치기 키가 눌려 있었는지
    ballContact: false, // 공과 겹쳐 있는 중인지 (한 번만 튕기게)
  };
}

// 라운드 시작: 시작 위치로 되돌린다 (치기 키 기록 prevHit은 유지)
export function resetPlayer(player) {
  const { prevHit } = player;
  Object.assign(player, createPlayer(player.side), { prevHit });
}

// 입력을 받지 않는 동안에도 치기 키 기록만은 갱신한다
export function trackHitKey(player, input) {
  player.prevHit = input.hit;
}

// 한 틱 동안 상태에 따라 이동·점프·스파이크·슬라이딩을 처리한다
export function updatePlayer(player, input) {
  const { speed, jumpSpeed, diveSpeed, diveJumpSpeed, spikeTicks } = CONFIG.player;

  player.inputX = axis(input.left, input.right);
  player.inputY = axis(input.up, input.down);
  // 치기 키는 이번 틱에 새로 눌렸을 때만
  const hitPressed = input.hit && !player.prevHit;
  player.prevHit = input.hit;

  switch (player.state) {
    case PLAYER_STANDING:
      if (hitPressed && player.inputX !== 0) {
        // 좌우를 누른 채 치기 → 그 방향으로 슬라이딩
        player.state = PLAYER_DIVING;
        player.diveDirection = player.inputX;
        player.vy = -diveJumpSpeed;
      } else {
        player.x += speed * player.inputX;
        if (input.up) {
          player.state = PLAYER_JUMPING;
          player.vy = -jumpSpeed;
        }
      }
      break;

    case PLAYER_JUMPING:
      player.x += speed * player.inputX;
      if (hitPressed) {
        player.state = PLAYER_SPIKING;
        player.stateTicks = spikeTicks;
      }
      break;

    case PLAYER_SPIKING:
      player.x += speed * player.inputX;
      player.stateTicks -= 1;
      if (player.stateTicks <= 0) {
        player.state = PLAYER_JUMPING;
      }
      break;

    case PLAYER_DIVING:
      player.x += diveSpeed * player.diveDirection;
      break;

    case PLAYER_LYING:
      player.stateTicks -= 1;
      if (player.stateTicks <= 0) {
        player.state = PLAYER_STANDING;
      }
      break;
  }

  applyAirPhysics(player);

  // 벽과 네트를 넘지 못하게
  const [minX, maxX] = xRange(player.side);
  player.x = Math.min(Math.max(player.x, minX), maxX);
}

// 공중에 있는 상태면 중력을 적용하고 착지를 처리한다
function applyAirPhysics(player) {
  const inAir =
    player.state === PLAYER_JUMPING || player.state === PLAYER_SPIKING || player.state === PLAYER_DIVING;
  if (!inAir) return;

  player.y += player.vy;
  player.vy += CONFIG.player.gravity;

  if (player.y >= standingY()) {
    player.y = standingY();
    player.vy = 0;
    if (player.state === PLAYER_DIVING) {
      player.state = PLAYER_LYING;
      player.stateTicks = CONFIG.player.lyingTicks;
    } else {
      player.state = PLAYER_STANDING;
    }
  }
}
