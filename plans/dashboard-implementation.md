# Dashboard Playground Implementation Plan

## Overview

Dashboard 예제는 **coordinated single store** 패턴을 사용하여 여러 관련 데이터 소스를 동시에 로딩하고 통합된 대시보드 경험을 제공합니다. 실제 비즈니스 대시보드의 복잡성을 시뮬레이션하면서 Mesa의 coordinated initialization 패턴을 교육합니다.

## Educational Goals

### Mesa Concepts to Demonstrate
1. **Coordinated Initialization**: 여러 데이터 소스의 조정된 초기화
2. **Parallel Data Loading**: Promise.all을 통한 동시 로딩
3. **Atomic Updates**: 모든 데이터가 함께 업데이트
4. **Complex State Organization**: 관련 데이터의 구조적 관리
5. **Real-time Updates**: 실시간 데이터 업데이트 시뮬레이션

### User Experience Goals
- **Professional Dashboard**: 실제 비즈니스 대시보드 경험
- **Rich Data Visualization**: 차트, 메트릭, 피드 등 다양한 시각화
- **Real-time Feel**: 실시간 업데이트 시뮬레이션
- **Interactive Elements**: 클릭 가능한 요소들과 상호작용

## Store Architecture

### Single Coordinated Store Design
```tsx
export const dashboardStore = proxy({
  // User Session Data
  user: {
    id: null,
    name: '',
    email: '',
    role: '', // admin, manager, user
    avatar: null,
    company: '',
    lastLogin: null,
    permissions: [],
  },
  
  // Analytics Overview
  analytics: {
    overview: {
      totalRevenue: 0,
      totalOrders: 0,
      totalUsers: 0,
      conversionRate: 0,
      growth: {
        revenue: 0, // percentage
        orders: 0,
        users: 0,
        conversion: 0,
      }
    },
    
    // Time Series Data
    charts: {
      // Revenue over time
      revenue: [
        // { date: '2024-01-01', value: 1000, previous: 900 }
      ],
      
      // Daily active users
      activeUsers: [
        // { date: '2024-01-01', active: 150, new: 20, returning: 130 }
      ],
      
      // Sales conversion funnel
      conversion: [
        // { stage: 'visitors', value: 1000 },
        // { stage: 'leads', value: 300 },
        // { stage: 'customers', value: 50 }
      ],
      
      // Geographic data
      geographic: [
        // { country: 'US', users: 500, revenue: 25000 }
      ]
    },
    
    // Real-time metrics
    realtime: {
      activeNow: 0,
      todaySessions: 0,
      liveOrders: 0,
      serverStatus: 'healthy', // healthy, warning, error
      lastUpdated: null,
    }
  },
  
  // Recent Activities
  recentActivities: [
    // { id, type, title, description, timestamp, user, metadata }
  ],
  
  // Notifications
  notifications: [
    // { id, title, message, type, read, timestamp, actionUrl }
  ],
  unreadCount: 0,
  
  // System Alerts
  alerts: [
    // { id, type, severity, message, timestamp, resolved }
  ],
  
  // Quick Stats Cards
  quickStats: [
    // { id, title, value, change, trend, icon, color }
  ],
  
  // Loading States
  loading: {
    initial: true,
    analytics: false,
    realtime: false,
    activities: false,
  },
  
  // Error States
  errors: {
    general: null,
    analytics: null,
    realtime: null,
    network: null,
  },
  
  // Meta Information
  meta: {
    initialized: false,
    lastRefresh: null,
    refreshInterval: 30000, // 30 seconds
    autoRefresh: true,
  }
});
```

## Implementation Plan

### Phase 1: Core Structure & Coordinated Loading (Day 1)

#### 1.1 Coordinated Initialization
```tsx
// Coordinated data loading pattern
useInitSync(dashboardStore, async (state) => {
  state.loading.initial = true;
  state.errors.general = null;
  
  try {
    // Load all dashboard data in parallel
    const [
      userSession,
      analyticsData, 
      recentActivities,
      notifications,
      systemAlerts,
      realtimeMetrics
    ] = await Promise.all([
      fetchUserSession(),
      fetchAnalytics(),
      fetchRecentActivities(),
      fetchNotifications(),
      fetchSystemAlerts(),
      fetchRealtimeMetrics()
    ]);
    
    // Atomic update - all data loaded together
    state.user = userSession.user;
    state.analytics = analyticsData;
    state.recentActivities = recentActivities;
    state.notifications = notifications;
    state.unreadCount = notifications.filter(n => !n.read).length;
    state.alerts = systemAlerts;
    state.analytics.realtime = realtimeMetrics;
    
    // Generate quick stats from analytics
    state.quickStats = generateQuickStats(analyticsData);
    
    state.meta.initialized = true;
    state.meta.lastRefresh = new Date().toISOString();
    
  } catch (error) {
    state.errors.general = error.message;
  } finally {
    state.loading.initial = false;
  }
});
```

