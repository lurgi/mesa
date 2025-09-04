# User Profile Playground Implementation Plan

## Overview

User Profile 예제는 **단일 복합 store**를 사용한 비동기 데이터 로딩, 폼 관리, 설정 업데이트를 보여주는 playground입니다. 실제 사용자 프로필 관리 애플리케이션의 복잡성을 시뮬레이션하면서 Mesa의 단일 store 패턴을 교육합니다.

## Educational Goals

### Mesa Concepts to Demonstrate
1. **Single Complex Store**: 하나의 store로 복잡한 상태 관리
2. **Async Data Loading**: 비동기 데이터 로딩 패턴  
3. **Form State Management**: 복잡한 폼 상태 처리
4. **Conditional Loading**: 조건부 데이터 로딩
5. **State Synchronization**: 서버와 로컬 상태 동기화

### User Experience Goals
- **Professional Profile Management**: 실제 프로필 관리 UI
- **Smooth Interactions**: 부드러운 편집 및 저장 경험
- **Progress Feedback**: 명확한 로딩 및 저장 상태 피드백
- **Error Handling**: 우아한 에러 처리 및 복구

## Store Architecture

### Single Store Design
```tsx
export const userProfileStore = proxy({
  // Profile Data
  profile: {
    id: null,
    name: '',
    email: '',
    avatar: null,
    bio: '',
    location: '',
    website: '',
    phone: '',
    company: '',
    title: '',
    birthDate: null,
    joinDate: null,
  },
  
  // User Preferences
  preferences: {
    // Appearance
    theme: 'system', // light | dark | system
    language: 'en',
    timezone: 'UTC',
    
    // Notifications
    notifications: {
      email: true,
      push: true,
      marketing: false,
      updates: true,
    },
    
    // Privacy
    privacy: {
      profilePublic: true,
      emailVisible: false,
      phoneVisible: false,
      activityVisible: true,
    },
    
    // Display
    display: {
      dateFormat: 'MM/DD/YYYY',
      timeFormat: '12h',
      currency: 'USD',
    }
  },
  
  // Activity Data
  activityHistory: [
    // { id, type, description, timestamp, metadata }
  ],
  
  // UI State
  ui: {
    activeTab: 'profile', // profile | preferences | activity
    isEditing: false,
    editingField: null, // field currently being edited
    hasChanges: false, // track unsaved changes
    showDeleteConfirm: false,
  },
  
  // Loading States
  loading: {
    initial: true,
    saving: false,
    uploadingAvatar: false,
    loadingActivity: false,
  },
  
  // Error States
  errors: {
    general: null,
    fields: {}, // field-specific errors
    network: null,
  },
  
  // Meta State
  meta: {
    initialized: false,
    lastSaved: null,
    originalProfile: null, // for change tracking
  }
});
```

## Implementation Plan

### Phase 1: Core Structure (Day 1)

#### 1.1 Store Setup and Initialization
```tsx
// Initialize with progressive loading
useInitSync(userProfileStore, async (state) => {
  state.loading.initial = true;
  state.errors.general = null;
  
  try {
    // Load profile data
    const profile = await fetchUserProfile();
    state.profile = profile;
    state.meta.originalProfile = { ...profile }; // for change tracking
    
    // Load preferences
    const preferences = await fetchUserPreferences();
    state.preferences = { ...state.preferences, ...preferences };
    
    // Load recent activity (first 10 items)
    const activity = await fetchUserActivity(10);
    state.activityHistory = activity;
    
    state.meta.initialized = true;
    
  } catch (error) {
    state.errors.general = error.message;
  } finally {
    state.loading.initial = false;
  }
});
```

#### 1.2 Page Structure
```tsx
function UserProfileApp() {
  const { loading, initialized, error } = useStore(userProfileStore, s => ({
    loading: s.loading.initial,
    initialized: s.meta.initialized,
    error: s.errors.general
  }));
  
  if (loading && !initialized) {
    return <ProfileLoadingState />;
  }
  
  if (error) {
    return <ErrorDisplay error={error} onRetry={refetch} />;
  }
  
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <ProfileHeader />
      <ProfileTabs />
      <ProfileContent />
      <SaveStatusIndicator />
    </div>
  );
}
```

#### 1.3 Navigation Structure
```tsx
function ProfileTabs() {
  const activeTab = useStore(userProfileStore, s => s.ui.activeTab);
  const hasChanges = useStore(userProfileStore, s => s.ui.hasChanges);
  
  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'preferences', label: 'Preferences', icon: Settings },
    { id: 'activity', label: 'Activity', icon: Clock },
  ];
  
  return (
    <div className="border-b">
      <nav className="flex space-x-8">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => userProfileStore.ui.activeTab = tab.id}
            className={cn(
              "flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm",
              activeTab === tab.id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <tab.icon className="h-4 w-4" />
            <span>{tab.label}</span>
            {hasChanges && tab.id === activeTab && (
              <div className="w-2 h-2 bg-orange-500 rounded-full" />
            )}
          </button>
        ))}
      </nav>
    </div>
  );
}
```

