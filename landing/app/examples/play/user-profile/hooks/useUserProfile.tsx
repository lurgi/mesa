import { useInitSync } from "mesa-react";
import { userStore, playgroundStore, incrementRetryCount } from '../stores';
import { fetchUserProfile } from '../services/mockApi';

export const useUserProfile = () => {
  const { loading, error, refetch } = useInitSync(userStore, async (state) => {
    // 실행 시점에 최신 playgroundStore 값 사용
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
    onError: (err) => {
      console.error('Failed to load user profile:', err);
      incrementRetryCount();
    }
  });

  return { loading, error, refetch };
};