import { CONFIG } from './config.js';

// PeerJS 연결 담당: 라이브러리 불러오기, 방 만들기/참가, 메시지 주고받기.
// 게임 로직과 분리되어 있고, 받은 메시지는 handlers로 넘겨준다.

// 연결 상태
export const NET_LOADING = 'loading'; // PeerJS 불러오는 중
export const NET_WAITING = 'waiting'; // 방장: 방을 만들고 상대를 기다리는 중
export const NET_CONNECTING = 'connecting'; // 참가자: 방에 접속하는 중
export const NET_OPEN = 'open'; // 연결됨
export const NET_CLOSED = 'closed'; // 연결이 끊김
export const NET_ERROR = 'error'; // 오류

// PeerJS 오류 종류를 화면에 보여 줄 짧은 문구로
const ERROR_TEXT = {
  'peer-unavailable': 'ROOM NOT FOUND',
  'browser-incompatible': 'BROWSER NOT SUPPORTED',
  network: 'NETWORK ERROR',
  'server-error': 'SERVER ERROR',
  'socket-error': 'SERVER ERROR',
  'socket-closed': 'SERVER ERROR',
};

let libraryPromise = null;

// PeerJS를 CDN에서 한 번만 불러온다 (온라인을 고를 때만 불러와서, 오프라인 게임에는 영향 없음)
function loadPeerLibrary() {
  if (window.peerjs) return Promise.resolve(window.peerjs.Peer);
  if (!libraryPromise) {
    libraryPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = CONFIG.online.peerLibraryUrl;
      script.onload = () => resolve(window.peerjs.Peer);
      script.onerror = () => {
        libraryPromise = null;
        script.remove();
        reject(new Error('LIBRARY LOAD FAILED'));
      };
      document.head.appendChild(script);
    });
  }
  return libraryPromise;
}

// 중개 서버 설정. 기본은 PeerJS 공개 서버.
// 테스트용: 주소 뒤에 ?peerHost=localhost&peerPort=9000&peerPath=/ 를 붙이면 다른 서버를 쓴다
function serverOptions() {
  const params = new URLSearchParams(window.location.search);
  const host = params.get('peerHost');
  if (!host) return {};
  return {
    host,
    port: Number(params.get('peerPort')),
    path: params.get('peerPath') ?? '/',
    secure: params.get('peerSecure') === '1',
  };
}

// 방 코드: 숫자 몇 자리 (화면 전용이라 Math.random을 써도 게임 결과와 무관)
export function randomRoomCode() {
  let code = '';
  for (let i = 0; i < CONFIG.online.codeLength; i++) {
    code += Math.floor(Math.random() * 10);
  }
  return code;
}

// 통로 이름: 순서·도착을 보장하는 통로(시작·종료 같은 중요한 메시지)와
// 순서를 기다리지 않는 빠른 통로(매 틱 입력). 빠른 통로는 메시지 하나가 늦어도 뒤 메시지가 막히지 않는다.
const CHANNEL_CONTROL = 'control';
const CHANNEL_FAST = 'fast';

