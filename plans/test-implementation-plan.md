# useInitSync 배치 업데이트 테스트 구현 계획

## 현재 상황 분석

### 문제 상황

- 배치 업데이트 시스템은 구현되었지만 아직 완전히 작동하지 않음
- Shopping Cart 테스트에서 여전히 28회 렌더링으로 무한 루프 발생
- `InitializationTracker`와 `proxy-handlers` 통합이 예상대로 작동하지 않음

### 디버깅 결과

```
=== 동기 함수 테스트 ===
✅ 단순 동기 useInitSync: 1회 렌더링 (배치 작동)
Final result: 0-0 (상태가 배치되어 최종 상태만 적용됨)

=== 비동기 함수 테스트 ===
❌ 복잡한 비동기 useInitSync: 28회 렌더링 (배치 미작동)
useInitSync 내부에서 LoadingManager.setLoading()이 배치 추적 전에 호출됨
```

## 근본 문제 분석

### 1. LoadingManager 선행 호출 문제

```typescript
// 현재 문제 있는 순서:
useInitSync → InitializerExecutor.executeAsync
           → LoadingManager.setLoading(store, true)  // 🚨 배치 추적 전 호출
           → 즉시 렌더링 트리거
           → markStoreAsInitializing (너무 늦음)
```

### 2. 비동기 함수 내 상태 변경 누적 문제

```typescript
// Shopping Cart 패턴:
async (state) => {
  state.loading = true;     // 변경 #1
  state.products = [...]    // 변경 #2
  state.cart = restored     // 변경 #3
  await fetchData()         // ← 여기서 Promise 완료 후
  state.products = real     // 변경 #4 (새로운 tick)
  state.loading = false     // 변경 #5 (새로운 tick)
}
```

### 3. 배치 범위 문제

- `markStoreAsInitializing()` 호출이 상태 변경 후에 일어남
- 비동기 함수에서 `await` 후 새로운 실행 컨텍스트로 인한 배치 해제

## 해결 전략

### 전략 1: LoadingManager 우회 (권장)

```typescript
// InitializerExecutor 수정하여 LoadingManager 우회
static async executeAsync<T extends object>(
  store: T,
  initializer: UseInitSyncInitializer<T>,
  onError?: (error: Error) => void,
  onSuccess?: (data: any) => void
): Promise<void> {
  // LoadingManager.setLoading(store, true); // 🚫 제거
  ErrorManager.clearError(store);

  try {
    // 사용자 함수만 실행, loading 상태는 사용자가 직접 관리
    let result: any;
    if (typeof initializer === "function") {
      result = initializer(store);
      if (result instanceof Promise) {
        result = await result;
      }
    } else {
      Object.assign(store, initializer as Partial<T>);
      result = store;
    }
    // LoadingManager.setLoading(store, false); // 🚫 제거
    onSuccess?.(result);
  } catch (error) {
    // LoadingManager.setLoading(store, false); // 🚫 제거
    const errorObj = error as Error;
    ErrorManager.setError(store, errorObj);
    onError?.(errorObj);
    throw errorObj;
  }
}
```

### 전략 2: 전역 배치 모드 활용

```typescript
// useInitSync에서 전역 배치 모드 사용
const execute = async () => {
  try {
    startGlobalBatch(); // 🔥 모든 알림 큐잉

    if (!suspense) {
      await InitializerExecutor.executeAsync(
        store,
        initializer,
        onError,
        onSuccess
      );
    } else {
      InitializerExecutor.executeSync(store, initializer, onError, onSuccess);
    }

    triggerUpdate();
  } catch (error) {
    triggerUpdate();
    if (errorBoundary) {
      throw error;
    }
  } finally {
    endGlobalBatch(); // 🔥 일괄 플러시
  }
};
```

## 구현 TODO List

### Phase 1: 근본 문제 해결 (High Priority)

#### 1.1 InitializerExecutor 수정

- [ ] **Task**: `LoadingManager.setLoading()` 호출 제거
- [ ] **File**: `src/useInitSync/initializer-executor.ts`
- [ ] **Goal**: 자동 loading 상태 관리 제거하여 사용자가 직접 제어
- [ ] **Test**: 동기/비동기 둘 다 1-2회 렌더링만 발생하는지 확인

#### 1.2 전역 배치 모드 적용

- [ ] **Task**: `useInitSync`에 전역 배치 모드 적용
- [ ] **File**: `src/useInitSync.ts`
- [ ] **Goal**: 모든 상태 변경을 강제로 배치 처리
- [ ] **Test**: Shopping Cart 28회 → 5회 미만으로 감소

