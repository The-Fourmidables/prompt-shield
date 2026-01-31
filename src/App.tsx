import { useState } from 'react';
import ChatPanel from './components/ChatPanel';

interface Message {
  id: string;
  content: string;
  timestamp: Date;
}

function App() {
  const [aiMessages, setAiMessages] = useState<Message[]>([]);

  const handleUserMessage = (message: string) => {
    setTimeout(() => {
      const aiResponse: Message = {
        id: Date.now().toString(),
        content: 'AI response will appear here',
        timestamp: new Date(),
      };
      setAiMessages((prev) => [...prev, aiResponse]);
    }, 500);
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
        <h1 className="text-2xl font-semibold text-gray-800">Prompt Shield</h1>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <ChatPanel
          title="User Messages"
          variant="user"
          onSendMessage={handleUserMessage}
        />

        <div className="w-px bg-gray-300"></div>

        <ChatPanel
          title="AI Responses"
          variant="ai"
          aiMessages={aiMessages}
        />
      </div>
    </div>
  );
}

export default App;
