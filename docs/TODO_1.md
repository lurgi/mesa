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

### 5. 성능 최적화

- [x] 경로별 구독 시스템 구현
- [x] 의존성 추적 메커니즘 구현
- [x] 동적 구독 업데이트 로직 구현
- [x] 구독자 실행 횟수 최적화 달성

### 6. 배열 지원

- [x] 배열 테스트 케이스 작성
- [x] 배열 메서드 지원 (push, pop, splice 등)
- [x] 배열 인덱스 추적 구현

### 7. 고급 최적화

- [x] 같은 값 설정 시 알림 방지
- [x] 조건부 selector 최적화
- [x] selector 실행 최적화

## 현재 상태

**구현 완료:**

- ✅ 모든 기본 기능 구현 완료
- ✅ 경로 기반 Fine-Grained 구독 구현
- ✅ 중첩 객체 및 배열 완전 지원
- ✅ 성능 최적화 구현 완료
- ✅ 54개 테스트 모두 통과

**문서화:**

- [x] selector 최적화 테스트 문서 작성
- [ ] API 레퍼런스 문서
- [ ] 사용법 가이드
- [ ] 성능 최적화 가이드

## 완료 조건

- [x] 모든 기본 테스트 통과
- [x] 효율적인 Fine-Grained 구독 구현
- [x] 성능 최적화 완료

## 향후 개선 사항

- [ ] 조건부 selector 동적 의존성 완전 지원
- [ ] 배열 변경 시 배치 업데이트 최적화
- [ ] 개발자 도구 제공
- [ ] TypeScript 타입 안전성 향상
