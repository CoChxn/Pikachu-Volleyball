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

  // 경기 규칙
  winScore: 15, // 승리 점수 (듀스 없음)

  // 경기 흐름 시간 (단위: 틱, 25틱 = 1초)
  match: {
    serveTicks: 30, // 라운드 시작 전 멈춰 있는 시간
    fadeInTicks: 16, // 검은 화면이 완전히 밝아지는 시간 (어두워질 때도 같은 빠르기)
    readyBlinkTicks: 5, // READY가 켜졌다 꺼지는 간격
    slowMotionInterval: 5, // 득점 후 슬로모션: 이 틱마다 한 번만 게임 진행
    slowMotionSteps: 6, // 슬로모션 동안 게임을 진행하는 횟수
    fadeOutTicks: 5, // 슬로모션 후 어두워지는 시간
    gameOverMinTicks: 70, // 승리 화면 후 다시 하기 키를 받기 전까지 시간
  },

  // 화면 글자 (점수, 메시지)
  ui: {
    scoreFont: 'bold 32px monospace',
    scoreMarginX: 16, // 점수와 화면 좌우 끝 사이 거리
    scoreY: 36,
    messageFont: 'bold 32px monospace',
    messageY: 120,
    subMessageFont: 'bold 16px monospace',
    subMessageY: 150,
    shadowOffset: 2, // 글자 그림자 거리
  },

  // 시작 메뉴
  menu: {
    title: 'VOLLEY BALL',
    titleFont: 'bold 40px monospace',
    titleY: 80,
    headingFont: 'bold 16px monospace',
    headingY: 120,
    itemFont: 'bold 18px monospace',
    itemStartY: 160, // 첫 항목 y
    itemGap: 28, // 항목 사이 간격
    cursorGapX: 12, // 선택 표시(>)와 항목 글자 사이 거리
    hintFont: 'bold 11px monospace',
    hintY: 292,
    hint: 'UP/DOWN: SELECT   Z/ENTER: OK   ESC: BACK',
    pauseTitle: 'PAUSE',
    pauseHint: 'UP/DOWN: SELECT   Z/ENTER: OK   ESC: CONTINUE',
    overlayAlpha: 0.45, // 메뉴 뒤 경기장을 어둡게
    defaultLevel: 1, // 난이도 화면의 처음 커서 (0: 쉬움, 1: 보통, 2: 어려움)
  },

  // 난수 시작 시드 (0이면 안 됨)
  rngInitialSeed: 20261026,

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
    spikeTicks: 5, // 스파이크 자세를 유지하는 틱 수
    diveSpeed: 8, // 슬라이딩 중 한 틱에 미끄러지는 거리
    diveJumpSpeed: 5, // 슬라이딩 시작 때 살짝 뜨는 속도
    lyingTicks: 10, // 슬라이딩 후 엎드려 있는 틱 수
  },

  // 공
  ball: {
    radius: 20,
    gravity: 1, // 매 틱 아래로 더해지는 속도
    serveX: [56, 376], // 서브 때 공의 x 위치 [1P 서브, 2P 서브]
    serveY: 0, // 서브 때 공의 y 위치 (화면 맨 위)
    serveVy: 1, // 서브 때 공의 세로 속도 (가로 속도는 0)
    ceilingY: 0, // 공 중심이 이보다 위로 가면 위로 가던 힘을 잃는다 (원작)
    ceilingBounceVy: 1, // 천장에 닿은 뒤 세로 속도 (원작: 바로 떨어지기 시작)
    bodyBounceDivisor: 3, // 몸 충돌 가로 속도 = (공x - 캐릭터x) ÷ 이 값
    minBounceSpeed: 15, // 몸에 맞고 위로 튕기는 최소 속도
    spikeSpeedX: 10, // 스파이크 가로 속도 = (|가로 입력| + 1) × 이 값
    spikeVyMultiplier: 2, // 스파이크 세로 속도 = |세로 속도| × 세로 입력 × 이 값
    netTopBounceDepth: 16, // 공 아랫면이 네트 꼭대기에서 이만큼 안쪽까지면 위로 튕김, 더 깊으면 옆으로 튕김
  },

  // 선생님 캐릭터 그림 (그림 전용, 충돌 판정은 player의 64×64 사각형 그대로)
  // 좌표는 캐릭터 중심 기준, +x가 얼굴 방향
  teacher: {
    lookKey: 'F3', // 시안 비교용 임시 키 (시안을 고르면 없앤다)
    lookLabelFont: 'bold 11px monospace',
    lookLabelY: 14,
    // 시안: hair(bob 단발 / bun 올림머리 / curly 뽀글 / short 짧은 머리), prop(pointer 지시봉 / book 출석부 / chalk 분필)
    // palettes: [1P, 2P] 색. accent는 넥타이·출석부 색
    looks: [
      {
        name: 'A1 BOB + POINTER',
        hair: 'bob',
        prop: 'pointer',
        tie: false,
        palettes: [
          { hair: '#5a3825', outfit: '#f29cb7', glasses: '#7a3b2e', accent: '#c0392b' },
          { hair: '#2a2a3a', outfit: '#7fbfe8', glasses: '#2b4a7a', accent: '#2e5fa8' },
        ],
      },
      {
        name: 'A2 BUN + BOOK',
        hair: 'bun',
        prop: 'book',
        tie: false,
        palettes: [
          { hair: '#7a4a2a', outfit: '#f6c86a', glasses: '#8a5a20', accent: '#d9534f' },
          { hair: '#3a3a3a', outfit: '#9ad3a8', glasses: '#2f6b45', accent: '#3b7dd8' },
        ],
      },
      {
        name: 'A3 CURLY + CHALK',
        hair: 'curly',
        prop: 'chalk',
        tie: false,
        palettes: [
          { hair: '#a0522d', outfit: '#c9a0e8', glasses: '#6a3d8a', accent: '#8e44ad' },
          { hair: '#444444', outfit: '#f0a070', glasses: '#8a4a20', accent: '#d35400' },
        ],
      },
      {
        name: 'A4 SHORT + TIE',
        hair: 'short',
        prop: 'pointer',
        tie: true,
        palettes: [
          { hair: '#3b2a1a', outfit: '#e8dcc0', glasses: '#333333', accent: '#d9534f' },
          { hair: '#1e1e28', outfit: '#c8d8e8', glasses: '#333333', accent: '#3b5fa8' },
        ],
      },
    ],
    skin: '#ffd9b8',
    shoeColor: '#4a3a30',
    collarColor: '#ffffff',
    walkBob: 2, // 걸을 때 들썩이는 높이
    walkBobTicks: 3, // 들썩임 간격 (틱)
    sadDropY: 2, // 시무룩할 때 내려앉는 거리
    blinkInterval: 75, // 깜빡임 주기 (틱)
    blinkTicks: 3, // 눈 감고 있는 틱 수
    blinkSideOffset: 37, // 1P와 2P 깜빡임 시간 차이
    shape: {
      headRadius: 17,
      headY: -13, // 머리 중심
      bodyTop: 3,
      bodyBottom: 26,
      bodyHalfWidth: 13,
      bodyCorner: 6,
      legX: 6, // 다리 좌우 위치
      legY: 29,
      legRx: 5,
      legRy: 3,
      shoulderBackX: -6, // 뒤 팔 어깨
      shoulderFrontX: 6, // 앞 팔 어깨
      shoulderY: 8,
      armLength: 13,
      armWidth: 5,
      handRadius: 3,
      collarDepth: 6,
      collarWidth: 6,
      tieWidth: 3,
      tieLength: 10,
      flatOffsetY: 16, // 엎드릴 때 내려가는 거리
      flatAngle: 90, // 엎드릴 때 눕는 각도
    },
    // 팔 각도(도): 0 아래, 90 앞, 180 위, -90 뒤
    arms: {
      stand: 15,
      walkSwing: 30,
      swingTicks: 3, // 걸을 때·만세 흔들기 간격 (틱)
      jump: 125,
      spikeBack: -40,
      spikeStart: 140, // 스파이크 시작: 앞-위
      spikeEnd: 40, // 스파이크 끝: 앞-아래
      dive: 170, // 엎드린 자세는 몸을 90도 눕힌 뒤의 각도 (팔은 몸 뒤에 그림)
      lying: 0,
      cheer: 135,
      cheerWave: 15,
      sad: 10,
    },
    hair: {
      outline: 1, // 단발이 머리보다 바깥으로 나오는 정도
      bobTop: 10,
      bobLength: 24,
      bobBackWidth: 6,
      bobCorner: 5,
      bunX: 9,
      bunY: 15,
      bunRadius: 7,
      curlAngles: [-170, -140, -110, -80, -50, -20, 160],
      curlRadius: 6,
      hairLine: { bob: 5, bun: 7, curly: 8, short: 9 }, // 머리 중심에서 이마선까지 거리
      sideWidth: 7, // 귀 쪽 옆머리 폭
      sideLength: 2,
      fringeX: 6, // 앞머리
      fringeRx: 7,
      fringeRy: 3,
    },
    face: {
      eyeX: [3, 12], // 뒤쪽 눈, 앞쪽 눈
      eyeOffsetY: 1,
      eyeSize: 2,
      pupilRadius: 1.5,
      lineWidth: 1,
      lineColor: '#3a2a20',
      glassesRadius: 4,
      glassesWidth: 1.5,
      glassesTilt: 12, // 엎드렸을 때 안경 기울기 (도)
      templeX: -6, // 안경다리 끝
      mouthX: 9,
      mouthOffsetY: 8,
      mouthSize: 3,
      mouthOpenRadius: 2.5,
      mouthColor: '#c0504d',
    },
    props: {
      pointerLength: 16,
      pointerWidth: 2,
      pointerColor: '#8b5a2b',
      pointerTipColor: '#e04040',
      pointerTipRadius: 1.5,
      bookWidth: 9,
      bookHeight: 11,
      bookSpine: 2,
      bookPageColor: '#ffffff',
      chalkLength: 5,
      chalkWidth: 3,
      chalkColor: '#ffffff',
    },
  },

  // 컴퓨터 AI
  ai: {
    maxPredictTicks: 200, // 공을 미리 굴려 볼 최대 틱 수
    maxBoldness: 5, // 대담함은 0 ~ (이 값 - 1) 중 라운드마다 하나
    boldStepX: 6, // 대담함 1당 기본 위치가 네트 쪽으로 가는 거리
    receiveOffsetX: 12, // 공을 받을 때 공보다 내 코트 안쪽으로 서는 거리 (공을 상대 쪽으로 보내려고)
    moveDeadzone: 4, // 목표와 이 거리 안이면 멈춤
    jumpLookTicks: 16, // 점프하면 공과 만날지 몇 틱 앞까지 계산할지
    jumpReachX: 20, // 점프 판단: 공과 이 가로 거리 안에서 만나면 점프
    jumpReachPerBold: 6, // 대담함 1당 점프 판단 가로 거리 증가
    diveTriggerTicks: 16, // 공이 이 틱 안에 떨어질 때만 슬라이딩 고려
    diveMaxBoldness: 3, // 대담함이 이 값 이상이면 슬라이딩하지 않음
    easyReactionTicks: 4, // 쉬움: 이 틱마다 한 번만 판단
    easyErrorRange: 16, // 쉬움: 받는 위치 오차 범위 (±)
  },

  // 키 배치 (e.code 값: 키보드의 물리적 위치)
  keys: {
    p1: { up: 'KeyR', left: 'KeyD', right: 'KeyG', down: 'KeyF', hit: 'KeyZ' },
    p2: { up: 'ArrowUp', left: 'ArrowLeft', right: 'ArrowRight', down: 'ArrowDown', hit: 'Enter' },
    back: 'Escape', // 메뉴 뒤로 가기, 경기 중 일시정지, 경기 종료 후 메뉴로
  },

  // 색상
  colors: {
    sky: '#7ec8f0',
    ground: '#e2b65a',
    groundLine: '#b8862f',
    net: '#f4f4f4',
    netCap: '#c0392b',
    ball: '#ffffff',
    ballOutline: '#c0392b',
    debugText: '#1a1a1a',
    uiText: '#ffffff',
    uiShadow: '#1a1a1a',
    fade: '#000000',
    debugHitbox: '#ff00ff',
    debugNetTop: '#00c000',
    debugDrag: '#0033cc',
    debugLanding: '#ff0000',
    menuSelected: '#ffe04a',
  },

  // 디버그 모드
  debug: {
    toggleKey: 'F2',
    winScore: 3, // 디버그 모드에서의 승리 점수 (빠른 확인용)
    font: 'bold 12px monospace',
    textX: 4,
    textY: 56, // 점수 아래부터
    lineHeight: 14,
    throwDragScale: 4, // 드래그 몇 픽셀당 공 속도 1
    maxThrowSpeed: 30, // 던질 수 있는 최대 속도
    dragStartRadius: 3, // 드래그 시작점 표시 크기
  },
};
