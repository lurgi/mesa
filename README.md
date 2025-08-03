# Mesa

> Client-First React 상태관리: Proxy 기반 Fine-Grained 렌더링에 집중한 새로운 접근

⚠️ **개발 중**: Mesa는 현재 개발 초기 단계입니다.

## 왜 Mesa를 만들게 되었나?

### 기존 상태관리의 아쉬운 점들

React 상태관리 생태계는 이미 성숙했지만, 여전히 개선할 여지가 있다고 생각했습니다.

**복잡한 성능 최적화**
대부분의 라이브러리에서 Fine-Grained 렌더링을 위해서는 개발자가 신경써야 할 것들이 많습니다.

- 정확한 selector 작성 (Zustand, Redux)
- atom 단위 설계 부담 (Jotai)
- useMemo, useCallback 활용
- React.memo 적용

**SSR 지원의 복잡성**
기존 라이브러리들은 SSR 지원을 위해 복잡한 구조를 가지고 있습니다.

- 조건부 렌더링 로직
- 서버/클라이언트 동기화
- hydration 패턴 관리

**API 일관성 부족**

```javascript
// 상태 읽기와 쓰기가 다른 방식
const snap = useSnapshot(state); // 읽기
state.count++; // 쓰기
```

## Mesa의 설계 철학

### 1. 극도로 단순한 사용법

**목표**: 일반 JavaScript 객체처럼 사용하되 자동으로 최적화

```javascript
// 이상적인 Mesa 사용법 (구상 중)
const state = mesa({
  count: 0,
  user: { name: "John", age: 30 },
});

function Counter() {
  return (
    <div>
      {state.count} {/* 자동 Fine-Grained 렌더링 */}
      <button onClick={() => state.count++}>+1</button>
    </div>
  );
}
```

### 2. SSR 포기, 클라이언트 최적화 집중

**현대 웹 개발의 변화**

- React 19의 `use` 훅으로 서버 상태 관리
- TanStack Query, SWR 같은 전문 도구들
- SPA + API 패턴의 대중화

**Mesa의 선택**
SSR을 과감히 포기하고 클라이언트 전용 최적화에만 집중합니다.

- 복잡한 hydration 로직 불필요
- 브라우저 전용 API 자유롭게 활용
- 더 빠른 초기화와 메모리 효율성

### 3. useSyncExternalStore + Proxy 조합

**기술적 기반**

- Proxy API로 상태 변경 자동 감지
- useSyncExternalStore로 React 18+ 동시성 완벽 지원
- Fine-Grained 렌더링 자동화

## 기존 라이브러리 대비 Mesa의 방향

### 주요 라이브러리들과의 비교

| 라이브러리  | 렌더링 최적화    | 동시성 지원  | 사용 복잡도    | SSR 지원       |
| ----------- | ---------------- | ------------ | -------------- | -------------- |
| Context API | ❌ 전체 리렌더링 | ✅ 완전 지원 | ✅ 간단        | ✅ 지원        |
| Redux       | ⚠️ 수동 selector | ✅ 완전 지원 | ❌ 복잡        | ✅ 지원        |
| Zustand     | ⚠️ 수동 selector | ✅ 완전 지원 | ⚠️ 보통        | ✅ 지원        |
| Jotai       | ✅ 자동 최적화   | ✅ 완전 지원 | ⚠️ 보통        | ✅ 지원        |
| Valtio      | ✅ 자동 최적화   | ✅ 완전 지원 | ✅ 간단        | ✅ 지원        |
| **Mesa**    | ✅ 자동 최적화   | ✅ 완전 지원 | ✅ 간단 (목표) | ❌ 의도적 포기 |

### Valtio와의 차이점

Valtio는 뛰어난 Proxy 기반 상태관리 라이브러리입니다. Mesa는 여기서 영감을 받되 다른 접근을 시도합니다.

| 측면            | Valtio        | Mesa                 |
| --------------- | ------------- | -------------------- |
| **SSR 지원**    | 완전 지원     | 의도적 포기          |
| **API 복잡도**  | snapshot 분리 | 더 투명한 접근       |
| **대상 사용자** | 범용적        | 클라이언트 전용 특화 |
| **학습 곡선**   | 낮음          | 더 낮게 (목표)       |

## 적합한 사용 사례

### Mesa가 적합한 프로젝트

- **SPA 중심 애플리케이션**
- **클라이언트 상호작용이 많은 앱**
- **성능 최적화가 중요한 프로젝트**
- **React 18+ 환경**

### 다른 선택이 나은 경우

- **SSR이 필수인 프로젝트** → Valtio, Jotai
- **기존 Redux 생태계 활용** → Redux Toolkit
- **간단한 상태만 필요** → Context API
- **검증된 안정성 우선** → Zustand

## 하이브리드 사용 패턴

SSR 프로젝트에서도 Mesa를 부분적으로 활용할 수 있습니다.

```javascript
// 초기 데이터는 SSR
export async function getServerSideProps() {
  return { props: { initialData } };
}

// 클라이언트 상호작용은 Mesa
function Page({ initialData }) {
  const { data: latestData } = useQuery(["data"], fetchData);

  useEffect(() => {
    if (latestData) {
      appState.hydrate(latestData);
    }
  }, [latestData]);

  return <InteractiveApp />;
}
```

## 현재 상태

Mesa는 개발 초기 단계로, 아직 프로덕션 사용을 권장하지 않습니다.

**현재 진행 중인 작업:**

- 핵심 아키텍처 설계
- Proxy 트랩 메서드 구현
- React 통합 패턴 실험

**향후 계획:**

- 알파 버전 출시
- 커뮤니티 피드백 수집
- 안정성 개선

---

Mesa는 기존 훌륭한 라이브러리들에서 영감을 받아 클라이언트 중심의 새로운 접근을 시도하는 프로젝트입니다.
