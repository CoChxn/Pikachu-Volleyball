// 게임의 모든 수치. 조작감은 이 파일만 고쳐서 조절한다.
export const CONFIG = {
  // 버전 (메뉴 구석에 표시: 브라우저가 새 버전을 실행 중인지 확인용, 업데이트마다 올린다)
  version: 'v8',

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
    muteFont: 'bold 11px monospace', // 경기 중 음소거 표시
    muteY: 14,
    versionFont: 'bold 10px monospace', // 메뉴 구석 버전 표시
    versionMargin: 4,
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
    soundY: 274, // 소리 켜짐/꺼짐 안내 위치
    joinHint: '0-9: TYPE   BACKSPACE: DELETE   Z/ENTER: JOIN',
    lobbyHint: 'ESC: CANCEL',
    leaveTitle: 'LEAVE GAME?',
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
    // 짧은 머리 + 넥타이 + 출석부. [1P, 2P] 색 (accent는 넥타이·출석부 색)
    palettes: [
      { hair: '#3b2a1a', outfit: '#e8dcc0', glasses: '#333333', accent: '#d9534f' },
      { hair: '#1e1e28', outfit: '#c8d8e8', glasses: '#333333', accent: '#3b5fa8' },
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
      hairLine: 9, // 머리 중심에서 이마선까지 거리
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
    book: {
      width: 9, // 출석부 크기
      height: 11,
      spine: 2, // 흰 책장 폭
      pageColor: '#ffffff',
    },
  },

  // 손맛 연출 (화면 전용, 단위: 틱·픽셀)
  effects: {
    ring: { ticks: 6, smallFrom: 6, smallTo: 22, bigFrom: 10, bigTo: 40, width: 2, color: '#ffffff' }, // 타격 원
    star: { count: 8, inner: 12, outerFrom: 18, outerTo: 34, width: 2, color: '#fff3a0' }, // 스파이크 별빛 선
    trail: { minSpeed: 15, length: 4, alpha: 0.35 }, // 공 잔상: 이 속도 이상일 때 몇 개를 얼마나 진하게
    shake: { spikeTicks: 6, spikePower: 1, scoreTicks: 8, scorePower: 1.5 }, // 화면 흔들림 (틱, 픽셀)
    dust: { count: 6, speed: 2, gravity: 0.25, ticks: 10, radius: 2, angleFrom: 200, angleTo: 340, color: '#b8862f' }, // 먼지
    ball: { spinPerSpeed: 6, stripeColor: '#3a6fd8', stripeWidth: 2, stripeBend: 8, stripeCount: 3 }, // 공 회전 무늬 (가로 속도 1당 회전 각도)
    scorePop: { ticks: 12, scale: 0.6 }, // 점수 튀어오름: 틱, 최대 커지는 비율
  },

  // 효과음 (Web Audio API로 생성)
  // 한 소리는 여러 조각으로: kind 'tone'(음, wave 파형, from→to Hz) 또는 'noise'(잡음, filter Hz)
  // duration·delay는 초, volume은 0~1
  sound: {
    masterVolume: 0.25, // 전체 소리 크기
    silence: 0.0001, // 소리가 줄어드는 끝 값 (0이면 계산이 안 됨)
    noiseSeconds: 0.5, // 잡음 소리 재료 길이
    effects: {
      bodyHit: [{ kind: 'tone', wave: 'triangle', from: 330, to: 160, duration: 0.09, volume: 0.8 }],
      spike: [
        { kind: 'noise', filter: 1800, duration: 0.12, volume: 0.9 },
        { kind: 'tone', wave: 'square', from: 220, to: 60, duration: 0.15, volume: 0.5 },
      ],
      jump: [{ kind: 'tone', wave: 'sine', from: 300, to: 620, duration: 0.1, volume: 0.4 }],
      dive: [{ kind: 'noise', filter: 900, duration: 0.18, volume: 0.5 }],
      net: [{ kind: 'tone', wave: 'square', from: 900, to: 700, duration: 0.04, volume: 0.3 }],
      wall: [{ kind: 'tone', wave: 'square', from: 700, to: 500, duration: 0.04, volume: 0.25 }],
      score: [
        { kind: 'tone', wave: 'square', from: 880, to: 880, duration: 0.08, volume: 0.4 },
        { kind: 'tone', wave: 'square', from: 1320, to: 1320, duration: 0.1, volume: 0.4, delay: 0.09 },
      ],
      win: [
        { kind: 'tone', wave: 'square', from: 523, to: 523, duration: 0.12, volume: 0.4 },
        { kind: 'tone', wave: 'square', from: 659, to: 659, duration: 0.12, volume: 0.4, delay: 0.13 },
        { kind: 'tone', wave: 'square', from: 784, to: 784, duration: 0.12, volume: 0.4, delay: 0.26 },
        { kind: 'tone', wave: 'square', from: 1047, to: 1047, duration: 0.3, volume: 0.4, delay: 0.39 },
      ],
      menuMove: [{ kind: 'tone', wave: 'square', from: 600, to: 600, duration: 0.04, volume: 0.3 }],
      menuSelect: [{ kind: 'tone', wave: 'square', from: 900, to: 1200, duration: 0.08, volume: 0.35 }],
    },
  },

  // 온라인 대전 (PeerJS + 락스텝)
  online: {
    peerLibraryUrl: 'https://cdn.jsdelivr.net/npm/peerjs@1.5.5/dist/peerjs.min.js', // 버전 고정
    idPrefix: 'teacher-volley-', // 방 코드 앞에 붙는 이름 (다른 서비스와 겹치지 않게)
    codeLength: 6, // 방 코드 자리 수 (숫자)
    inputDelay: 3, // 내 입력을 몇 틱 뒤에 적용할지 (클수록 끊김↓ 반응↓)
    hashInterval: 25, // 몇 틱마다 상태 요약값을 비교할지
    hashSeed: 2166136261, // 요약값(FNV-1a) 계산용 고정 수
    hashPrime: 16777619,
    maxSeed: 2147483647, // 시작 시드 최댓값
    pingIntervalMs: 1000, // 왕복 시간 재는 간격
    waitingNoticeMs: 500, // 상대 입력을 이만큼 기다리면 "WAITING" 표시
    disconnectTimeoutMs: 10000, // 이만큼 아무 메시지도 없으면 연결 끊김
    hudY: 26, // 화면 위쪽 ping 표시 위치
    hudFont: 'bold 10px monospace',
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
    mute: 'KeyM', // 소리 켜기/끄기
    delete: 'Backspace', // 방 코드 한 글자 지우기
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
    warning: '#ff4040',
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
