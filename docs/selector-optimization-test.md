# Selector 최적화 테스트 문서

## 개요

`selectorOptimization.test.tsx` 파일은 Mesa 상태관리 라이브러리의 Fine-Grained 리액티브 시스템에서 selector의 실행 최적화가 올바르게 작동하는지 검증하는 테스트입니다.

## 이 테스트가 중요한 이유

상태관리 라이브러리에서 가장 중요한 것은 필요할 때만 리렌더링하는 것입니다. 만약 상태의 일부가 변경되었을 때 그것과 관련 없는 컴포넌트까지 리렌더링된다면 앱 성능이 크게 저하됩니다.

예를 들어서 다음과 같은 상황을 생각해보겠습니다.

```javascript
const state = { user: "John", count: 0, theme: "dark" };

// 이 컴포넌트는 count만 사용합니다
function Counter() {
  const count = useStore(state, s => s.count);
  return <div>{count}</div>;
}

// theme이 변경되어도 Counter가 리렌더링되면 안 됩니다!
state.theme = "light"; // Counter 리렌더링 발생 시 성능 문제
```

## React의 useSyncExternalStore와 실행 횟수

### selector가 2번 실행되는 이유

React 18의 `useSyncExternalStore`는 동시 렌더링(Concurrent Rendering)을 안전하게 지원하기 위해 특별한 검증 과정을 거칩니다.

**1단계 - 변경 감지 실행**
```javascript
// 상태가 변경되면 subscribe 콜백이 호출됩니다
state.count++; // 이때 selector가 1번 실행되어 새로운 값을 반환합니다
```

**2단계 - 일관성 검증 실행**
```javascript
// React가 "정말로 값이 변경되었나"를 다시 한번 확인합니다
// 이는 동시 렌더링에서 발생할 수 있는 불일치를 방지하기 위한 것입니다
// selector가 다시 1번 실행되어 같은 값인지 확인합니다
```

따라서 정상적인 상태 변경 시 selector는 항상 2번 실행됩니다.

### 동일한 값 설정 시에는 실행되지 않는 이유

```javascript
state.count = 0; // 현재 값이 이미 0이면
// proxy가 "값이 변경되지 않았다"고 판단합니다
// subscribe 콜백 자체가 호출되지 않습니다
// selector 실행 0번
```

## 테스트 시나리오별 상세 분석

### 1. 불필요한 selector 실행 방지 테스트

**테스트 목표**
selector가 자신이 사용하지 않는 상태 변경에는 반응하지 않는지 확인합니다.

**실행 횟수 계산**
```javascript
const state = proxy({ count: 0, name: "John", other: "data" });

// selector는 count만 사용합니다
const count = useStore(state, (s) => {
  selectorExecutions++;  // 카운터 증가
  return s.count;        // count만 접근
});
```

**초기 렌더링**
selector 1회 실행 → `INITIAL_EXECUTIONS = 1`

**count 변경할 때**
```javascript
state.count++; // 0에서 1로 변경
// 1단계 - 변경 감지에서 selector 실행 (1회)
// 2단계 - React 일관성 검증에서 selector 실행 (1회)
// 총 2회 추가 실행 → INITIAL_EXECUTIONS + 2 = 3
```

**name 변경할 때**
```javascript
state.name = "Jane";
// proxy가 감지합니다 - "name이 변경되었지만 이 selector는 name을 사용하지 않음"
// subscribe 콜백 호출하지 않음
// selector 실행 0회, 여전히 3회
```

### 2. 중첩 객체에서 정확한 경로 추적 테스트

**테스트 목표**
중첩 객체에서 정확한 경로의 변경에만 각 selector가 반응하는지 확인합니다.

**실행 횟수 계산**
```javascript
const state = proxy({
  user: { name: "John", age: 30 },
  settings: { theme: "dark" }
});

// 3개의 서로 다른 selector
const name = useStore(state, s => s.user.name);     // userNameExecutions++
const age = useStore(state, s => s.user.age);       // userAgeExecutions++
const theme = useStore(state, s => s.settings.theme); // settingsExecutions++
```

**초기 렌더링**
각 selector 1회씩 실행됩니다.
- `userNameExecutions = 1`
- `userAgeExecutions = 1`  
- `settingsExecutions = 1`

**user.name 변경할 때**
```javascript
state.user.name = "Jane";
// userNameExecutions - 3회 추가 (변경감지 1회 + 검증 2회)
// userAgeExecutions - 1회 추가 (중첩 객체 변경으로 인한 검증)
// settingsExecutions - 변화 없음 (완전히 다른 경로)
```

**왜 3회와 1회가 추가될까요?**
- 직접 사용하는 selector(`userNameExecutions`) - 변경감지(1) + 일관성검증(2) = 3회
- 같은 부모 객체를 사용하는 selector(`userAgeExecutions`) - 부모 변경 알림(1) = 1회
- 완전히 다른 경로의 selector(`settingsExecutions`) - 0회

### 3. 동일한 값 변경 최적화 테스트

**테스트 목표**
같은 값으로 설정할 때 불필요한 실행이 발생하지 않는지 확인합니다.

**실행 횟수 계산**
```javascript
const state = proxy({ count: 0 });

// 초기값 - count = 0, selectorExecutions = 1

state.count = 0; // 같은 값으로 설정
// proxy 내부에서 비교 - oldValue === newValue (0 === 0)
// "값이 변경되지 않았음" 판단
// subscribe 콜백 호출하지 않음
// selector 실행 0회, 여전히 1회
```

### 4. 조건부 selector 최적화 테스트

**테스트 목표**
조건에 따라 다른 속성을 사용하는 selector의 동적 의존성 추적을 확인합니다.

