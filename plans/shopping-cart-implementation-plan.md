# Shopping Cart Implementation Plan

## 목표 (Objectives)

Mesa의 `useInitSync` API를 활용한 완전한 쇼핑카트 예제를 구현합니다. 이 예제는 다음을 시연합니다:

1. **useInitSync의 비동기 데이터 로딩**: API 호출을 통한 상품, 사용자, 카트 데이터 초기화
2. **Suspense 경계**: 로딩 상태 관리와 우아한 폴백 UI
3. **ErrorBoundary**: 초기화 및 런타임 에러 처리
4. **Multi-store 아키텍처**: 도메인별 분리된 상태 관리
5. **Mesa 배칭 시스템**: 원자적 상태 업데이트

## 기존 예제 분석 결과

### Counter 예제 패턴
- 단순한 `proxy()` 상태 관리
- `useStore()` 세분화된 구독
- 컴포넌트별 독립적 렌더링
- 렌더 카운팅을 통한 최적화 검증

### Todo-list 예제 패턴  
- 복합 상태 관리 (필터링, 검색, CRUD)
- 대시보드 스타일 UI 레이아웃
- 실시간 분석 및 통계
- 프로페셔널한 UI 컴포넌트

### useInitSync API 핵심 패턴
- **Throw + onError**: 에러는 자연스럽게 throw, `onError` 콜백에서 처리
- **배칭 시스템**: 초기화 중 모든 상태 변경은 원자적으로 적용
- **Mesa ErrorManager**: 내장 에러 관리 시스템 활용
- **Suspense 호환**: 비동기 초기화와 React Suspense 연동

## 쇼핑카트 아키텍처 설계

### 1. Multi-Store 구조

```typescript
// 상품 스토어 - 상품 목록 및 카테고리 관리
const productsStore = proxy({
  products: [],
  categories: [],
  loading: true,
  error: null,
});

// 사용자 스토어 - 인증 및 프로필 정보
const userStore = proxy({
  user: null,
  isAuthenticated: false,
  preferences: null,
  loading: true,
  error: null,
});

// 카트 스토어 - 장바구니 상태 및 계산
const cartStore = proxy({
  items: [],
  total: 0,
  discount: 0,
  itemCount: 0,
  loading: true,
  error: null,
});
```

### 2. useInitSync 초기화 패턴

```typescript
// ✅ Mesa 권장 패턴: throw + onError
function useProductsInitialization() {
  const { error } = useInitSync(productsStore, async (state) => {
    const data = await fetchProducts(); // 에러 시 자연스럽게 throw
    state.products = data.products;
    state.categories = data.categories;
    state.loading = false; // 최종 상태만 렌더링에 반영
  }, {
    onError: (error) => {
      console.error('Products initialization failed:', error);
      // Mesa ErrorManager가 자동으로 에러 상태 관리
    }
  });
}
```

### 3. Suspense 및 ErrorBoundary 구성

```tsx
export default function ShoppingCartPlayPage() {
  return (
    <ErrorBoundary fallback={<ErrorFallback />}>
      <Suspense fallback={<LoadingFallback />}>
        <ShoppingCartApp />
      </Suspense>
    </ErrorBoundary>
  );
}
```

## 구현 TODO List

### Phase 1: 기본 구조 설정
- [ ] **Multi-store 정의**: products, user, cart 스토어 생성
- [ ] **모크 API 함수**: fetchProducts, fetchUser, fetchCart 구현  
- [ ] **타입 정의**: Product, User, CartItem, Store 인터페이스
- [ ] **기본 레이아웃**: 헤더, 메인, 사이드바 구조

### Phase 2: useInitSync 통합
- [ ] **상품 초기화**: useInitSync로 상품 데이터 로딩
- [ ] **사용자 초기화**: 인증 상태 및 프로필 로딩
- [ ] **카트 초기화**: 기존 카트 데이터 복원 (localStorage/server)
- [ ] **의존성 관리**: user → cart 초기화 순서 보장

### Phase 3: UI 컴포넌트 구현
- [ ] **ProductGrid**: 상품 목록 및 카테고리 필터링
- [ ] **ProductCard**: 개별 상품 표시 및 카트 추가
- [ ] **ShoppingCart**: 카트 아이템 관리 및 수량 조절
- [ ] **CartSummary**: 합계 계산 및 체크아웃 버튼
- [ ] **UserProfile**: 로그인 상태 및 사용자 정보

### Phase 4: 에러 처리 및 폴백
- [ ] **ErrorBoundary**: 초기화 실패 시 에러 UI
- [ ] **Suspense 폴백**: 로딩 상태 스켈레톤 UI  
- [ ] **재시도 메커니즘**: 실패한 초기화 재실행
- [ ] **네트워크 에러 처리**: 연결 실패 시 대안 UI

### Phase 5: 고급 기능
- [ ] **실시간 카트 동기화**: localStorage 자동 저장
- [ ] **상품 검색 및 필터링**: 실시간 검색 결과
- [ ] **카트 분석**: 총 아이템 수, 총액, 할인 계산
- [ ] **반응형 레이아웃**: 모바일/데스크톱 최적화

### Phase 6: 성능 최적화 및 테스트
- [ ] **렌더링 최적화**: 불필요한 리렌더 방지 검증
- [ ] **메모리 사용량 측정**: 대용량 상품 데이터 처리
- [ ] **에러 시나리오 테스트**: 네트워크 실패, 타임아웃 등
- [ ] **접근성 개선**: 키보드 네비게이션, 스크린 리더 지원

## 컨벤션 및 스타일 가이드

### 1. 기존 예제와 동일한 패턴 적용
- **UI 컴포넌트**: shadcn/ui 라이브러리 사용
- **아이콘**: lucide-react 아이콘 세트
- **레이아웃**: Tailwind CSS 그리드 시스템
- **타입스크립트**: 완전한 타입 안정성

### 2. Mesa 특화 패턴
- **useStore 구독**: 세분화된 상태 구독으로 최적화
- **Proxy 상태 관리**: 직접적인 상태 변경으로 단순성 유지
- **배칭 활용**: 복합 상태 업데이트의 원자성 보장

### 3. 교육적 요소
- **콘솔 로깅**: 초기화 과정 및 상태 변경 추적
- **성능 지표**: 렌더링 횟수, 상태 업데이트 빈도 표시
- **인터랙티브 가이드**: Mesa 특징 설명 패널

## 성공 기준

### 기능적 요구사항
1. **완전한 쇼핑카트 플로우**: 상품 탐색 → 카트 추가 → 수량 조절 → 결제 준비
2. **견고한 에러 처리**: 모든 초기화 실패 시나리오 대응
3. **반응형 UI**: 다양한 화면 크기에서 최적화된 경험

### 기술적 요구사항  
1. **useInitSync 시연**: 3개 스토어의 올바른 비동기 초기화
2. **Suspense 통합**: React 18+ 동시성 모드 활용
3. **ErrorBoundary 활용**: 우아한 에러 복구 메커니즘

### 교육적 가치
1. **Mesa 패턴 학습**: 실제 애플리케이션에서의 Mesa 활용법
2. **성능 최적화**: 세분화된 리액티비티의 이점 체험
3. **모던 React 연동**: Suspense, ErrorBoundary와의 완벽한 통합

---

*이 문서는 구현 과정에서 지속적으로 업데이트되며, 각 단계 완료시 체크리스트를 갱신합니다.*