#### 1.2 Real-time Updates Simulation
```tsx
function useRealtimeUpdates() {
  const initialized = useStore(dashboardStore, s => s.meta.initialized);
  const autoRefresh = useStore(dashboardStore, s => s.meta.autoRefresh);
  
  useEffect(() => {
    if (!initialized || !autoRefresh) return;
    
    const interval = setInterval(async () => {
      try {
        dashboardStore.loading.realtime = true;
        
        // Update only realtime metrics (not full reload)
        const realtimeData = await fetchRealtimeMetrics();
        dashboardStore.analytics.realtime = realtimeData;
        
        // Simulate live activities
        const newActivity = await fetchLatestActivity();
        if (newActivity) {
          dashboardStore.recentActivities.unshift(newActivity);
          dashboardStore.recentActivities = dashboardStore.recentActivities.slice(0, 10);
        }
        
        dashboardStore.meta.lastRefresh = new Date().toISOString();
        
      } catch (error) {
        dashboardStore.errors.realtime = 'Failed to update realtime data';
      } finally {
        dashboardStore.loading.realtime = false;
      }
    }, dashboardStore.meta.refreshInterval);
    
    return () => clearInterval(interval);
  }, [initialized, autoRefresh]);
}
```

#### 1.3 Dashboard Layout Structure
```tsx
function DashboardApp() {
  const { loading, initialized, error } = useStore(dashboardStore, s => ({
    loading: s.loading.initial,
    initialized: s.meta.initialized,
    error: s.errors.general
  }));
  
  // Initialize realtime updates
  useRealtimeUpdates();
  
  if (loading && !initialized) {
    return <DashboardLoadingState />;
  }
  
  if (error) {
    return <ErrorDisplay error={error} onRetry={refetch} />;
  }
  
  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      <div className="container mx-auto p-6 space-y-6">
        <QuickStatsGrid />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <RevenueChart />
            <RecentActivitiesPanel />
          </div>
          <div className="space-y-6">
            <RealtimeMetrics />
            <NotificationsPanel />
            <SystemAlertsPanel />
          </div>
        </div>
      </div>
    </div>
  );
}
```

### Phase 2: Header & Quick Stats (Day 1 continued)

#### 2.1 Dashboard Header
```tsx
function DashboardHeader() {
  const user = useStore(dashboardStore, s => s.user);
  const unreadCount = useStore(dashboardStore, s => s.unreadCount);
  const lastRefresh = useStore(dashboardStore, s => s.meta.lastRefresh);
  const autoRefresh = useStore(dashboardStore, s => s.meta.autoRefresh);
  
  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div>
              <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
              <p className="text-sm text-muted-foreground">
                Welcome back, {user.name}
              </p>
            </div>
            
            {lastRefresh && (
              <div className="text-xs text-muted-foreground">
                Last updated: {formatDistanceToNow(new Date(lastRefresh), { addSuffix: true })}
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Auto-refresh toggle */}
            <div className="flex items-center space-x-2">
              <Switch
                checked={autoRefresh}
                onCheckedChange={(checked) => {
                  dashboardStore.meta.autoRefresh = checked;
                }}
              />
              <span className="text-sm text-muted-foreground">Auto-refresh</span>
            </div>
            
            {/* Refresh button */}
            <Button variant="outline" size="sm" onClick={refreshDashboard}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            
            {/* Notifications */}
            <NotificationBell count={unreadCount} />
            
            {/* User menu */}
            <UserMenu user={user} />
          </div>
        </div>
      </div>
    </header>
  );
}
```

