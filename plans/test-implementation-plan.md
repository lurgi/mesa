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

### Phase 1: 테스트 주도 개발(TDD)을 위한 테스트 수정 (High Priority)

#### 1.1 Shopping Cart 테스트 수정 (Red 단계)

- [x] **Task**: 원하는 최종 동작(5회 미만 렌더링)을 명시하도록 테스트를 먼저 수정합니다.
- [x] **File**: `tests/useInitSync/useInitSync.shopping-cart-reproduction.test.tsx`
- [x] **Changes**:
  - [x] 중간 로딩 상태 및 플레이스홀더 상태 검증 로직을 **제거**합니다.
  - [x] **최종 상태만 검증**하도록 단언(assertion)을 수정합니다.
  - [x] 렌더링 횟수 기대값을 `28+`에서 **`5`회 미만**으로 변경합니다.
- [x] **Goal**: 이 테스트를 실행하면 **실패**해야 합니다. 이것이 TDD의 'Red' 단계입니다.

#### 1.2 기존 useInitSync 테스트 수정

- [x] **Task**: 점진적 향상(Progressive Enhancement) 의존성을 제거하고 최종 상태만 검증하도록 변경합니다.
- [x] **File**: `tests/useInitSync/useInitSync.test.tsx`
- [x] **Changes**:
  - [x] `lines 137-180`: 중간 상태 검증을 최종 상태 검증으로 변경합니다.
  - [x] `expect("placeholder")`와 같은 중간 과정을 확인하는 패턴을 모두 제거합니다.
  - [x] `await waitFor()`를 사용해 최종 상태에 도달할 때까지 기다리는 패턴을 적용합니다.
- [x] **Goal**: 수정된 테스트들이 Phase 2의 구현이 완료되기 전까지 실패 상태로 남아있게 합니다.

#### 1.3 Validation 테스트 수정

- [x] **Task**: Loading 상태의 중간 검증 로직을 제거합니다.
- [x] **File**: `tests/useInitSync/useInitSync.validation.test.tsx`
- [x] **Changes**:
  - [x] `lines 192`, `lines 396`: 중간 로딩 상태 체크를 제거합니다.
  - [x] 최종 상태 도달을 기다리는 패턴으로 변경합니다.
- [x] **Goal**: 다른 테스트와 마찬가지로, 구현 완료 전까지 실패 상태를 유지합니다.

#### 1.4 새로운 배치 테스트 추가

- [x] **Task**: 새로운 배치 동작을 명세하는 테스트를 추가합니다.
- [x] **File**: `tests/useInitSync/useInitSync.batching.test.tsx` (신규)
- [x] **Content**:
  - [x] 다중 상태 변경이 하나의 렌더링으로 처리되는지 검증하는 테스트
  - [x] 렌더링 횟수를 정확히 검증하는 테스트 (< 3~5회)
  - [x] 비동기 함수(`await` 포함) 내의 모든 변경이 배치 처리되는지 검증하는 테스트
  - [x] 성능 엣지 케이스 테스트 (급속 상태 변경, 중첩 객체 업데이트)
- [x] **Goal**: 새로운 기능의 요구사항을 코드로 정의하고, 초기에는 이 테스트들이 실패하게 만듭니다.

### Phase 2: 테스트 통과를 위한 핵심 로직 구현 (Green 단계) (High Priority)

#### 2.1 InitializerExecutor 수정

- [ ] **Task**: `LoadingManager.setLoading()` 호출을 제거하여 불필요한 렌더링 유발을 막습니다.
- [ ] **File**: `src/useInitSync/initializer-executor.ts`
- [ ] **Goal**: 자동 loading 상태 관리를 제거하고, 사용자가 직접 제어하도록 만듭니다.
- [ ] **Test**: 이 변경 후 Phase 1에서 수정한 테스트들이 점차 통과하기 시작해야 합니다.

#### 2.2 전역 배치 모드 적용

- [ ] **Task**: `useInitSync`에 전역 배치 모드를 적용하여 모든 상태 변경을 강제로 일괄 처리합니다.
- [ ] **File**: `src/useInitSync.ts`
- [ ] **Goal**: `await` 이후의 상태 변경을 포함한 모든 변경이 단일 배치로 처리되도록 보장합니다.
- [ ] **Test**: Shopping Cart 테스트의 렌더링 횟수가 `5`회 미만으로 줄어들고 테스트가 통과해야 합니다.

#### 2.3 배치 범위 확장

- [ ] **Task**: `setTimeout(0)` 대신 `queueMicrotask()`를 사용하여 비동기 함수의 전체 실행 범위를 하나의 태스크로 묶습니다.
- [ ] **File**: `src/core/initialization-tracker.ts` (또는 관련 배치 처리 파일)
- [ ] **Goal**: 비동기 함수의 전체 실행 컨텍스트를 커버하여 배치 범위를 확장합니다.
- [ ] **Test**: `await` 이후의 상태 변경도 배치 처리되어 Phase 1의 테스트들이 모두 통과해야 합니다.

### Phase 3: 호환성 검증 (Medium Priority)

#### 3.1 Suspense 테스트 호환성

- [ ] **Task**: Suspense 관련 테스트가 여전히 잘 동작하는지 확인합니다.
- [ ] **File**: `tests/useInitSync/useInitSync.suspense.test.tsx`
- [ ] **Changes**: 수정 불필요 (기존 그대로 유지)
- [ ] **Test**: 모든 Suspense 테스트 통과 확인

#### 3.2 Error 테스트 호환성

- [ ] **Task**: 에러 처리 테스트가 여전히 잘 동작하는지 확인합니다.
- [ ] **File**: `tests/useInitSync/useInitSync.errors.test.tsx`
- [ ] **Changes**: 최소한의 수정 (중간 상태 검증만 제거)
- [ ] **Test**: 에러 처리 로직 정상 동작 확인

#### 3.3 전체 테스트 스위트 실행

- [ ] **Task**: 모든 useInitSync 관련 테스트를 통합 실행합니다.
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

### 1주차: 테스트 수정 및 신규 작성 (TDD Red)

- Shopping Cart 테스트를 포함한 기존 테스트를 **실패하도록** 수정
- 새로운 배치 동작을 검증하는 신규 테스트 작성

### 2주차: 핵심 로직 구현 및 테스트 통과 (TDD Green)

- InitializerExecutor 수정 및 전역 배치 모드 구현
- 수정/작성된 모든 테스트가 통과하도록 코드 수정

### 3주차: 리팩토링, 최적화 및 마무리

- 코드 리팩토링
- 성능 튜닝 및 디버깅 도구 추가
- 문서화 완성

## 결론

현재 배치 시스템의 문제를 **테스트 주도 개발(TDD)** 방식으로 해결합니다.

1.  **테스트 우선 수정/작성 (Red)**: 먼저, 원하는 최종 동작(단일 렌더링, 최종 상태만 검증)을 정의하도록 기존 테스트를 수정하고 신규 테스트를 작성합니다. 이 테스트들은 처음에는 실패해야 합니다.
2.  **핵심 로직 구현 (Green)**: `LoadingManager` 우회 및 전역 배치 모드 도입을 통해 실패하던 테스트들을 모두 통과시킵니다.
3.  **리팩토링**: 이후 코드를 정리하고 최적화합니다.

이 계획을 통해 useInitSync의 무한 렌더링 문제를 근본적으로 해결하고, 더 견고하고 예측 가능한 코드를 만들 수 있습니다.
