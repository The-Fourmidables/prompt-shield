import { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send } from 'lucide-react';

interface Message {
  id: string;
  content: string;
  timestamp: Date;
}

interface ChatPanelProps {
  title: string;
  variant: 'user' | 'ai';
  onSendMessage?: (message: string) => void;
  aiMessages?: Message[];
}

function ChatPanel({ title, variant, onSendMessage, aiMessages }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const displayMessages = variant === 'ai' ? (aiMessages || []) : messages;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [displayMessages]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleSendMessage = () => {
    if (!input.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      content: input,
      timestamp: new Date(),
    };

    setMessages([...messages, newMessage]);
    onSendMessage?.(input);
    setInput('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-white">
      <div className={`px-6 py-4 border-b border-gray-200 ${
        variant === 'user' ? 'bg-blue-50' : 'bg-green-50'
      }`}>
        <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <MessageSquare size={20} className={variant === 'user' ? 'text-blue-600' : 'text-green-600'} />
          {title}
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {displayMessages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-gray-400">
            <div className="text-center">
              <MessageSquare size={48} className="mx-auto mb-3 opacity-50" />
              <p className="text-sm">No messages yet</p>
            </div>
          </div>
        ) : (
          <>
            {displayMessages.map((message) => (
              <div
                key={message.id}
                className={`p-4 rounded-lg shadow-sm ${
                  variant === 'user'
                    ? 'bg-blue-50 border border-blue-100'
                    : 'bg-green-50 border border-green-100'
                }`}
              >
                <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">
                  {message.content}
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  {formatTime(message.timestamp)}
                </p>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {variant === 'user' && (
        <div className="px-6 py-4 border-t border-gray-200 bg-white">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
            <button
              onClick={handleSendMessage}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 font-medium text-sm"
            >
              <Send size={16} />
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ChatPanel;
