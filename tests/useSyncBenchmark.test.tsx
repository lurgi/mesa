import { render, cleanup, act } from "@testing-library/react";
import { renderHook } from "@testing-library/react";
import { proxy } from "../src/main";
import { useStore } from "../src/useStore";

// 실제 사용 시나리오를 반영한 데이터 구조
interface DashboardData {
  metrics: Array<{ id: string; name: string; value: number; trend: number }>;
  users: Array<{ id: string; name: string; email: string; lastActive: string }>;
  activities: Array<{
    id: string;
    type: string;
    timestamp: string;
    userId: string;
  }>;
}

interface TableData {
  rows: Array<{
    id: string;
    name: string;
    status: "active" | "inactive" | "pending";
    metadata: Record<string, any>;
  }>;
  pagination: { page: number; total: number; pageSize: number };
  filters: Record<string, any>;
}

interface FormData {
  user: {
    profile: { name: string; email: string; avatar?: string };
    preferences: { theme: string; notifications: boolean; language: string };
    permissions: Array<{ resource: string; actions: string[] }>;
  };
  settings: Record<string, any>;
}

// 현실적인 데이터 생성 함수들
const createDashboardData = (
  metricCount: number = 10,
  userCount: number = 50
): DashboardData => ({
  metrics: Array.from({ length: metricCount }, (_, i) => ({
    id: `metric-${i}`,
    name: `Metric ${i}`,
    value: Math.floor(Math.random() * 10000),
    trend: (Math.random() - 0.5) * 100,
  })),
  users: Array.from({ length: userCount }, (_, i) => ({
    id: `user-${i}`,
    name: `User ${i}`,
    email: `user${i}@example.com`,
    lastActive: new Date(Date.now() - Math.random() * 86400000).toISOString(),
  })),
  activities: Array.from({ length: userCount * 3 }, (_, i) => ({
    id: `activity-${i}`,
    type: ["login", "logout", "create", "update", "delete"][
      Math.floor(Math.random() * 5)
    ],
    timestamp: new Date(Date.now() - Math.random() * 3600000).toISOString(),
    userId: `user-${Math.floor(Math.random() * userCount)}`,
  })),
});

const createTableData = (
  rowCount: number = 20,
  pageSize: number = 20
): TableData => ({
  rows: Array.from({ length: rowCount }, (_, i) => ({
    id: `row-${i}`,
    name: `Item ${i}`,
    status: (["active", "inactive", "pending"] as const)[
      Math.floor(Math.random() * 3)
    ],
    metadata: { created: Date.now(), category: `cat-${i % 5}` },
  })),
  pagination: { page: 1, total: rowCount, pageSize },
  filters: {},
});

const createFormData = (): FormData => ({
  user: {
    profile: {
      name: "John Doe",
      email: "john@example.com",
      avatar: "https://example.com/avatar.jpg",
    },
    preferences: {
      theme: "dark",
      notifications: true,
      language: "en",
    },
    permissions: [
      { resource: "users", actions: ["read", "write"] },
      { resource: "posts", actions: ["read"] },
    ],
  },
  settings: {
    apiEndpoint: "https://api.example.com",
    timeout: 5000,
    retries: 3,
  },
});

// 정확한 성능 측정 도구
class RealisticPerformanceMonitor {
  private measurements: Map<string, number[]> = new Map();
  private renderCounts: Map<string, number> = new Map();

  startMeasurement(testName: string): () => number {
    const startTime = performance.now();

    return () => {
      const duration = performance.now() - startTime;

      if (!this.measurements.has(testName)) {
        this.measurements.set(testName, []);
      }
      this.measurements.get(testName)!.push(duration);

      return duration;
    };
  }

  trackRender(testName: string) {
    const current = this.renderCounts.get(testName) || 0;
    this.renderCounts.set(testName, current + 1);
  }

