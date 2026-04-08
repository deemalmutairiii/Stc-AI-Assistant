import { useState, useRef, useEffect } from 'react';
import { ChatBubble } from '../components/ChatBubble';
import { QuickActions } from '../components/QuickActions';
import { ChatInput } from '../components/ChatInput';
import { RecommendationCard } from '../components/RecommendationCard';
import stcLogo from '../assets/stc.png';

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: string;
  type?: 'text' | 'recommendation';
  recommendationData?: {
    planName: string;
    price: string;
    data: string;
    features: string[];
    whyThisPlan: string;
    alternativePlan?: string;
  };
}

interface Conversation {
  id: string;
  title: string;
  messages: Message[];
}

const createEmptyConversation = (): Conversation => ({
  id: Date.now().toString(),
  title: 'New Chat',
  messages: [],
});

export default function App() {
  const [conversations, setConversations] = useState<Conversation[]>(() => {
    const saved = localStorage.getItem('conversations');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch (error) {
        console.error('Failed to parse saved conversations', error);
      }
    }
    return [createEmptyConversation()];
  });

  const [activeChatId, setActiveChatId] = useState<string>(() => {
    const savedActive = localStorage.getItem('activeChatId');
    return savedActive || '';
  });

  const [isTyping, setIsTyping] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem('conversations', JSON.stringify(conversations));
  }, [conversations]);

  useEffect(() => {
    if (activeChatId) {
      localStorage.setItem('activeChatId', activeChatId);
    }
  }, [activeChatId]);

  useEffect(() => {
    if (!activeChatId && conversations.length > 0) {
      setActiveChatId(conversations[0].id);
    }
  }, [activeChatId, conversations]);

  const activeConversation =
    conversations.find((chat) => chat.id === activeChatId) || conversations[0];

  const messages = activeConversation?.messages || [];

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const getCurrentTime = () => {
    return new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const createNewChat = () => {
    const newChat = createEmptyConversation();
    setConversations((prev) => [newChat, ...prev]);
    setActiveChatId(newChat.id);
    setIsTyping(false);
  };

  const updateConversationMessages = (chatId: string, newMessages: Message[]) => {
    setConversations((prev) =>
      prev.map((chat) => {
        if (chat.id !== chatId) return chat;

        let updatedTitle = chat.title;

        if (chat.title === 'New Chat') {
          const firstUserMessage = newMessages.find((msg) => msg.isUser)?.content?.trim();
          if (firstUserMessage) {
            updatedTitle =
              firstUserMessage.length > 24
                ? `${firstUserMessage.slice(0, 24)}...`
                : firstUserMessage;
          }
        }

        return {
          ...chat,
          title: updatedTitle,
          messages: newMessages,
        };
      })
    );
  };

  const renameChat = (id: string) => {
    const currentChat = conversations.find((chat) => chat.id === id);
    if (!currentChat) return;

    const newTitle = window.prompt('Enter a new chat name:', currentChat.title);
    if (!newTitle || !newTitle.trim()) return;

    setConversations((prev) =>
      prev.map((chat) =>
        chat.id === id ? { ...chat, title: newTitle.trim() } : chat
      )
    );
  };

  const deleteChat = (id: string) => {
    const confirmed = window.confirm('Delete this chat?');
    if (!confirmed) return;

    const updatedChats = conversations.filter((chat) => chat.id !== id);

    if (updatedChats.length === 0) {
      const fallbackChat = createEmptyConversation();
      setConversations([fallbackChat]);
      setActiveChatId(fallbackChat.id);
      return;
    }

    setConversations(updatedChats);

    if (activeChatId === id) {
      setActiveChatId(updatedChats[0].id);
    }
  };

  const handleSendMessage = async (content: string) => {
    const trimmed = content.trim();
    if (!trimmed || !activeConversation) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      content: trimmed,
      isUser: true,
      timestamp: getCurrentTime(),
      type: 'text',
    };

    const updatedMessages = [...activeConversation.messages, newMessage];
    updateConversationMessages(activeConversation.id, updatedMessages);
    setIsTyping(true);

    try {
      const res = await fetch('https://abc-backend.ngrok-free.app/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: updatedMessages.map((m) => ({
            role: m.isUser ? 'user' : 'assistant',
            content: m.content,
          })),
        }),
      });

      if (!res.ok) {
        throw new Error(`Request failed with status ${res.status}`);
      }

      const data = await res.json();

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data.reply ?? 'No response received.',
        isUser: false,
        timestamp: getCurrentTime(),
        type: 'text',
      };

      updateConversationMessages(activeConversation.id, [...updatedMessages, botMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: 'Error connecting to assistant.',
        isUser: false,
        timestamp: getCurrentTime(),
        type: 'text',
      };

      updateConversationMessages(activeConversation.id, [...updatedMessages, errorMessage]);
      console.error(error);
    } finally {
      setIsTyping(false);
    }
  };

  const handleQuickAction = async (action: string) => {
    await handleSendMessage(action);
  };

  const handleSelectPlan = () => {
    alert('Plan selected!');
  };

  return (
    <div className="relative flex h-screen bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
      <button
        onClick={() => setIsSidebarOpen((prev) => !prev)}
        className={`absolute top-4 left-4 z-50 bg-white border border-gray-200 rounded-2xl p-2 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-105 ${
          isSidebarOpen ? 'scale-95' : 'scale-100'
        }`}
      >
        <img
          src={stcLogo}
          alt="STC Logo"
          className={`object-contain transition-all duration-300 ${
            isSidebarOpen ? 'w-9 h-9' : 'w-10 h-10'
          }`}
        />
      </button>

      <div
        className={`bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ease-in-out overflow-hidden ${
          isSidebarOpen ? 'w-72 p-4 opacity-100' : 'w-0 p-0 opacity-0 border-r-0'
        }`}
      >
        <div className="mt-16" />

        <button
          onClick={createNewChat}
          className="mb-5 bg-purple-600 hover:bg-purple-700 text-white p-3 rounded-xl w-full transition-all duration-200 hover:scale-[1.01]"
        >
          + New Chat
        </button>

        <div className="text-sm font-semibold text-gray-500 mb-3 px-1">Chats</div>

        <div className="flex-1 overflow-y-auto space-y-2">
          {conversations.map((chat) => (
            <div
              key={chat.id}
              className={`rounded-xl transition-all duration-200 ${
                chat.id === activeChatId
                  ? 'bg-purple-100 text-purple-800'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
              }`}
            >
              <button
                onClick={() => setActiveChatId(chat.id)}
                className="w-full text-left p-3"
              >
                <div className="truncate text-sm font-medium">{chat.title}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {chat.messages.length > 0
                    ? `${chat.messages.length} messages`
                    : 'No messages yet'}
                </div>
              </button>

              <div className="flex gap-2 px-3 pb-3">
                <button
                  onClick={() => renameChat(chat.id)}
                  className="text-xs bg-white hover:bg-gray-50 border border-gray-200 rounded-md px-2 py-1 transition"
                >
                  Rename
                </button>
                <button
                  onClick={() => deleteChat(chat.id)}
                  className="text-xs bg-white hover:bg-red-50 border border-gray-200 rounded-md px-2 py-1 text-red-600 transition"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col transition-all duration-300 ease-in-out">

        <div className="flex-1 overflow-y-auto px-6 py-8">
          <div className="max-w-[800px] mx-auto">
            {messages.length === 0 ? (
              <div className="text-center py-20 animate-[fadeIn_0.3s_ease-in-out]">
                <h2 className="text-2xl text-gray-900 mb-3">
                  How can I help you today?
                </h2>
                <p className="text-gray-600">
                  Ask about plans, roaming, or internet issues
                </p>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className="animate-[fadeIn_0.25s_ease-in-out]"
                >
                  {message.type === 'text' ? (
                    <ChatBubble
                      message={message.content}
                      isUser={message.isUser}
                      timestamp={message.timestamp}
                    />
                  ) : message.type === 'recommendation' && message.recommendationData ? (
                    <div className="mb-6">
                      <ChatBubble
                        message={message.content}
                        isUser={message.isUser}
                        timestamp={message.timestamp}
                      />
                      <div className="flex justify-start mt-4">
                        <RecommendationCard
                          {...message.recommendationData}
                          onSelectPlan={handleSelectPlan}
                        />
                      </div>
                    </div>
                  ) : null}
                </div>
              ))
            )}

            {isTyping && (
              <div className="flex justify-start mb-6 animate-[fadeIn_0.2s_ease-in-out]">
                <div className="bg-gray-800 text-white rounded-[20px] px-5 py-4 shadow-sm">
                  <div className="flex gap-1">
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: '0ms' }}
                    />
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: '150ms' }}
                    />
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: '300ms' }}
                    />
                  </div>
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>
        </div>

        <div className="flex-shrink-0 bg-white border-t border-gray-200 px-6 py-6">
          <div className="max-w-[800px] mx-auto">
            {messages.length === 0 && (
              <QuickActions onActionClick={handleQuickAction} />
            )}
            <ChatInput onSendMessage={handleSendMessage} disabled={isTyping} />
          </div>
        </div>
      </div>
    </div>
  );
}