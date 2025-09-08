import { Button } from "@/components/ui/button";
import { UserPlus, MessageCircle, Share2 } from "lucide-react";

interface ProfileActionsProps {
  userId: number;
}

export function ProfileActions({ userId }: ProfileActionsProps) {
  const handleFollow = () => {
    alert(`Follow functionality would be implemented for user ${userId}`);
  };

  const handleMessage = () => {
    alert(`Message functionality would be implemented for user ${userId}`);
  };

  const handleShare = () => {
    alert(`Share profile functionality would be implemented for user ${userId}`);
  };

  return (
    <div className="flex gap-3">
      <Button onClick={handleFollow} className="flex-1">
        <UserPlus className="h-4 w-4 mr-2" />
        Follow
      </Button>
      <Button onClick={handleMessage} variant="outline" className="flex-1">
        <MessageCircle className="h-4 w-4 mr-2" />
        Message
      </Button>
      <Button onClick={handleShare} variant="outline" size="icon">
        <Share2 className="h-4 w-4" />
      </Button>
    </div>
  );
}