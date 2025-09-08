import { Users, UserCheck, FileText } from "lucide-react";
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
    <div className="mb-6 grid grid-cols-3 gap-4">
      <div className="rounded-lg border bg-card p-4 text-center">
        <div className="flex items-center justify-center mb-2">
          <Users className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="text-2xl font-bold mb-1">
          {formatNumber(stats.followers)}
        </div>
        <div className="text-sm text-muted-foreground font-medium">Followers</div>
      </div>
      <div className="rounded-lg border bg-card p-4 text-center">
        <div className="flex items-center justify-center mb-2">
          <UserCheck className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="text-2xl font-bold mb-1">
          {formatNumber(stats.following)}
        </div>
        <div className="text-sm text-muted-foreground font-medium">Following</div>
      </div>
      <div className="rounded-lg border bg-card p-4 text-center">
        <div className="flex items-center justify-center mb-2">
          <FileText className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="text-2xl font-bold mb-1">
          {formatNumber(stats.posts)}
        </div>
        <div className="text-sm text-muted-foreground font-medium">Posts</div>
      </div>
    </div>
  );
}