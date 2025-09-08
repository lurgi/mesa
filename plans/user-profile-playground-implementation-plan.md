# User Profile Playground Implementation Plan

## 목표 (Objectives)

Mesa의 `useInitSync` API를 활용한 사용자 프로필 예제를 구현합니다. 이 예제는 다음을 시연합니다:

1. **useInitSync의 비동기 데이터 로딩**: API 호출을 통한 사용자 프로필 데이터 초기화
2. **에러 처리 패턴**: 네트워크 에러와 재시도 로직의 우아한 처리
3. **Fine-grained 구독**: 컴포넌트별 최적화된 상태 구독
4. **플레이그라운드 컨트롤**: 실시간 설정 변경을 통한 동작 확인
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
- **자동 상태 관리**: loading, error 상태는 useInitSync가 자동 처리
- **deps 배열 최소화**: 무한 루프 방지를 위한 신중한 deps 관리
- **Mesa 배칭**: 초기화 중 모든 상태 변경은 원자적으로 적용
- **에러 처리**: onError 콜백과 함께 자연스러운 에러 전파

## User Profile 아키텍처 설계

### 1. Store 구조

```typescript
// 사용자 스토어 - 프로필 데이터 관리
const userStore = proxy({
  user: null,
  lastFetchTime: null,
});

// 플레이그라운드 스토어 - 설정 및 데모 상태 관리
const playgroundStore = proxy({
  selectedUserId: 1,
  networkDelay: 1500,
  errorRate: 0.2,
  retryCount: 0,
});
```

### 2. useInitSync 초기화 패턴

```typescript
// ✅ Mesa 권장 패턴: deps 배열 최소화
function useUserProfile() {
  const { loading, error, refetch } = useInitSync(userStore, async (state) => {
    const user = await fetchUserProfile(playgroundStore.selectedUserId, {
      delay: playgroundStore.networkDelay,
      errorRate: playgroundStore.errorRate
    });
    
    state.user = user;
    state.lastFetchTime = Date.now();
  }, {
    onSuccess: () => {
      console.log('User profile loaded successfully');
    },
    onError: (error) => {
      console.error('User profile initialization failed:', error);
      playgroundStore.retryCount++;
    }
  });

  return { loading, error, refetch };
}
```

### 3. Fine-grained 구독 패턴

```tsx
function UserProfile() {
  const { loading, error, refetch } = useUserProfile();
  
  // 🎯 필요한 데이터만 구독
  const user = useStore(userStore, s => s.user);

  if (loading) return <LoadingSkeleton />;
  if (error) return <ErrorDisplay error={error} onRetry={refetch} />;
  if (!user) return <NoDataMessage />;

  return <UserProfileContent user={user} />;
}

// 🎯 컴포넌트별로 필요한 부분만 구독
function ProfileHeader({ user }) {
  return (
    <div className="profile-header">
      <img src={user.avatar} alt={user.name} />
      <h1>{user.name}</h1>
      <p>{user.email}</p>
    </div>
  );
}

function ProfileStats({ stats }) {
  return (
    <div className="profile-stats">
      <StatItem label="Followers" value={stats.followers} />
      <StatItem label="Following" value={stats.following} />
      <StatItem label="Posts" value={stats.posts} />
    </div>
  );
}
```

## 구현 TODO List

### Phase 0: 기존 문서 수정 (필수 선행 작업)
- [x] **잘못된 useInitSync 패턴 수정**: 수동 loading/error 관리 제거
- [x] **Store 구조 정리**: 불필요한 loading, error 필드 제거  
- [x] **구독 패턴 수정**: 객체 반환 대신 개별 원시값 구독
- [x] **올바른 예제 코드 작성**: Mesa 권장 패턴으로 전면 수정
- [x] **문서 내 설명 업데이트**: 수정된 패턴에 맞는 설명 갱신

### Phase 1: 기본 구조 설정
- [x] **타입 정의**: User, UserStore, PlaygroundStore 인터페이스
- [x] **모크 API 함수**: fetchUserProfile, 사용자 데이터 시뮬레이션
- [x] **Store 생성**: userStore, playgroundStore 초기 상태
- [x] **기본 레이아웃**: 헤더, 메인 컨텐츠, 플레이그라운드 컨트롤

