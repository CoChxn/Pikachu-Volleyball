// 시드 기반 난수 생성기 (xorshift32). 같은 시드면 어느 컴퓨터에서든 같은 순서로 나온다.
// 시드는 게임 상태(state.rngSeed)에 들어 있어 상태와 함께 저장·복원된다.

// 다음 난수 (0 이상 2^32 미만 정수). 13, 17, 5는 xorshift32 알고리즘의 고정 상수.
function nextRandom(state) {
  let x = state.rngSeed;
  x ^= x << 13;
  x ^= x >>> 17;
  x ^= x << 5;
  state.rngSeed = x >>> 0;
  return state.rngSeed;
}

// 0 이상 n 미만 정수
export function randomInt(state, n) {
  return nextRandom(state) % n;
}
