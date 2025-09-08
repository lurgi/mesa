interface ProfileBioProps {
  bio: string;
}

export function ProfileBio({ bio }: ProfileBioProps) {
  return (
    <div className="mb-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
        <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
        About
      </h2>
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <p className="text-gray-700 leading-relaxed">{bio}</p>
      </div>
    </div>
  );
}