#### 2.2 Quick Stats Grid
```tsx
function QuickStatsGrid() {
  const { overview, quickStats } = useStore(dashboardStore, s => ({
    overview: s.analytics.overview,
    quickStats: s.quickStats
  }));
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {quickStats.map(stat => (
        <QuickStatCard key={stat.id} stat={stat} />
      ))}
    </div>
  );
}

function QuickStatCard({ stat }: { stat: QuickStat }) {
  const isPositive = stat.change > 0;
  const isNegative = stat.change < 0;
  
  return (
    <div className="bg-card p-6 rounded-lg border hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className={cn("p-3 rounded-lg", stat.color)}>
          <stat.icon className="h-6 w-6" />
        </div>
        
        <div className={cn(
          "flex items-center text-sm font-medium",
          isPositive && "text-green-600",
          isNegative && "text-red-600",
          stat.change === 0 && "text-muted-foreground"
        )}>
          {isPositive && <TrendingUp className="h-4 w-4 mr-1" />}
          {isNegative && <TrendingDown className="h-4 w-4 mr-1" />}
          {stat.change !== 0 ? `${Math.abs(stat.change)}%` : 'No change'}
        </div>
      </div>
      
      <div>
        <h3 className="text-2xl font-bold mb-1">{stat.value}</h3>
        <p className="text-sm text-muted-foreground">{stat.title}</p>
      </div>
    </div>
  );
}
```

### Phase 3: Charts & Analytics (Day 2)

#### 3.1 Revenue Chart Component
```tsx
function RevenueChart() {
  const revenueData = useStore(dashboardStore, s => s.analytics.charts.revenue);
  const loading = useStore(dashboardStore, s => s.loading.analytics);
  
  // Process data for chart
  const chartData = useMemo(() => {
    return revenueData.map(item => ({
      date: format(new Date(item.date), 'MMM dd'),
      current: item.value,
      previous: item.previous,
    }));
  }, [revenueData]);
  
  if (loading) {
    return <ChartLoadingSkeleton />;
  }
  
  return (
    <div className="bg-card p-6 rounded-lg border">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold">Revenue Trend</h3>
          <p className="text-sm text-muted-foreground">
            Comparing current period with previous
          </p>
        </div>
        
        <ChartTimeRangeSelector />
      </div>
      
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="current" 
              stroke="#3b82f6" 
              strokeWidth={2}
              name="Current Period"
            />
            <Line 
              type="monotone" 
              dataKey="previous" 
              stroke="#94a3b8" 
              strokeWidth={2}
              strokeDasharray="5 5"
              name="Previous Period"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
```

#### 3.2 User Analytics Chart
```tsx
function UserAnalyticsChart() {
  const userChart = useStore(dashboardStore, s => s.analytics.charts.activeUsers);
  
  return (
    <div className="bg-card p-6 rounded-lg border">
      <h3 className="text-lg font-semibold mb-4">User Activity</h3>
      
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={userChart}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Area 
              type="monotone" 
              dataKey="active" 
              stackId="1" 
              stroke="#8884d8" 
              fill="#8884d8" 
              name="Active Users"
            />
            <Area 
              type="monotone" 
              dataKey="new" 
              stackId="1" 
              stroke="#82ca9d" 
              fill="#82ca9d"
              name="New Users" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
```

### Phase 4: Real-time Components (Day 2 continued)

#### 4.1 Real-time Metrics Panel
```tsx
function RealtimeMetrics() {
  const realtime = useStore(dashboardStore, s => s.analytics.realtime);
  const loading = useStore(dashboardStore, s => s.loading.realtime);
  
  const metrics = [
    {
      label: 'Active Now',
      value: realtime.activeNow,
      icon: Users,
      color: 'text-green-600',
    },
    {
      label: 'Today Sessions',
      value: realtime.todaySessions,
      icon: Activity,
      color: 'text-blue-600',
    },
    {
      label: 'Live Orders',
      value: realtime.liveOrders,
      icon: ShoppingBag,
      color: 'text-purple-600',
    },
  ];
  
  return (
    <div className="bg-card p-6 rounded-lg border">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <h3 className="text-lg font-semibold">Live Metrics</h3>
        </div>
        
        {loading && (
          <div className="text-xs text-muted-foreground">Updating...</div>
        )}
      </div>
      
      <div className="space-y-4">
        {metrics.map(metric => (
          <div key={metric.label} className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <metric.icon className={cn("h-5 w-5", metric.color)} />
              <span className="text-sm text-muted-foreground">{metric.label}</span>
            </div>
            <span className="text-2xl font-bold">{metric.value.toLocaleString()}</span>
          </div>
        ))}
      </div>
      
      <div className="mt-6 pt-4 border-t">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Server Status</span>
          <div className="flex items-center space-x-2">
            <div className={cn(
              "w-2 h-2 rounded-full",
              realtime.serverStatus === 'healthy' && "bg-green-500",
              realtime.serverStatus === 'warning' && "bg-yellow-500",
              realtime.serverStatus === 'error' && "bg-red-500"
            )} />
            <span className="capitalize">{realtime.serverStatus}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
```

