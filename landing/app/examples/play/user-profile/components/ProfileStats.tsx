import { User } from '../types/user';

interface ProfileStatsProps {
  stats: User['stats'];
}

export function ProfileStats({ stats }: ProfileStatsProps) {
  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  return (
    <div className="grid grid-cols-3 gap-4 mb-6">
      <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg text-center border border-blue-200">
        <div className="text-2xl font-bold text-blue-900 mb-1">
          {formatNumber(stats.followers)}
        </div>
        <div className="text-sm text-blue-700 font-medium">Followers</div>
      </div>
      <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg text-center border border-green-200">
        <div className="text-2xl font-bold text-green-900 mb-1">
          {formatNumber(stats.following)}
        </div>
        <div className="text-sm text-green-700 font-medium">Following</div>
      </div>
      <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg text-center border border-purple-200">
        <div className="text-2xl font-bold text-purple-900 mb-1">
          {formatNumber(stats.posts)}
        </div>
        <div className="text-sm text-purple-700 font-medium">Posts</div>
      </div>
    </div>
  );
}