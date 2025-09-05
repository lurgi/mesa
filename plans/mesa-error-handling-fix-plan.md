# Mesa Error Handling Fix Plan

## 목표 (Objectives)

1. **구현과 일치하는 API 문서 작성**: useInitSync 문서를 실제 구현(throw + onError 패턴)과 일치하도록 수정
2. **Shopping-cart 예제 구현**: 수정된 문서를 바탕으로 올바른 패턴으로 shopping-cart 페이지 재구현

## 핵심 원칙 (Core Principles)

### 📋 문서화 기준
1. **실제 구현 기준**: Mesa 소스코드 (`src/useInitSync/initializer-executor.ts`, `src/useInitSync.ts`) 동작 방식을 정확히 반영
2. **테스트 코드 기준**: `tests/useInitSync/useInitSync.errors.test.tsx` 패턴을 문서 예제로 사용
3. **배칭 시스템 준수**: `src/core/batch-manager.ts`의 startGlobalBatch/endGlobalBatch 메커니즘 고려

### 🚫 금지 패턴 (Mesa 구현과 충돌)
```jsx
// ❌ 문서에서 제거해야 할 패턴
useInitSync(store, async (state) => {
  try {
    const data = await fetchData();
    state.data = data;
  } catch (error) {
    state.error = error.message; // 무한루프 유발
  }
});
```

### ✅ 권장 패턴 (Mesa 테스트와 일치)
```jsx
// ✅ 문서에서 사용해야 할 패턴  
useInitSync(store, async (state) => {
  const data = await fetchData(); // 에러 발생 시 자연스럽게 throw
  state.data = data;
}, {
  onError: (error) => {
    // Mesa의 ErrorManager가 처리하는 방식
    console.error('Initialization failed:', error);
  }
});
```

## 실행 계획 (Implementation Plan)

### Phase 1: API 문서 수정 (Based on Mesa Implementation)
- [x] `/landing/contents/docs/api/useInitSync/index.mdx` 수정 ✅
  - [x] **Mesa 테스트 패턴 분석**: `tests/useInitSync/useInitSync.errors.test.tsx` 모든 에러 테스트 패턴 검토 ✅
  - [x] **실제 구현 반영**: `src/useInitSync/initializer-executor.ts`의 executeAsync 에러 처리 방식 문서화 ✅
  - [x] **배칭 시스템 설명**: Mesa의 startGlobalBatch/endGlobalBatch가 에러 처리에 미치는 영향 설명 ✅
  - [x] **모든 try-catch 예제 교체**: 테스트에서 검증된 throw + onError 패턴으로 변경 ✅
  - [x] **ErrorManager 활용법**: Mesa 내장 에러 관리 시스템 사용 방법 문서화 ✅

### Phase 2: Shopping-cart 예제 수정 (Test-Driven)
- [ ] `/landing/app/examples/play/shopping-cart/page.tsx` 수정
  - [ ] **테스트 패턴 적용**: `useInitSync.errors.test.tsx`와 동일한 에러 처리 방식 적용
  - [ ] **배칭 준수**: 모든 상태 변경이 Mesa 배칭 시스템과 호환되도록 구현
  - [ ] **ErrorManager 연동**: Mesa의 내장 에러 관리 시스템 활용
  - [ ] **실제 구현 검증**: 수정된 코드가 Mesa 테스트 코드와 동일한 패턴인지 확인

### Phase 3: 구현 일치성 검증
- [ ] **테스트 코드와 비교**: 수정된 예제가 Mesa 테스트와 동일한 패턴 사용하는지 검증
- [ ] **배칭 시스템 테스트**: startGlobalBatch/endGlobalBatch가 올바르게 작동하는지 확인  
- [ ] **ErrorManager 동작 검증**: Mesa의 에러 관리가 예상대로 작동하는지 테스트
- [ ] **무한루프 해결 확인**: "Maximum update depth exceeded" 에러 완전 제거 검증

## 검증 기준 (Validation Criteria)

### ✅ 성공 기준
1. **문서 예제 = 테스트 코드**: 모든 문서 예제가 Mesa 테스트 코드와 동일한 패턴 사용
2. **실제 구현 반영**: 문서가 Mesa 소스코드의 실제 동작 방식 정확히 설명
3. **무한루프 제거**: Shopping-cart 예제에서 렌더링 에러 완전 해결
4. **배칭 호환성**: 모든 상태 변경이 Mesa 배칭 시스템과 올바르게 동작