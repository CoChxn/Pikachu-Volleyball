import { CONFIG } from './config.js';
import { createInitialState, step } from './game.js';
import { openConnection, NET_OPEN, NET_ERROR } from './net.js';

// 온라인 대전: 락스텝 입력 동기화
// 두 컴퓨터가 같은 시드로 시작해 같은 입력으로 step()을 돌리므로 결과가 같다.
// 주고받는 것은 키 입력뿐이고, 틱 t의 두 입력이 모두 모여야 틱 t를 진행한다.
// 내 입력은 inputDelay틱 뒤에 적용해서, 상대에게 미리 도착할 시간을 준다.

export const ONLINE_LOBBY = 'lobby'; // 연결·준비 중
export const ONLINE_PLAYING = 'playing'; // 경기 중
export const ONLINE_ENDED = 'ended'; // 끝남 (상대가 나감, 연결 끊김, 오류)

const NO_INPUT = { left: false, right: false, up: false, down: false, hit: false };

// 입력을 숫자 하나로 줄여서 보낸다 (키마다 한 비트)
const KEY_BITS = { left: 1, right: 2, up: 4, down: 8, hit: 16 };

function encodeInput(input) {
  let bits = 0;
  for (const [key, bit] of Object.entries(KEY_BITS)) {
    if (input[key]) bits |= bit;
  }
  return bits;
}

function decodeInput(bits) {
  const input = {};
  for (const [key, bit] of Object.entries(KEY_BITS)) {
    input[key] = (bits & bit) !== 0;
  }
  return input;
}

// 게임 상태 요약값 (FNV-1a 해시). 양쪽 값이 다르면 결과가 어긋난 것
export function hashState(state) {
  const text = JSON.stringify(state);
  let hash = CONFIG.online.hashSeed;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, CONFIG.online.hashPrime);
  }
  return hash >>> 0;
}

// 온라인 세션 만들기. role: 'host'(방장, 1P) 또는 'guest'(참가자, 2P)
export function createOnlineSession(role, code, now) {
  const session = {
    role,
    localSide: role === 'host' ? 0 : 1,
    phase: ONLINE_LOBBY,
    net: null,
    state: null, // 경기가 시작되면 게임 상태
    localInputs: new Map(), // 틱 번호 → 내 입력
    remoteInputs: new Map(), // 틱 번호 → 상대 입력
    nextLocalTick: 0, // 다음에 보낼 내 입력의 틱 번호
    localHashes: new Map(),
    remoteHashes: new Map(),
    desync: false, // 결과가 어긋났는지
    rtt: null, // 왕복 시간 (밀리초)
    lastPingAt: now,
    lastMessageAt: now,
    waitingSince: null, // 상대 입력을 기다리기 시작한 시각
    endReason: null,
  };
  session.net = openConnection(role, code, {
    onOpen: () => {
      session.lastMessageAt = performance.now();
      session.net.send({ type: 'hello', version: CONFIG.version });
    },
    onMessage: (message) => handleMessage(session, message),
    onClose: () => {
      const reason = session.net.status === NET_ERROR ? session.net.error : 'OPPONENT LEFT';
      end(session, reason);
    },
  });
  return session;
}

// 방 코드 (방장은 코드가 겹치면 바뀔 수 있어서 net에서 읽는다)
export function roomCode(session) {
  return session.net.code;
}

// 세션을 끝낸다 (이미 끝났으면 무시)
function end(session, reason) {
  if (session.phase === ONLINE_ENDED) return;
  session.phase = ONLINE_ENDED;
  session.endReason = reason;
  session.net.close();
}

// 내가 나가기: 상대에게 알리고 연결을 닫는다
export function leaveOnline(session) {
  session.net.send({ type: 'bye' });
  end(session, 'LEFT');
}

// 같은 시드로 경기 시작
function begin(session, seed) {
  session.state = createInitialState(seed);
  session.phase = ONLINE_PLAYING;
  session.nextLocalTick = CONFIG.online.inputDelay; // 처음 몇 틱은 양쪽 모두 입력 없음
}