### Phase 2: Profile Tab Implementation (Day 1 continued)

#### 2.1 Profile Header
```tsx
function ProfileHeader() {
  const profile = useStore(userProfileStore, s => s.profile);
  const isEditing = useStore(userProfileStore, s => s.ui.isEditing);
  const uploadingAvatar = useStore(userProfileStore, s => s.loading.uploadingAvatar);
  
  return (
    <div className="bg-card p-6 rounded-lg border">
      <div className="flex items-start space-x-6">
        {/* Avatar Section */}
        <div className="relative">
          <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center overflow-hidden">
            {profile.avatar ? (
              <img src={profile.avatar} alt={profile.name} className="w-full h-full object-cover" />
            ) : (
              <User className="w-12 h-12 text-muted-foreground" />
            )}
          </div>
          
          {isEditing && (
            <AvatarUploadButton loading={uploadingAvatar} />
          )}
        </div>
        
        {/* Profile Info */}
        <div className="flex-1">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-2xl font-bold">{profile.name || 'Anonymous User'}</h2>
              <p className="text-muted-foreground">{profile.email}</p>
              {profile.title && profile.company && (
                <p className="text-sm text-muted-foreground mt-1">
                  {profile.title} at {profile.company}
                </p>
              )}
            </div>
            
            <EditToggleButton />
          </div>
          
          {profile.bio && (
            <p className="text-sm text-muted-foreground mb-4">{profile.bio}</p>
          )}
          
          <ProfileStats />
        </div>
      </div>
    </div>
  );
}
```

#### 2.2 Editable Profile Form
```tsx
function ProfileForm() {
  const profile = useStore(userProfileStore, s => s.profile);
  const isEditing = useStore(userProfileStore, s => s.ui.isEditing);
  const fieldErrors = useStore(userProfileStore, s => s.errors.fields);
  
  if (!isEditing) {
    return <ProfileDisplay profile={profile} />;
  }
  
  return (
    <div className="space-y-6">
      {/* Basic Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          label="Full Name"
          value={profile.name}
          onChange={(value) => {
            userProfileStore.profile.name = value;
            markAsChanged();
          }}
          error={fieldErrors.name}
          required
        />
        
        <FormField
          label="Email"
          type="email"
          value={profile.email}
          onChange={(value) => {
            userProfileStore.profile.email = value;
            markAsChanged();
          }}
          error={fieldErrors.email}
          required
        />
        
        <FormField
          label="Phone"
          type="tel"
          value={profile.phone}
          onChange={(value) => {
            userProfileStore.profile.phone = value;
            markAsChanged();
          }}
          error={fieldErrors.phone}
        />
        
        <FormField
          label="Website"
          type="url"
          value={profile.website}
          onChange={(value) => {
            userProfileStore.profile.website = value;
            markAsChanged();
          }}
          error={fieldErrors.website}
        />
      </div>
      
      {/* Professional Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          label="Company"
          value={profile.company}
          onChange={(value) => {
            userProfileStore.profile.company = value;
            markAsChanged();
          }}
        />
        
        <FormField
          label="Job Title"
          value={profile.title}
          onChange={(value) => {
            userProfileStore.profile.title = value;
            markAsChanged();
          }}
        />
      </div>
      
      {/* Bio */}
      <FormField
        label="Bio"
        type="textarea"
        value={profile.bio}
        onChange={(value) => {
          userProfileStore.profile.bio = value;
          markAsChanged();
        }}
        placeholder="Tell us about yourself..."
        rows={4}
      />
      
      {/* Location */}
      <FormField
        label="Location"
        value={profile.location}
        onChange={(value) => {
          userProfileStore.profile.location = value;
          markAsChanged();
        }}
        placeholder="City, Country"
      />
      
      {/* Form Actions */}
      <ProfileFormActions />
    </div>
  );
}
```

### Phase 3: Preferences Tab (Day 2)

#### 3.1 Preferences Structure
```tsx
function PreferencesPanel() {
  return (
    <div className="space-y-8">
      <AppearancePreferences />
      <NotificationPreferences />
      <PrivacyPreferences />
      <DisplayPreferences />
    </div>
  );
}
```