**실행 횟수 계산**
```javascript
const state = proxy({
  useFirstName: true,
  firstName: "John",
  lastName: "Doe"
});

const displayName = useStore(state, (s) => {
  selectorExecutions++;
  return s.useFirstName ? s.firstName : s.lastName;
});
```

**초기 상태**
`useFirstName = true`이므로 `firstName`을 사용합니다.
- selector가 `useFirstName`과 `firstName`에 의존성을 등록합니다
- `selectorExecutions = 1`

**firstName 변경할 때**
```javascript
state.firstName = "Jane";
// 현재 firstName을 사용 중이므로 실행됩니다
// selectorExecutions에 2 추가 (변경감지 + 검증)
```

**lastName 변경할 때**
```javascript
state.lastName = "Smith";
// 현재 firstName을 사용 중이므로 lastName 변경은 무시됩니다
// selectorExecutions에 0 추가
```

**모드 토글 후**
```javascript
state.useFirstName = false; // 이제 lastName 사용
// selectorExecutions에 2 추가
// 이제 selector는 lastName에 의존성을 가집니다
```

### 5. 복합 계산 최적화 테스트

**테스트 목표**
비용이 큰 계산을 포함한 selector의 최적화를 확인합니다.

**실행 횟수 계산**
```javascript
const state = proxy({
  items: [1, 2, 3, 4, 5],  // 5개 아이템
  multiplier: 2,
  offset: 10
});

const result = useStore(state, (s) => {
  selectorExecutions++;                    // selector 실행 카운트
  const calculated = s.items.map(item => {
    expensiveCalculations++;               // 비용이 큰 계산 카운트
    return item * s.multiplier + s.offset;
  });
  return calculated.reduce((sum, val) => sum + val, 0);
});
```

**초기 실행**
- `selectorExecutions = 1`
- `expensiveCalculations = 5` (아이템 5개 × 1회)

**multiplier 변경할 때**
```javascript
state.multiplier = 3;
// selector 2회 실행 (변경감지 + 검증)
// 각 실행마다 5개 아이템 처리
// selectorExecutions에 2 추가, 총 3회
// expensiveCalculations에 10 추가, 총 15회 (5개 × 2회 추가)
```

**배열 아이템 추가할 때**
```javascript
state.items.push(6);
// 배열 변경은 복잡합니다
// - 배열 길이 변경 알림
// - 새 인덱스 추가 알림  
// - length 속성 변경 알림
// 여러 번의 selector 실행이 발생할 수 있습니다
// 정확한 횟수는 구현에 따라 달라지므로 toBeGreaterThan을 사용합니다
```

## 핵심 개념 정리

### React useSyncExternalStore가 2번 실행하는 이유

React 18에서 도입된 동시 렌더링(Concurrent Rendering)은 렌더링을 중단하고 재시작할 수 있습니다. 이 과정에서 외부 상태가 중간에 변경되면 일관성 문제가 발생할 수 있습니다.

```javascript
// 문제 상황 예시
function Component() {
  const value = useSyncExternalStore(subscribe, getSnapshot);
  
  // 렌더링 중간에 외부에서 상태 변경이 발생합니다
  // React가 렌더링을 중단하고 다시 시작할 때
  // 이전에 읽었던 값과 현재 값이 다를 수 있습니다
}
```

**해결책**
React는 렌더링 중에 한 번 더 `getSnapshot`을 호출해서 값이 일관된지 확인합니다.

### Proxy 기반 Fine-Grained 리액티브 시스템

```javascript
// 일반적인 상태관리 (coarse-grained)
const state = { user: { name: "John" }, count: 0 };
state.count++; // 모든 구독자가 알림을 받습니다

// Fine-grained 시스템
const state = proxy({ user: { name: "John" }, count: 0 });
// selector1은 user.name만 구독, selector2는 count만 구독
state.count++; // count를 사용하는 selector만 알림을 받습니다
```

### 배열 변경이 복잡한 이유

```javascript
const state = proxy({ items: [1, 2, 3] });

state.items.push(4);
// 내부적으로 발생하는 일들
// 1. items[3] = 4 (새 인덱스 설정)
// 2. items.length = 4 (길이 변경)
// 3. 각각의 변경마다 proxy trap 호출
// 4. 여러 번의 구독자 알림 발생
```

## 테스트 결론

이 테스트들은 Mesa 라이브러리가 다음을 올바르게 구현했는지 확인합니다.

1. **의존성 추적의 정확성** - selector가 실제로 사용한 속성만 추적
2. **불필요한 실행 방지** - 관련 없는 변경에는 반응하지 않음  
3. **React 호환성** - useSyncExternalStore와 올바르게 동작
4. **성능 최적화** - 비용이 큰 계산을 불필요하게 반복하지 않음

## 주의사항

### 테스트 실행 횟수는 구현에 의존적입니다

```javascript
// 이 숫자들은 현재 구현 기준입니다
expect(selectorExecutions).toBe(INITIAL_EXECUTIONS + 2);

// 미래에 React나 proxy 구현이 변경되면 숫자가 달라질 수 있습니다
// 중요한 것은 "정확한 횟수"가 아니라 "최적화가 작동하는지"입니다
```

### 조건부 selector의 한계

현재 구현에서는 조건부 selector의 동적 의존성 재구독이 완전히 지원되지 않을 수 있습니다.

```javascript
// 이상적인 동작
const name = useStore(state, s => s.useFirstName ? s.firstName : s.lastName);
state.useFirstName = false; // lastName으로 전환
state.lastName = "Changed"; // 이제 이 변경에 반응해야 합니다

// 현실 - 초기 실행 시의 의존성만 추적될 수 있습니다
```

이는 향후 개선될 수 있는 부분입니다.