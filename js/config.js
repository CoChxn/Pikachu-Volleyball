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
  groundY: 252, // 바닥 윗면의 y 좌표
  netWidth: 6, // 네트 기둥 두께
  netTopY: 176, // 네트 꼭대기의 y 좌표
  netCapHeight: 4, // 네트 꼭대기 장식 높이

  // 색상
  colors: {
    sky: '#7ec8f0',
    ground: '#e2b65a',
    groundLine: '#b8862f',
    net: '#f4f4f4',
    netCap: '#c0392b',
    debugText: '#1a1a1a',
  },

  // 틱 수 임시 표시
  tickText: {
    font: '8px monospace',
    x: 4,
    y: 10,
  },
};
