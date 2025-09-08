import { MapPin, Calendar } from "lucide-react";
import { User } from "../types/user";

interface ProfileHeaderProps {
  user: User;
}

export function ProfileHeader({ user }: ProfileHeaderProps) {
  return (
    <div className="flex items-center space-x-4 mb-6">
      <img
        src={user.avatar}
        alt={user.name}
        className="h-20 w-20 rounded-full object-cover border-2 border-border shadow-sm"
      />
      <div>
        <h1 className="text-2xl font-bold tracking-tight mb-1">{user.name}</h1>
        <p className="text-muted-foreground mb-2">{user.email}</p>
        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
          <span className="flex items-center">
            <MapPin className="h-4 w-4 mr-1" />
            {user.location}
          </span>
          <span className="flex items-center">
            <Calendar className="h-4 w-4 mr-1" />
            Joined{" "}
            {new Date(user.joinDate).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </span>
        </div>
      </div>
    </div>
  );
}