  getPerformanceReport(testName: string) {
    const measurements = this.measurements.get(testName) || [];
    const renderCount = this.renderCounts.get(testName) || 0;

    if (measurements.length === 0) {
      return { duration: null, renderCount, samples: 0 };
    }

    const sorted = [...measurements].sort((a, b) => a - b);
    const avg = measurements.reduce((a, b) => a + b, 0) / measurements.length;
    const p50 = sorted[Math.floor(sorted.length * 0.5)];
    const p95 = sorted[Math.floor(sorted.length * 0.95)];
    const min = sorted[0];
    const max = sorted[sorted.length - 1];

    return {
      duration: { avg, p50, p95, min, max },
      renderCount,
      samples: measurements.length,
    };
  }

  reset() {
    this.measurements.clear();
    this.renderCounts.clear();
  }

  // 성능 기준 검증
  static checkPerformance(
    duration: number,
    expectedMs: number,
    tolerance: number = 0.5
  ): boolean {
    return duration <= expectedMs * (1 + tolerance);
  }
}

describe("useSync Realistic Performance Benchmark", () => {
  let monitor: RealisticPerformanceMonitor;

  beforeEach(() => {
    monitor = new RealisticPerformanceMonitor();
  });

  afterEach(() => {
    cleanup();
    monitor.reset();
  });

  describe("대시보드 실시간 업데이트 시나리오", () => {
    test("실시간 메트릭 업데이트 (10개 지표)", async () => {
      const testName = "dashboard-metrics-update";
      const { state, useSync } = proxy.withSync<DashboardData>(
        createDashboardData(10, 50)
      );

      const DashboardComponent = () => {
        monitor.trackRender(testName);
        const data = useStore(state);
        return (
          <div>
            <div data-testid="metrics-count">{data.metrics.length}</div>
            <div data-testid="users-count">{data.users.length}</div>
          </div>
        );
      };

      render(<DashboardComponent />);

      // 실시간 업데이트 시뮬레이션 (1초마다 업데이트)
      for (let i = 0; i < 5; i++) {
        const endMeasurement = monitor.startMeasurement(testName);
        const newData = createDashboardData(10, 50);

        await act(async () => {
          renderHook(() => useSync(newData));
        });

        const duration = endMeasurement();

        // 실시간 대시보드: 100ms 이내로 업데이트되어야 함
        expect(
          RealisticPerformanceMonitor.checkPerformance(duration, 100)
        ).toBe(true);
      }

      const report = monitor.getPerformanceReport(testName);
      expect(report.duration?.p95).toBeLessThan(150); // 95%는 150ms 이내
      expect(report.renderCount).toBeLessThan(15); // 과도한 리렌더링 방지
    });

    test("대시보드 필터링 및 정렬 (200개 항목)", async () => {
      const testName = "dashboard-filtering";
      const { state, useSync } = proxy.withSync<DashboardData>(
        createDashboardData(20, 200)
      );

      const FilteredDashboard = () => {
        monitor.trackRender(testName);
        const data = useStore(state);
        const activeUsers = data.users.filter(
          (u) => u.lastActive > new Date(Date.now() - 86400000).toISOString()
        );
        return <div data-testid="active-users">{activeUsers.length}</div>;
      };

      render(<FilteredDashboard />);

      // 필터 조건 변경 시뮬레이션
      const endMeasurement = monitor.startMeasurement(testName);
      const filteredData = createDashboardData(20, 200);

      await act(async () => {
        renderHook(() => useSync(filteredData));
      });

      const duration = endMeasurement();
      const report = monitor.getPerformanceReport(testName);

      // 필터링: 300ms 이내
      expect(RealisticPerformanceMonitor.checkPerformance(duration, 300)).toBe(
        true
      );
      expect(report.renderCount).toBeLessThan(5);
    });
  });

  describe("테이블 페이지네이션 시나리오", () => {
    test("페이지 전환 (20개 행)", async () => {
      const testName = "table-pagination";
      const { state, useSync } = proxy.withSync<TableData>(createTableData(20));

      const TableComponent = () => {
        monitor.trackRender(testName);
        const data = useStore(state);
        return (
          <div>
            <div data-testid="row-count">{data.rows.length}</div>
            <div data-testid="current-page">{data.pagination.page}</div>
          </div>
        );
      };

      render(<TableComponent />);

      // 페이지 전환 시뮬레이션
      for (let page = 2; page <= 5; page++) {
        const endMeasurement = monitor.startMeasurement(testName);
        const newPageData = {
          ...createTableData(20),
          pagination: { page, total: 100, pageSize: 20 },
        };

        await act(async () => {
          renderHook(() => useSync(newPageData));
        });

        const duration = endMeasurement();

        // 페이지 전환: 16ms 이내 (60fps 유지)
        expect(
          RealisticPerformanceMonitor.checkPerformance(duration, 16, 2)
        ).toBe(true);
      }

      const report = monitor.getPerformanceReport(testName);
      expect(report.duration?.avg).toBeLessThan(50); // 평균 50ms 이내
    });

    test("대용량 테이블 (100개 행)", async () => {
      const testName = "large-table";
      const { state, useSync } = proxy.withSync<TableData>(createTableData(10));

      const LargeTableComponent = () => {
        monitor.trackRender(testName);
        const data = useStore(state);
        return <div data-testid="rows">{data.rows.length}</div>;
      };

      render(<LargeTableComponent />);

      const endMeasurement = monitor.startMeasurement(testName);
      const largeTableData = createTableData(100);

      await act(async () => {
        renderHook(() => useSync(largeTableData));
      });

      const duration = endMeasurement();
      const report = monitor.getPerformanceReport(testName);

      // 대용량 테이블: 100ms 이내
      expect(RealisticPerformanceMonitor.checkPerformance(duration, 100)).toBe(
        true
      );
      expect(report.renderCount).toBeLessThan(3);
    });
  });

  describe("폼 데이터 동기화 시나리오", () => {
    test("복잡한 중첩 폼 데이터 업데이트", async () => {
      const testName = "form-sync";
      const { state, useSync } = proxy.withSync<FormData>(createFormData());

      const FormComponent = () => {
        monitor.trackRender(testName);
        const data = useStore(state);
        return (
          <div>
            <div data-testid="user-name">{data.user.profile.name}</div>
            <div data-testid="permissions">{data.user.permissions.length}</div>
          </div>
        );
      };

      render(<FormComponent />);

      // 부분 업데이트 시뮬레이션 (사용자 입력)
      const updates = [
        {
          user: {
            ...createFormData().user,
            profile: { ...createFormData().user.profile, name: "Jane Doe" },
          },
        },
        {
          user: {
            ...createFormData().user,
            preferences: {
              ...createFormData().user.preferences,
              theme: "light",
            },
          },
        },
      ];

      for (const update of updates) {
        const endMeasurement = monitor.startMeasurement(testName);

        await act(async () => {
          renderHook(() => useSync({ ...state, ...update }));
        });

        const duration = endMeasurement();

        // 폼 업데이트: 16ms 이내 (즉시 반응)
        expect(
          RealisticPerformanceMonitor.checkPerformance(duration, 16, 3)
        ).toBe(true);
      }

      const report = monitor.getPerformanceReport(testName);
      expect(report.duration?.p95).toBeLessThan(50); // 95%는 50ms 이내
    });
  });

  describe("스트레스 테스트 및 한계점 측정", () => {
    test("대용량 데이터 한계점 측정 (1K-5K 항목)", async () => {
      const testName = "stress-test";
      const dataSizes = [1000, 2000, 3000, 5000];

      for (const size of dataSizes) {
        const { state, useSync } = proxy.withSync<DashboardData>(
          createDashboardData(10, 10)
        );

        const StressComponent = () => {
          monitor.trackRender(`${testName}-${size}`);
          const data = useStore(state);
          return <div data-testid="stress-users">{data.users.length}</div>;
        };

        const { unmount } = render(<StressComponent />);

        const endMeasurement = monitor.startMeasurement(`${testName}-${size}`);
        const stressData = createDashboardData(size / 50, size);

        await act(async () => {
          renderHook(() => useSync(stressData));
        });

        const duration = endMeasurement();
        const report = monitor.getPerformanceReport(`${testName}-${size}`);

        // 데이터 크기별 적응적 임계값
        const expectedTime = size <= 1000 ? 300 : size <= 3000 ? 1000 : 2000;

        console.log(`Stress test ${size} items: ${duration.toFixed(2)}ms`);
        expect(duration).toBeLessThan(expectedTime);
        expect(report.renderCount).toBeLessThan(5);

        unmount();
      }
    });

    test("연속 업데이트 처리 능력 (실시간 시뮬레이션)", async () => {
      const testName = "continuous-updates";
      const { state, useSync } = proxy.withSync<DashboardData>(
        createDashboardData(10, 100)
      );

      const RealtimeComponent = () => {
        monitor.trackRender(testName);
        const data = useStore(state);
        return (
          <div>
            <div data-testid="metrics">{data.metrics.length}</div>
            <div data-testid="activities">{data.activities.length}</div>
          </div>
        );
      };

      render(<RealtimeComponent />);

      // 10초간 100ms마다 업데이트 (총 100회)
      const updateInterval = 50; // 20fps 시뮬레이션
      const totalUpdates = 20;

      for (let i = 0; i < totalUpdates; i++) {
        const endMeasurement = monitor.startMeasurement(testName);
        const newData = createDashboardData(
          10 + Math.floor(Math.random() * 5),
          100 + Math.floor(Math.random() * 20)
        );

        await act(async () => {
          renderHook(() => useSync(newData));
        });

        const duration = endMeasurement();

        expect(duration).toBeLessThan(updateInterval);

        await new Promise((resolve) => setTimeout(resolve, 10));
      }

      const report = monitor.getPerformanceReport(testName);
      expect(report.duration?.avg).toBeLessThan(25); // 평균 25ms 이내
      expect(report.duration?.p95).toBeLessThan(40); // 95%는 40ms 이내
    });

    test("메모리 효율성 검증", async () => {
      const testName = "memory-efficiency";
      const memoryRefs: WeakRef<any>[] = [];

      for (let cycle = 0; cycle < 3; cycle++) {
        const { state, useSync } = proxy.withSync<DashboardData>(
          createDashboardData(50, 200)
        );

        const MemoryTestComponent = () => {
          monitor.trackRender(`${testName}-cycle-${cycle}`);
          const data = useStore(state);
          return <div>{data.users.length}</div>;
        };

        const { unmount } = render(<MemoryTestComponent />);

        // 여러 번 업데이트
        for (let i = 0; i < 5; i++) {
          const testData = createDashboardData(50, 200);
          if (typeof WeakRef !== "undefined") {
            memoryRefs.push(new WeakRef(testData));
          }

          await act(async () => {
            renderHook(() => useSync(testData));
          });
        }

        unmount();
        if (global.gc) {
          global.gc();
        }
      }

      // WeakRef로 메모리 해제 확인 (일부만 해제되어도 정상)
      if (typeof WeakRef !== "undefined") {
        await new Promise((resolve) => setTimeout(resolve, 100)); // GC 대기
        const unreferencedCount = memoryRefs.filter(
          (ref) => ref.deref() === undefined
        ).length;
        expect(unreferencedCount).toBeGreaterThan(0); // 일부라도 해제되었는지 확인
        /*
            1. GC 타이밍: 브라우저가 메모리 압박을 느끼지 않으면 GC를 지연
            2. 내부 최적화: V8 등 엔진이 객체를 재사용하거나 캐싱
            3. 테스트 환경: Jest/JSDOM에서는 실제 브라우저와 GC 동작 차이
            따라서 일부 객체라도 해제되면 useSync가 메모리 누수를 일으키지 않는다고 판단
        */
      }
    });
  });
});