// 연결 하나를 연다. role: 'host'(방 만들기) 또는 'guest'(참가), code: 참가할 방 코드 (방장은 무시)
// handlers: { onOpen(), onMessage(message), onClose() }
// 돌려주는 net: { status, error, code, send(message, fast), close() }
export function openConnection(role, code, handlers) {
  // 방장은 새 방 코드를 만든다
  const roomCode = role === 'host' ? randomRoomCode() : code;
  const net = { status: NET_LOADING, error: null, code: roomCode, peer: null, channels: {} };

  const fail = (text) => {
    if (net.status === NET_CLOSED) return;
    net.status = NET_ERROR;
    net.error = text;
    handlers.onClose();
  };

  // 두 통로가 모두 열리면 연결 완료
  const checkOpen = () => {
    const { control, fast } = net.channels;
    if (net.status !== NET_OPEN && control?.open && fast?.open) {
      net.status = NET_OPEN;
      handlers.onOpen();
    }
  };

  // 통로가 생기면 이벤트 연결
  const attach = (conn) => {
    net.channels[conn.label] = conn;
    conn.on('open', checkOpen);
    conn.on('data', (message) => handlers.onMessage(message));
    conn.on('close', () => {
      if (net.status === NET_OPEN) {
        net.status = NET_CLOSED;
        handlers.onClose();
      }
    });
    conn.on('error', () => fail('CONNECTION ERROR'));
  };

  // 방장: 방 코드를 내 이름(id)으로 쓰고, 상대가 접속하기를 기다린다
  const startHost = (Peer) => {
    const peer = new Peer(CONFIG.online.idPrefix + net.code, serverOptions());
    net.peer = peer;
    peer.on('open', () => {
      net.status = NET_WAITING;
    });
    peer.on('connection', (conn) => {
      const known = conn.label === CHANNEL_CONTROL || conn.label === CHANNEL_FAST;
      const otherPeer = Object.values(net.channels).some((c) => c.peer !== conn.peer);
      if (!known || net.channels[conn.label] || otherPeer) {
        conn.close(); // 이미 상대가 있거나 모르는 통로면 거절
        return;
      }
      attach(conn);
    });
    peer.on('error', (err) => {
      if (err.type === 'unavailable-id') {
        // 같은 코드의 방이 이미 있으면 새 코드로 다시
        peer.destroy();
        net.code = randomRoomCode();
        startHost(Peer);
        return;
      }
      fail(ERROR_TEXT[err.type] ?? 'CONNECTION ERROR');
    });
  };

  // 참가자: 아무 이름으로 서버에 접속한 뒤 방 코드로 두 통로를 연다
  const startGuest = (Peer) => {
    const peer = new Peer(serverOptions());
    net.peer = peer;
    net.status = NET_CONNECTING;
    peer.on('open', () => {
      const id = CONFIG.online.idPrefix + net.code;
      attach(peer.connect(id, { label: CHANNEL_CONTROL, reliable: true }));
      attach(peer.connect(id, { label: CHANNEL_FAST, reliable: false }));
    });
    peer.on('error', (err) => fail(ERROR_TEXT[err.type] ?? 'CONNECTION ERROR'));
  };

  loadPeerLibrary()
    .then((Peer) => {
      if (net.status === NET_CLOSED) return; // 불러오는 사이에 취소됨
      if (role === 'host') startHost(Peer);
      else startGuest(Peer);
    })
    .catch(() => fail('CANNOT LOAD PEERJS'));

  // 테스트용: 주소에 ?netDelay=100&netJitter=50&netLoss=0.1 을 붙이면
  // 메시지를 일부러 늦게 보내고, 빠른 통로 메시지 일부를 버린다 (먼 거리·불안정한 망 흉내)
  const params = new URLSearchParams(window.location.search);
  const testDelay = Number(params.get('netDelay') ?? 0);
  const testJitter = Number(params.get('netJitter') ?? 0);
  const testLoss = Number(params.get('netLoss') ?? 0);

  // fast: true면 빠른 통로(입력·ping·요약값), 아니면 중요한 메시지 통로
  net.send = (message, fast = false) => {
    if (net.status !== NET_OPEN) return;
    const conn = net.channels[fast ? CHANNEL_FAST : CHANNEL_CONTROL];
    if (fast && Math.random() < testLoss) return;
    if (testDelay || testJitter) {
      setTimeout(() => net.status === NET_OPEN && conn.send(message), testDelay + Math.random() * testJitter);
    } else {
      conn.send(message);
    }
  };
  net.close = () => {
    net.status = NET_CLOSED;
    for (const conn of Object.values(net.channels)) conn.close();
    if (net.peer) net.peer.destroy();
  };
  return net;
}
