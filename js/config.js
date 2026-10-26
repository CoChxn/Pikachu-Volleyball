// 게임의 모든 수치. 조작감은 이 파일만 고쳐서 조절한다.
export const CONFIG = {
  // 논리 해상도 (원작 기준)
  width: 432,
  height: 304,

  // 1초에 게임 로직을 갱신하는 횟수
  tickRate: 25,
  // 한 프레임에 몰아서 처리할 최대 틱 수 (탭을 오래 비웠다 돌아올 때 멈춤 방지)
  maxTicksPerFrame: 5,

  // true면 정수 배율로만 확대 (픽셀 크기가 고르게 보임)
  integerScale: true,

  // 경기장
  groundY: 276, // 바닥 윗면의 y 좌표
  netWidth: 6, // 네트 기둥 두께
  netTopY: 176, // 네트 꼭대기의 y 좌표
  netCapHeight: 4, // 네트 꼭대기 장식 높이

  // 캐릭터
  player: {
    halfWidth: 32, // 몸 가로 절반
    halfHeight: 32, // 몸 세로 절반
    startOffsetX: 36, // 시작 위치: 자기 쪽 벽에서 몸 중심까지 거리
    speed: 6, // 한 틱에 좌우로 움직이는 거리
    jumpSpeed: 16, // 점프 순간 위로 향하는 속도
    gravity: 1, // 매 틱 아래로 더해지는 속도
  },

  // 공
  ball: {
    radius: 20,
    gravity: 1, // 매 틱 아래로 더해지는 속도
    startX: 56, // 시작 위치와 속도
    startY: 0,
    startVx: 0,
    startVy: 0,
    ceilingY: 0, // 공 중심이 이보다 위로 가면 위로 가던 힘을 잃는다 (원작)
    ceilingBounceVy: 1, // 천장에 닿은 뒤 세로 속도 (원작: 바로 떨어지기 시작)
    netTopBounceDepth: 16, // 공 아랫면이 네트 꼭대기에서 이만큼 안쪽까지면 위로 튕김, 더 깊으면 옆으로 튕김
  },

  // 키 배치 (e.code 값: 키보드의 물리적 위치)
  keys: {
    p1: { up: 'KeyR', left: 'KeyD', right: 'KeyG', down: 'KeyF', hit: 'KeyZ' },
    p2: { up: 'ArrowUp', left: 'ArrowLeft', right: 'ArrowRight', down: 'ArrowDown', hit: 'Enter' },
  },

  // 색상
  colors: {
    player1: '#f5d142',
    player2: '#f0904a',
    playerOutline: '#5a3b12',
    sky: '#7ec8f0',
    ground: '#e2b65a',
    groundLine: '#b8862f',
    net: '#f4f4f4',
    netCap: '#c0392b',
    ball: '#ffffff',
    ballOutline: '#c0392b',
    debugText: '#1a1a1a',
    debugHitbox: '#ff00ff',
    debugNetTop: '#00c000',
    debugDrag: '#0033cc',
  },

  // 디버그 모드
  debug: {
    toggleKey: 'F2',
    font: 'bold 12px monospace',
    textX: 4,
    textY: 14,
    lineHeight: 14,
    throwDragScale: 4, // 드래그 몇 픽셀당 공 속도 1
    maxThrowSpeed: 30, // 던질 수 있는 최대 속도
    dragStartRadius: 3, // 드래그 시작점 표시 크기
  },
};