#### 4.2 Recent Activities Panel
```tsx
function RecentActivitiesPanel() {
  const activities = useStore(dashboardStore, s => s.recentActivities);
  
  return (
    <div className="bg-card p-6 rounded-lg border">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">Recent Activities</h3>
        <Button variant="ghost" size="sm">
          View All
        </Button>
      </div>
      
      <div className="space-y-4">
        {activities.slice(0, 6).map(activity => (
          <ActivityItem key={activity.id} activity={activity} />
        ))}
        
        {activities.length === 0 && (
          <div className="text-center py-8">
            <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
            <p className="text-muted-foreground">No recent activities</p>
          </div>
        )}
      </div>
    </div>
  );
}

function ActivityItem({ activity }: { activity: Activity }) {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'user_signup': return UserPlus;
      case 'order_placed': return ShoppingBag;
      case 'payment_received': return CreditCard;
      case 'product_viewed': return Eye;
      case 'review_posted': return MessageCircle;
      default: return Activity;
    }
  };
  
  const Icon = getActivityIcon(activity.type);
  
  return (
    <div className="flex items-start space-x-3">
      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{activity.title}</p>
        <p className="text-xs text-muted-foreground">{activity.description}</p>
        <div className="flex items-center space-x-2 mt-1">
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
          </span>
          {activity.user && (
            <span className="text-xs px-2 py-1 bg-muted rounded">
              {activity.user}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
```

## Mock Data & API Simulation

### Analytics Data
```tsx
export const mockAnalytics = {
  overview: {
    totalRevenue: 247650,
    totalOrders: 1847,
    totalUsers: 12543,
    conversionRate: 3.24,
    growth: {
      revenue: 12.5,
      orders: 8.3,
      users: 15.7,
      conversion: -2.1,
    }
  },
  
  charts: {
    revenue: generateRevenueData(30), // 30 days
    activeUsers: generateUserData(30),
    conversion: [
      { stage: 'Visitors', value: 10000 },
      { stage: 'Leads', value: 3500 },
      { stage: 'Trials', value: 1200 },
      { stage: 'Customers', value: 324 },
    ],
  }
};

function generateRevenueData(days: number) {
  const data = [];
  const baseRevenue = 8000;
  
  for (let i = days; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    
    const variance = (Math.random() - 0.5) * 0.3;
    const currentValue = Math.round(baseRevenue * (1 + variance));
    const previousValue = Math.round(currentValue * (0.9 + Math.random() * 0.2));
    
    data.push({
      date: date.toISOString(),
      value: currentValue,
      previous: previousValue,
    });
  }
  
  return data;
}
```

### Real-time Data Simulation
```tsx
export const fetchRealtimeMetrics = async () => {
  await new Promise(resolve => setTimeout(resolve, 200));
  
  const baseActiveNow = 45;
  const variance = Math.floor(Math.random() * 20) - 10;
  
  return {
    activeNow: Math.max(0, baseActiveNow + variance),
    todaySessions: 1247 + Math.floor(Math.random() * 50),
    liveOrders: Math.floor(Math.random() * 8),
    serverStatus: Math.random() > 0.95 ? 'warning' : 'healthy',
    lastUpdated: new Date().toISOString(),
  };
};
```

## Success Criteria

### ✅ Implementation Must Achieve:

1. **Coordinated Loading**: All dashboard data loads together atomically
2. **Real-time Updates**: Simulated live data updates every 30 seconds
3. **Rich Visualizations**: Charts, metrics, and interactive elements
4. **Professional UI**: Business dashboard look and feel
5. **Responsive Design**: Works perfectly on all screen sizes
6. **Performance**: Smooth updates without unnecessary re-renders

### 📊 Educational Value:
1. **Coordinated Pattern**: Clear demonstration of loading related data together
2. **Atomic Updates**: All data appears at once, not piecemeal
3. **Data Relationships**: Show how related data is managed in single store
4. **Performance Benefits**: Demonstrate efficiency of coordinated approach

### 🎯 User Experience:
1. **Fast Load Time**: Complete dashboard loads in under 2 seconds
2. **Smooth Interactions**: No janky animations or delays  
3. **Clear Feedback**: Loading states and error handling
4. **Professional Feel**: Looks like real business dashboard

This implementation will showcase Mesa's coordinated initialization pattern while delivering a compelling, realistic dashboard experience.