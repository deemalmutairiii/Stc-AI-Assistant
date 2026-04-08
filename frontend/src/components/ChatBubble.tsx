interface ChatBubbleProps {
  message: string;
  isUser: boolean;
  timestamp?: string;
}

export function ChatBubble({ message, isUser, timestamp }: ChatBubbleProps) {
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-6`}>
      <div
        className={`max-w-[75%] rounded-[20px] px-5 py-4 shadow-sm transition-all duration-200 ${
          isUser
            ? 'bg-gradient-to-r from-[#5C0F8B] to-[#7B2CBF] text-white'
            : 'bg-gray-800 text-white'
        }`}
      >
        <p className="text-[15px] leading-relaxed whitespace-pre-wrap">
          {message}
        </p>

        {timestamp && (
          <p
            className={`text-xs mt-2 ${
              isUser ? 'text-white/70' : 'text-gray-400'
            }`}
          >
            {timestamp}
          </p>
        )}
      </div>
    </div>
  );
}
