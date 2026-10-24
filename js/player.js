import { CONFIG } from './config.js';

// 진영
export const SIDE_LEFT = 0;
export const SIDE_RIGHT = 1;

// 캐릭터 상태
export const PLAYER_STANDING = 'standing';
export const PLAYER_JUMPING = 'jumping';

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
  };
}

// 한 틱 동안 이동·점프·중력을 처리한다
export function updatePlayer(player, input) {
  const { speed, jumpSpeed, gravity } = CONFIG.player;

  // 좌우 이동: 왼쪽 -1, 오른쪽 +1, 둘 다 누르거나 안 누르면 0
  let direction = 0;
  if (input.left) direction -= 1;
  if (input.right) direction += 1;
  player.x += speed * direction;

  // 벽과 네트를 넘지 못하게
  const [minX, maxX] = xRange(player.side);
  player.x = Math.min(Math.max(player.x, minX), maxX);

  // 서 있을 때만 점프 시작
  if (player.state === PLAYER_STANDING && input.up) {
    player.vy = -jumpSpeed;
    player.state = PLAYER_JUMPING;
  }

  // 공중: 속도만큼 움직이고 중력으로 속도를 바꾼다
  if (player.state === PLAYER_JUMPING) {
    player.y += player.vy;
    player.vy += gravity;

    // 착지
    if (player.y >= standingY()) {
      player.y = standingY();
      player.vy = 0;
      player.state = PLAYER_STANDING;
    }
  }
}
