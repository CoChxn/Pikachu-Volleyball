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
    debugText: '#1a1a1a',
  },

  // 틱 수 임시 표시
  tickText: {
    font: 'bold 16px monospace',
    x: 4,
    y: 18,
  },
};
