# Mesa MVP TODO

## 기능 명세

### API

```javascript
import { proxy, useSnapshot } from "mesa";

const state = proxy({ count: 0, user: { name: "John" } });

function Counter() {
  const count = useSnapshot(state.count);
  return <span onClick={() => state.count++}>{count}</span>;
}
```

### 동작 요구사항

1. `useSnapshot(state.count)` → `state.count` 값 반환
2. `state.count++` → 해당 값을 구독한 컴포넌트만 리렌더링
3. `state.user.name` 변경 → `state.count` 구독 컴포넌트는 리렌더링 안됨

## 개발 TODO

### 1. proxy() 함수

- [x] proxy() 테스트 케이스 작성
- [x] proxy() 함수 구현

### 2. useSnapshot() 훅

- [ ] useSnapshot() 테스트 케이스 작성
- [ ] useSnapshot() 훅 구현 (useSyncExternalStore 기반)

### 3. Fine-Grained 렌더링

- [ ] Fine-Grained 렌더링 테스트 케이스 작성
- [ ] Fine-Grained 렌더링 동작 구현

### 4. 중첩 객체 지원

- [ ] 중첩 객체 테스트 케이스 작성
- [ ] 중첩 객체 지원 구현

## 완료 조건

- [ ] 모든 테스트 통과