#### 1.3 배치 범위 확장

- [ ] **Task**: `setTimeout(0)` 대신 `queueMicrotask()` 사용
- [ ] **File**: `src/core/initialization-tracker.ts`
- [ ] **Goal**: 비동기 함수의 전체 실행 범위를 커버
- [ ] **Test**: `await` 후 상태 변경도 배치되는지 확인

### Phase 2: 테스트 수정 및 검증 (High Priority)

#### 2.1 Shopping Cart 테스트 수정

- [ ] **Task**: Progressive Enhancement 중간 상태 검증 제거
- [ ] **File**: `tests/useInitSync/useInitSync.shopping-cart-reproduction.test.tsx`
- [ ] **Changes**:
  - [ ] 중간 로딩 상태 검증 제거
  - [ ] placeholder 상태 검증 제거
  - [ ] 최종 상태만 검증하도록 수정
  - [ ] 렌더링 횟수 기대값: 28+ → 5회 미만
- [ ] **Test**: 테스트 통과 및 성능 목표 달성

#### 2.2 기존 useInitSync 테스트 수정

- [ ] **Task**: Progressive Enhancement 의존성 제거
- [ ] **File**: `tests/useInitSync/useInitSync.test.tsx`
- [ ] **Changes**:
  - [ ] `lines 137-180`: 중간 상태 검증 → 최종 상태만 검증
  - [ ] `expect("placeholder")` 패턴 모두 제거
  - [ ] `await waitFor()` 패턴으로 최종 상태 대기
- [ ] **Test**: 14개 테스트 모두 통과

#### 2.3 Validation 테스트 수정

- [ ] **Task**: Loading 상태 중간 검증 제거
- [ ] **File**: `tests/useInitSync/useInitSync.validation.test.tsx`
- [ ] **Changes**:
  - [ ] `lines 185-186`: loading 중간 상태 체크 제거
  - [ ] `lines 404-405`: 동일한 패턴 수정
  - [ ] 최종 상태 도달까지 대기하는 패턴으로 변경
- [ ] **Test**: 모든 validation 테스트 통과

#### 2.4 새로운 배치 테스트 추가

- [ ] **Task**: 배치 동작 검증 테스트 추가
- [ ] **File**: `tests/useInitSync/useInitSync.batching.test.tsx` (신규)
- [ ] **Content**:
  - [ ] 다중 상태 변경 배치 테스트
  - [ ] 렌더링 횟수 검증 테스트
  - [ ] 중간 상태 노출 방지 테스트
  - [ ] 비동기 함수 배치 테스트
- [ ] **Test**: 새로운 배치 동작 완전 검증

### Phase 3: 호환성 검증 (Medium Priority)

#### 3.1 Suspense 테스트 호환성

- [ ] **Task**: Suspense 관련 테스트 동작 확인
- [ ] **File**: `tests/useInitSync/useInitSync.suspense.test.tsx`
- [ ] **Changes**: 수정 불필요 (기존 그대로 유지)
- [ ] **Test**: 모든 Suspense 테스트 통과 확인

#### 3.2 Error 테스트 호환성

- [ ] **Task**: 에러 처리 테스트 동작 확인
- [ ] **File**: `tests/useInitSync/useInitSync.errors.test.tsx`
- [ ] **Changes**: 최소한의 수정 (중간 상태 검증만 제거)
- [ ] **Test**: 에러 처리 로직 정상 동작 확인

#### 3.3 전체 테스트 스위트 실행

- [ ] **Task**: 모든 useInitSync 테스트 통합 실행
- [ ] **Command**: `npm test tests/useInitSync/`
- [ ] **Goal**: 모든 테스트 통과 및 성능 목표 달성
- [ ] **Metrics**:
  - [ ] 테스트 통과율: 100%
  - [ ] Shopping Cart 렌더링: < 5회
  - [ ] 기존 기능 호환성: 100%

### Phase 4: 성능 및 최적화 (Low Priority)

#### 4.1 배치 크기 제한

- [ ] **Task**: 큐 크기 제한 및 안전장치 추가
- [ ] **File**: `src/core/initialization-tracker.ts`
- [ ] **Changes**:
  - [ ] 최대 큐 크기 제한 (예: 1000개)
  - [ ] 큐 오버플로우 경고
  - [ ] 자동 플러시 메커니즘
- [ ] **Test**: 대용량 상태 변경 시 안정성 확인

#### 4.2 디버깅 도구 추가

