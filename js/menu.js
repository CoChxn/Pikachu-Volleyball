import { CONFIG } from './config.js';
import { SIDE_LEFT, SIDE_RIGHT } from './player.js';
import { AI_LEVEL_NAMES } from './ai.js';

// 메뉴 화면
export const SCREEN_TITLE = 'title'; // 모드 고르기
export const SCREEN_SIDE = 'side'; // 1P vs CPU: 내 자리 고르기
export const SCREEN_LEVEL = 'level'; // 1P vs CPU: 난이도 고르기

const MODE_VS_CPU = 'vsCpu';
const MODE_TWO_PLAYERS = 'twoPlayers';

// 화면별 제목과 항목 (항목 value는 고른 값)
export const MENU_SCREENS = {
  [SCREEN_TITLE]: {
    heading: '',
    items: [
      { label: '1P vs CPU', value: MODE_VS_CPU },
      { label: '2P PLAY', value: MODE_TWO_PLAYERS },
    ],
  },
  [SCREEN_SIDE]: {
    heading: 'CHOOSE SIDE',
    items: [
      { label: 'LEFT   R D G F + Z', value: SIDE_LEFT },
      { label: 'RIGHT  ARROWS + ENTER', value: SIDE_RIGHT },
    ],
  },
  [SCREEN_LEVEL]: {
    heading: 'CHOOSE LEVEL',
    items: AI_LEVEL_NAMES.map((name, level) => ({ label: name, value: level })),
  },
};

// 메뉴 상태 (게임 상태가 아닌 화면 상태)
export function createMenu() {
  return {
    screen: SCREEN_TITLE,
    cursor: 0,
    humanSide: SIDE_LEFT,
    prev: { up: false, down: false, hit: false }, // 지난 틱 키 (새로 눌림 판단)
  };
}

// 화면을 바꾸고 커서 위치를 정한다
function goTo(menu, screen, cursor) {
  menu.screen = screen;
  menu.cursor = cursor;
}

// 지금 누르고 있는 키를 "이미 눌려 있던 것"으로 기록 (화면이 바뀐 직후 잘못 선택되지 않게)
export function holdCurrentKeys(menu, inputs) {
  menu.prev = {
    up: inputs.some((input) => input.up),
    down: inputs.some((input) => input.down),
    hit: inputs.some((input) => input.hit),
  };
}

// 경기에서 돌아올 때: 첫 화면으로 (고른 자리는 기억)
export function returnToTitle(menu, inputs) {
  goTo(menu, SCREEN_TITLE, 0);
  holdCurrentKeys(menu, inputs);
}

// 두 사람 키를 합쳐 이번 틱에 새로 눌린 위·아래·치기를 구하고, 커서를 움직인다
function readMenuKeys(menu, inputs, itemCount) {
  const now = {
    up: inputs.some((input) => input.up),
    down: inputs.some((input) => input.down),
    hit: inputs.some((input) => input.hit),
  };
  const pressed = {
    up: now.up && !menu.prev.up,
    down: now.down && !menu.prev.down,
    hit: now.hit && !menu.prev.hit,
  };
  menu.prev = now;

  if (pressed.up) menu.cursor = (menu.cursor - 1 + itemCount) % itemCount;
  if (pressed.down) menu.cursor = (menu.cursor + 1) % itemCount;
  return pressed;
}

// 한 틱 메뉴 처리. 두 사람 키 모두로 조작할 수 있다.
// 경기를 시작하면 설정 { cpu: [1P가 CPU?, 2P가 CPU?], level, name }을 돌려주고, 아니면 null
export function updateMenu(menu, inputs, backPressed) {
  const items = MENU_SCREENS[menu.screen].items;
  const pressedHit = readMenuKeys(menu, inputs, items.length).hit;

  // 뒤로 가기
  if (backPressed) {
    if (menu.screen === SCREEN_SIDE) goTo(menu, SCREEN_TITLE, 0);
    if (menu.screen === SCREEN_LEVEL) goTo(menu, SCREEN_SIDE, menu.humanSide);
    return null;
  }
  if (!pressedHit) return null;

  const value = items[menu.cursor].value;
  switch (menu.screen) {
    case SCREEN_TITLE:
      if (value === MODE_TWO_PLAYERS) {
        return { cpu: [false, false], level: CONFIG.menu.defaultLevel, name: '2P PLAY' };
      }
      goTo(menu, SCREEN_SIDE, menu.humanSide);
      return null;

    case SCREEN_SIDE:
      menu.humanSide = value;
      goTo(menu, SCREEN_LEVEL, CONFIG.menu.defaultLevel);
      return null;

    case SCREEN_LEVEL: {
      const cpu = [menu.humanSide !== SIDE_LEFT, menu.humanSide !== SIDE_RIGHT];
      return { cpu, level: value, name: `1P vs CPU ${AI_LEVEL_NAMES[value]}` };
    }
  }
  return null;
}

// --- 경기 중 일시정지 메뉴 ---

export const PAUSE_CONTINUE = 'continue';
export const PAUSE_TO_MENU = 'menu';

export const PAUSE_ITEMS = [
  { label: 'CONTINUE', value: PAUSE_CONTINUE },
  { label: 'MENU', value: PAUSE_TO_MENU },
];

// 일시정지 메뉴 상태 (지금 누르고 있는 키는 새로 눌린 것으로 치지 않게 prev를 채워 둔다)
export function createPauseMenu(inputs) {
  const menu = { cursor: 0, prev: null };
  holdCurrentKeys(menu, inputs);
  return menu;
}

// 한 틱 일시정지 메뉴 처리. 고르면 PAUSE_CONTINUE 또는 PAUSE_TO_MENU, 아니면 null
// 일시정지 중 ESC를 다시 누르면 계속하기
export function updatePauseMenu(menu, inputs, backPressed) {
  const pressedHit = readMenuKeys(menu, inputs, PAUSE_ITEMS.length).hit;
  if (backPressed) return PAUSE_CONTINUE;
  if (pressedHit) return PAUSE_ITEMS[menu.cursor].value;
  return null;
}