### Phase 2: useInitSync 통합
- [ ] **사용자 프로필 초기화**: useInitSync로 프로필 데이터 로딩
- [ ] **에러 처리**: 네트워크 에러 시뮬레이션 및 재시도 로직
- [ ] **로딩 상태**: 스켈레톤 UI 및 로딩 인디케이터
- [ ] **상태 구독**: Fine-grained 구독 패턴 적용

### Phase 3: UI 컴포넌트 구현
- [ ] **ProfileHeader**: 사용자 기본 정보 (아바타, 이름, 이메일)
- [ ] **ProfileStats**: 팔로워, 팔로잉, 게시글 수 통계
- [ ] **ProfileBio**: 사용자 소개 및 부가 정보
- [ ] **ProfileActions**: 팔로우, 메시지 등 액션 버튼
- [ ] **LoadingSkeleton**: 로딩 중 스켈레톤 UI
- [ ] **ErrorDisplay**: 에러 상태 UI 및 재시도 버튼

### Phase 4: 플레이그라운드 기능
- [ ] **사용자 선택**: 드롭다운으로 다른 사용자 프로필 전환
- [ ] **네트워크 지연 조절**: 슬라이더로 로딩 시간 시뮬레이션
- [ ] **에러율 조절**: 에러 발생 확률 설정
- [ ] **상태 시각화**: 현재 상태 및 재시도 횟수 표시
- [ ] **실시간 로깅**: 콘솔 출력을 통한 상태 변화 추적

### Phase 5: 성능 최적화 및 폴리시
- [ ] **렌더링 최적화**: 불필요한 리렌더 방지 검증
- [ ] **메모리 관리**: 컴포넌트 언마운트 시 정리 로직
- [ ] **접근성 개선**: 키보드 네비게이션, ARIA 레이블
- [ ] **반응형 디자인**: 모바일/태블릿 레이아웃 최적화
- [ ] **에러 경계**: React ErrorBoundary 통합

### Phase 6: 교육적 요소
- [ ] **인터랙티브 가이드**: Mesa 특징 설명 패널
- [ ] **성능 지표**: 렌더링 횟수, 구독 상태 표시
- [ ] **코드 예제**: 실제 구현 코드 스니펫 제공
- [ ] **베스트 프랙티스**: 권장 패턴 및 안티패턴 가이드

## 컨벤션 및 스타일 가이드

### 1. 기존 예제와 동일한 패턴 적용
- **UI 컴포넌트**: Tailwind CSS 기반 스타일링
- **아이콘**: Lucide React 또는 Heroicons 사용
- **레이아웃**: 그리드 시스템과 Flexbox 조합
- **타입스크립트**: 완전한 타입 안정성

### 2. Mesa 특화 패턴
- **useStore 구독**: 세분화된 상태 구독으로 최적화
- **Proxy 상태 관리**: 직접적인 상태 변경으로 단순성 유지
- **배칭 활용**: 복합 상태 업데이트의 원자성 보장

### 3. 교육적 요소
- **콘솔 로깅**: 초기화 과정 및 상태 변경 추적
- **성능 지표**: 렌더링 횟수, 상태 업데이트 빈도 표시
- **인터랙티브 데모**: Mesa 특징을 실시간으로 확인할 수 있는 UI

## 성공 기준

### 기능적 요구사항
1. **완전한 프로필 표시**: 사용자 정보, 통계, 소개글 등 모든 데이터 표시
2. **견고한 에러 처리**: 네트워크 실패 시나리오에 대한 우아한 대응
3. **반응성 있는 UI**: 설정 변경 시 즉시 반영되는 인터랙티브 경험

### 기술적 요구사항
1. **useInitSync 시연**: 올바른 비동기 초기화 패턴 구현
2. **Fine-grained 구독**: 컴포넌트별 최적화된 리렌더링
3. **무한 루프 방지**: deps 배열 관리를 통한 안정성 확보

### 교육적 가치
1. **Mesa 패턴 학습**: 실제 사용 사례를 통한 API 이해
2. **성능 최적화**: 세분화된 리액티비티의 이점 체험
3. **에러 처리**: 실제 환경에서의 견고한 에러 처리 방법

---

*이 문서는 구현 과정에서 지속적으로 업데이트되며, 각 단계 완료시 체크리스트를 갱신합니다.*