- [ ] **Task**: 개발 모드 디버깅 기능
- [ ] **File**: `src/core/initialization-tracker.ts`
- [ ] **Changes**:
  - [ ] 배치 상태 시각화
  - [ ] 렌더링 횟수 추적
  - [ ] 성능 경고 메시지
- [ ] **Test**: 개발 환경에서 유용한 정보 제공

#### 4.3 메모리 최적화

- [ ] **Task**: WeakMap/WeakSet 사용 최적화
- [ ] **File**: `src/core/initialization-tracker.ts`
- [ ] **Changes**:
  - [ ] 불필요한 참조 정리
  - [ ] 가비지 컬렉션 친화적 구조
- [ ] **Test**: 메모리 누수 없이 동작 확인

## 세부 구현 가이드

### InitializerExecutor 수정 예시

```typescript
// Before: 자동 loading 관리
LoadingManager.setLoading(store, true);
// ... user code ...
LoadingManager.setLoading(store, false);

// After: 사용자 직접 관리
// LoadingManager 호출 제거
// 사용자가 직접 state.loading을 제어
```

### 배치 테스트 예시

```typescript
test("should batch multiple state changes", async () => {
  let renderCount = 0;

  function TestComponent() {
    renderCount++;
    useInitSync(store, async (state) => {
      state.a = 1;
      state.b = 2;
      await delay(10);
      state.c = 3;
      state.d = 4;
    });

    const data = useStore(store, (s) => s);
    return <div data-testid="result">{JSON.stringify(data)}</div>;
  }

  render(<TestComponent />);

  await waitFor(() => {
    expect(screen.getByTestId("result")).toHaveTextContent(
      '{"a":1,"b":2,"c":3,"d":4}'
    );
  });

  expect(renderCount).toBeLessThan(5); // 핵심: 렌더링 횟수 제한
});
```

### Shopping Cart 테스트 수정 예시

```typescript
// Before: 중간 상태 검증
expect(screen.getByTestId("status")).toHaveTextContent("placeholder");
expect(screen.getByTestId("loading")).toHaveTextContent("loading");

// After: 최종 상태만 검증
await waitFor(() => {
  expect(screen.getByTestId("shopping-app")).toBeInTheDocument();
  expect(screen.getByTestId("stats")).toHaveTextContent(
    "Products loaded: 3 | Cart items: 1"
  );
});

expect(renderCounts.main).toBeLessThan(5); // 핵심: 성능 목표
```

## 성공 기준

### 성능 목표

- **Shopping Cart 렌더링**: 28+ → 5회 미만
- **일반 useInitSync 렌더링**: 15+ → 3회 미만
- **메모리 사용**: 현재 대비 증가 없음

### 기능 목표

- **API 호환성**: 100% 유지
- **테스트 통과율**: 100%
- **에러 처리**: 기존과 동일
- **Suspense 지원**: 기존과 동일

### 개발자 경험 목표

- **디버깅 정보**: 배치 상태 가시성
- **성능 경고**: 과도한 렌더링 감지
- **문서화**: 새로운 동작 방식 설명

## 위험 요소 및 대응책

### 위험 요소 1: 기존 코드 호환성

- **위험**: LoadingManager 제거로 인한 breaking change
- **대응**: 단계적 적용 및 fallback 옵션 제공

### 위험 요소 2: 비동기 함수 복잡성

- **위험**: Promise chain에서 배치 범위 해제
- **대응**: 전역 배치 모드로 강제 제어

### 위험 요소 3: 성능 회귀

- **위험**: 배치 시스템 오버헤드
- **대응**: 마이크로벤치마크 및 실제 앱 테스트

## 일정 및 우선순위

### 1주차: 핵심 문제 해결

- InitializerExecutor 수정
- 전역 배치 모드 구현
- Shopping Cart 테스트 통과

### 2주차: 테스트 전면 수정

- 모든 기존 테스트 수정
- 새로운 배치 테스트 추가
- 호환성 검증

### 3주차: 최적화 및 마무리

- 성능 튜닝
- 디버깅 도구 추가
- 문서화 완성

## 결론

현재 배치 시스템의 핵심 문제는 **LoadingManager의 선행 호출**과 **비동기 함수의 배치 범위 문제**입니다. 이를 해결하기 위해:

1. **LoadingManager 우회**: 사용자가 직접 loading 상태 제어
2. **전역 배치 모드**: 강제 배치 처리로 모든 상태 변경 큐잉
3. **테스트 수정**: Progressive Enhancement 의존성 제거

이 계획을 통해 useInitSync의 무한 렌더링 문제를 근본적으로 해결하고, 성능을 크게 개선할 수 있습니다.