#### 3.2 Appearance Preferences
```tsx
function AppearancePreferences() {
  const { theme, language, timezone } = useStore(userProfileStore, s => s.preferences);
  
  return (
    <PreferenceSection
      title="Appearance"
      description="Customize how the application looks and feels"
      icon={Palette}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="text-sm font-medium mb-2 block">Theme</label>
          <Select
            value={theme}
            onValueChange={(value) => {
              userProfileStore.preferences.theme = value;
              applyTheme(value);
              markAsChanged();
            }}
          >
            <SelectItem value="light">Light</SelectItem>
            <SelectItem value="dark">Dark</SelectItem>
            <SelectItem value="system">System</SelectItem>
          </Select>
        </div>
        
        <div>
          <label className="text-sm font-medium mb-2 block">Language</label>
          <Select
            value={language}
            onValueChange={(value) => {
              userProfileStore.preferences.language = value;
              markAsChanged();
            }}
          >
            <SelectItem value="en">English</SelectItem>
            <SelectItem value="ko">한국어</SelectItem>
            <SelectItem value="ja">日本語</SelectItem>
          </Select>
        </div>
        
        <div>
          <label className="text-sm font-medium mb-2 block">Timezone</label>
          <TimezoneSelect
            value={timezone}
            onChange={(value) => {
              userProfileStore.preferences.timezone = value;
              markAsChanged();
            }}
          />
        </div>
      </div>
    </PreferenceSection>
  );
}
```

#### 3.3 Notification Preferences
```tsx
function NotificationPreferences() {
  const notifications = useStore(userProfileStore, s => s.preferences.notifications);
  
  const notificationOptions = [
    {
      key: 'email',
      label: 'Email Notifications',
      description: 'Receive updates via email',
      icon: Mail,
    },
    {
      key: 'push',
      label: 'Push Notifications',
      description: 'Browser push notifications',
      icon: Bell,
    },
    {
      key: 'marketing',
      label: 'Marketing Communications',
      description: 'Product updates and promotions',
      icon: Megaphone,
    },
    {
      key: 'updates',
      label: 'Product Updates',
      description: 'New features and improvements',
      icon: Zap,
    },
  ];
  
  return (
    <PreferenceSection
      title="Notifications"
      description="Control how and when you receive notifications"
      icon={Bell}
    >
      <div className="space-y-4">
        {notificationOptions.map(option => (
          <div key={option.key} className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-start space-x-3">
              <option.icon className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <div className="font-medium">{option.label}</div>
                <div className="text-sm text-muted-foreground">{option.description}</div>
              </div>
            </div>
            
            <Switch
              checked={notifications[option.key]}
              onCheckedChange={(checked) => {
                userProfileStore.preferences.notifications[option.key] = checked;
                markAsChanged();
              }}
            />
          </div>
        ))}
      </div>
    </PreferenceSection>
  );
}
```

### Phase 4: Activity Tab (Day 2 continued)

#### 4.1 Activity Feed
```tsx
function ActivityPanel() {
  const activityHistory = useStore(userProfileStore, s => s.activityHistory);
  const loadingActivity = useStore(userProfileStore, s => s.loading.loadingActivity);
  
  const [showAll, setShowAll] = useState(false);
  
  const loadMoreActivity = async () => {
    userProfileStore.loading.loadingActivity = true;
    
    try {
      const moreActivity = await fetchUserActivity(50, activityHistory.length);
      userProfileStore.activityHistory.push(...moreActivity);
    } catch (error) {
      userProfileStore.errors.network = 'Failed to load activity';
    } finally {
      userProfileStore.loading.loadingActivity = false;
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Recent Activity</h3>
        <Button
          variant="outline"
          onClick={loadMoreActivity}
          disabled={loadingActivity}
        >
          {loadingActivity ? 'Loading...' : 'Load More'}
        </Button>
      </div>
      
      <div className="space-y-3">
        {activityHistory.map(activity => (
          <ActivityItem key={activity.id} activity={activity} />
        ))}
        
        {activityHistory.length === 0 && (
          <div className="text-center py-12">
            <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No activity found</p>
          </div>
        )}
      </div>
    </div>
  );
}
```

