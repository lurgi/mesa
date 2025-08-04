# Mesa MVP TODO

## 기능 명세

### API

```javascript
import { proxy, useStore } from "mesa";

const state = proxy({ count: 0, user: { name: "John" } });

function Counter() {
  const count = useStore(state, (s) => s.count);
  return <span onClick={() => state.count++}>{count}</span>;
}
```

### 동작 요구사항

1. `useStore(state, s => s.count)` → `state.count` 값 반환
2. `state.count++` → 해당 값을 구독한 컴포넌트만 리렌더링
3. `state.user.name` 변경 → `state.count` 구독 컴포넌트는 리렌더링 안됨

## 개발 TODO

### 1. proxy() 함수

- [x] proxy() 테스트 케이스 작성
- [x] proxy() 함수 구현

### 2. useStore() 훅

- [x] useStore() 테스트 케이스 작성
- [x] useStore() 훅 구현 (useSyncExternalStore 기반)

### 3. Fine-Grained 렌더링

- [x] Fine-Grained 렌더링 테스트 케이스 작성
- [x] Fine-Grained 렌더링 동작 구현 (기본 - selector 결과 비교 방식)
- [x] 효율적인 Fine-Grained 렌더링 구현 (경로 기반 구독)

### 4. 중첩 객체 지원

- [x] 중첩 객체 테스트 케이스 작성
- [x] 중첩 객체 지원 구현

### 5. 성능 최적화 (향후 개선)

- [ ] 경로별 구독 시스템 구현
- [ ] 의존성 추적 메커니즘 구현
- [ ] 동적 구독 업데이트 로직 구현
- [ ] 구독자 실행 횟수 최적화 달성

## 현재 상태

**MVP 기능 완료:**

- ✅ 기본 Fine-Grained 렌더링 (결과 기반)
- ✅ 중첩 객체 지원
- ✅ 모든 기본 테스트 통과

**성능 이슈:**

- ⚠️ 모든 상태 변경 시 모든 구독자 실행
- ⚠️ 불필요한 selector 계산 발생
- ⚠️ 진정한 Fine-Grained 구독 미구현

## 완료 조건

- [x] 모든 기본 테스트 통과
- [ ] 효율적인 Fine-Grained 구독 구현 (성능 최적화)
