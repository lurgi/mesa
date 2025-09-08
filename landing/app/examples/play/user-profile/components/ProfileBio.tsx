import { User } from "lucide-react";

interface ProfileBioProps {
  bio: string;
}

export function ProfileBio({ bio }: ProfileBioProps) {
  return (
    <div className="mb-6">
      <h2 className="mb-3 flex items-center text-lg font-semibold">
        <User className="mr-2 h-5 w-5 text-muted-foreground" />
        About
      </h2>
      <div className="rounded-lg border bg-card p-4">
        <p className="leading-relaxed text-sm">{bio}</p>
      </div>
    </div>
  );
}