function handleMessage(session, message) {
  session.lastMessageAt = performance.now();
  switch (message.type) {
    case 'hello':
      if (message.version !== CONFIG.version) {
        // 버전이 다르면 계산이 달라질 수 있다 (한쪽이 예전 파일을 쓰는 경우 등)
        session.net.send({ type: 'bye' });
        end(session, `VERSION MISMATCH ${message.version}`);
        return;
      }
      if (session.role === 'host') {
        // 방장이 시드를 정해 보낸다 (시작 시드는 화면 쪽에서 정하는 값이라 Math.random 사용)
        const seed = Math.floor(Math.random() * CONFIG.online.maxSeed) + 1;
        session.net.send({ type: 'start', seed });
        begin(session, seed);
      }
      break;
    case 'start':
      begin(session, message.seed);
      break;
    case 'input':
      session.remoteInputs.set(message.t, decodeInput(message.b));
      break;
    case 'hash':
      session.remoteHashes.set(message.t, message.h);
      checkHash(session, message.t);
      break;
    case 'ping':
      session.net.send({ type: 'pong', s: message.s });
      break;
    case 'pong':
      session.rtt = Math.round(performance.now() - message.s);
      break;
    case 'bye':
      end(session, 'OPPONENT LEFT');
      break;
  }
}

// 같은 틱의 요약값이 양쪽 다 있으면 비교
function checkHash(session, tick) {
  const mine = session.localHashes.get(tick);
  const theirs = session.remoteHashes.get(tick);
  if (mine === undefined || theirs === undefined) return;
  if (mine !== theirs) session.desync = true;
  session.localHashes.delete(tick);
  session.remoteHashes.delete(tick);
}

// 틱 t에 쓸 입력 (처음 inputDelay틱은 양쪽 모두 입력 없음)
function inputFor(map, tick) {
  return tick < CONFIG.online.inputDelay ? NO_INPUT : map.get(tick);
}

// 지금 틱의 두 입력이 모두 있으면 한 틱 진행. 진행했으면 true
function tryStep(session) {
  const tick = session.state.tick;
  const mine = inputFor(session.localInputs, tick);
  const theirs = inputFor(session.remoteInputs, tick);
  if (!mine || !theirs) return false;

  const inputs = session.localSide === 0 ? [mine, theirs] : [theirs, mine];
  step(session.state, inputs[0], inputs[1]);
  session.localInputs.delete(tick);
  session.remoteInputs.delete(tick);

  // 일정 틱마다 상태 요약값을 보내 비교
  if (session.state.tick % CONFIG.online.hashInterval === 0) {
    const hash = hashState(session.state);
    session.localHashes.set(session.state.tick, hash);
    session.net.send({ type: 'hash', t: session.state.tick, h: hash });
    checkHash(session, session.state.tick);
  }
  return true;
}

// 매 틱(1/25초) 호출. localInput: 내 키 입력, now: 현재 시각(밀리초)
// onStep: 한 틱 진행할 때마다 부름 (효과음·연출용)
export function updateOnline(session, localInput, now, onStep) {
  const o = CONFIG.online;
  if (session.phase === ONLINE_ENDED) return;

  // 왕복 시간 측정
  if (session.net.status === NET_OPEN && now - session.lastPingAt >= o.pingIntervalMs) {
    session.lastPingAt = now;
    session.net.send({ type: 'ping', s: now });
  }
  if (session.phase !== ONLINE_PLAYING) return;

  // 오래 아무 메시지도 없으면 연결이 끊긴 것으로 본다
  if (now - session.lastMessageAt > o.disconnectTimeoutMs) {
    end(session, 'CONNECTION LOST');
    return;
  }

  // 내 입력: 지금 틱 + inputDelay 틱에 쓸 입력으로 보낸다
  const tick = session.state.tick;
  if (session.nextLocalTick <= tick + o.inputDelay) {
    session.localInputs.set(session.nextLocalTick, localInput);
    session.net.send({ type: 'input', t: session.nextLocalTick, b: encodeInput(localInput) });
    session.nextLocalTick += 1;
  }

  if (!tryStep(session)) {
    if (session.waitingSince === null) session.waitingSince = now;
    return;
  }
  session.waitingSince = null;
  onStep();

  // 상대보다 뒤처졌으면(상대 입력이 더 앞까지 와 있으면) 한 틱 더 진행해 따라잡는다
  if (session.remoteInputs.has(session.state.tick + o.inputDelay) && tryStep(session)) onStep();
}

// 상대 입력을 오래 기다리고 있는지 (화면에 "기다리는 중" 표시용)
export function isWaitingLong(session, now) {
  return session.waitingSince !== null && now - session.waitingSince >= CONFIG.online.waitingNoticeMs;
}
