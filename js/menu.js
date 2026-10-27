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

// 한 틱 메뉴 처리. 두 사람 키 모두로 조작할 수 있다.
// 경기를 시작하면 설정 { cpu: [1P가 CPU?, 2P가 CPU?], level, name }을 돌려주고, 아니면 null
export function updateMenu(menu, inputs, backPressed) {
  const now = {
    up: inputs.some((input) => input.up),
    down: inputs.some((input) => input.down),
    hit: inputs.some((input) => input.hit),
  };
  const pressedUp = now.up && !menu.prev.up;
  const pressedDown = now.down && !menu.prev.down;
  const pressedHit = now.hit && !menu.prev.hit;
  menu.prev = now;

  const items = MENU_SCREENS[menu.screen].items;
  if (pressedUp) menu.cursor = (menu.cursor - 1 + items.length) % items.length;
  if (pressedDown) menu.cursor = (menu.cursor + 1) % items.length;

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
