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
    <div className="flex space-x-3">
      <button
        onClick={handleFollow}
        className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-4 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-medium flex items-center justify-center"
      >
        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
        Follow
      </button>
      <button
        onClick={handleMessage}
        className="flex-1 border border-gray-300 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 font-medium flex items-center justify-center"
      >
        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        Message
      </button>
      <button
        onClick={handleShare}
        className="border border-gray-300 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 flex items-center justify-center"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
        </svg>
      </button>
    </div>
  );
}