#### 4.2 Activity Item Component
```tsx
function ActivityItem({ activity }: { activity: Activity }) {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'profile_update': return User;
      case 'preference_change': return Settings;
      case 'login': return LogIn;
      case 'password_change': return Key;
      case 'avatar_upload': return Upload;
      default: return Clock;
    }
  };
  
  const getActivityColor = (type: string) => {
    switch (type) {
      case 'profile_update': return 'text-blue-500 bg-blue-50';
      case 'preference_change': return 'text-green-500 bg-green-50';
      case 'login': return 'text-purple-500 bg-purple-50';
      case 'password_change': return 'text-red-500 bg-red-50';
      case 'avatar_upload': return 'text-orange-500 bg-orange-50';
      default: return 'text-gray-500 bg-gray-50';
    }
  };
  
  const Icon = getActivityIcon(activity.type);
  const colorClass = getActivityColor(activity.type);
  
  return (
    <div className="flex items-start space-x-3 p-3 rounded-lg hover:bg-muted/50">
      <div className={`p-2 rounded-full ${colorClass}`}>
        <Icon className="h-4 w-4" />
      </div>
      
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{activity.description}</p>
        <div className="flex items-center space-x-2 mt-1">
          <p className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
          </p>
          {activity.metadata && (
            <span className="text-xs px-2 py-1 bg-muted rounded">
              {activity.metadata.source || 'Web'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
```

### Phase 5: Form Management & Validation

#### 5.1 Change Tracking
```tsx
const markAsChanged = () => {
  userProfileStore.ui.hasChanges = true;
};

const hasProfileChanges = () => {
  const current = userProfileStore.profile;
  const original = userProfileStore.meta.originalProfile;
  
  if (!original) return false;
  
  return JSON.stringify(current) !== JSON.stringify(original);
};
```

#### 5.2 Save Functionality
```tsx
const saveProfile = async () => {
  userProfileStore.loading.saving = true;
  userProfileStore.errors.fields = {};
  
  try {
    // Validate before saving
    const validation = validateProfile(userProfileStore.profile);
    if (!validation.valid) {
      userProfileStore.errors.fields = validation.errors;
      return;
    }
    
    // Save to server
    const updatedProfile = await updateUserProfile(userProfileStore.profile);
    
    // Update store
    userProfileStore.profile = updatedProfile;
    userProfileStore.meta.originalProfile = { ...updatedProfile };
    userProfileStore.ui.hasChanges = false;
    userProfileStore.ui.isEditing = false;
    userProfileStore.meta.lastSaved = new Date().toISOString();
    
    // Add activity entry
    userProfileStore.activityHistory.unshift({
      id: Date.now().toString(),
      type: 'profile_update',
      description: 'Profile updated',
      timestamp: new Date().toISOString(),
      metadata: { fields: Object.keys(validation.changedFields) }
    });
    
  } catch (error) {
    userProfileStore.errors.general = 'Failed to save profile';
  } finally {
    userProfileStore.loading.saving = false;
  }
};
```

## Mock Data & API Simulation

### Profile Data
```tsx
export const mockUserProfile = {
  id: 'user-123',
  name: 'Sarah Chen',
  email: 'sarah.chen@example.com',
  avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b77c?w=200&h=200&fit=crop&crop=face',
  bio: 'Frontend developer passionate about user experience and clean code. Love working with React and exploring new technologies.',
  location: 'San Francisco, CA',
  website: 'https://sarahchen.dev',
  phone: '+1 (555) 123-4567',
  company: 'Tech Innovations Inc',
  title: 'Senior Frontend Developer',
  birthDate: '1990-05-15',
  joinDate: '2020-03-10',
};
```

### Activity Data
```tsx
export const mockActivity = [
  {
    id: '1',
    type: 'profile_update',
    description: 'Updated profile bio',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    metadata: { fields: ['bio'] }
  },
  {
    id: '2',
    type: 'preference_change',
    description: 'Changed theme to dark mode',
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    metadata: { from: 'light', to: 'dark' }
  },
  // ... more activities
];
```

## Success Criteria

### ✅ Must Achieve:
1. **Complete Profile Management**: Full CRUD operations for user profile
2. **Preferences System**: Comprehensive settings management
3. **Activity Tracking**: User action history with proper timestamps
4. **Form Validation**: Client-side validation with helpful error messages  
5. **State Persistence**: Changes tracked and saved properly
6. **Loading States**: Clear feedback for all async operations
7. **Error Handling**: Graceful error recovery and user feedback

### 📱 User Experience:
1. **Intuitive Navigation**: Easy switching between tabs
2. **Smooth Editing**: Seamless toggle between view/edit modes  
3. **Visual Feedback**: Clear indication of unsaved changes
4. **Responsive Design**: Works perfectly on all device sizes
5. **Accessibility**: Proper labels, keyboard navigation, screen reader support

### 📊 Educational Value:
1. **Single Store Complexity**: Demonstrates managing complex state in one store
2. **Async Pattern**: Shows proper async data loading and error handling
3. **Form Management**: Illustrates complex form state management
4. **State Normalization**: Proper organization of related data
5. **Performance**: Efficient updates with selective subscriptions

This implementation will provide a comprehensive example of single-store state management while delivering a professional user profile experience.