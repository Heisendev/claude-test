import React, { useState } from 'react'
import { BrowserRouter as Router, Routes, Route, useNavigate, useParams } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import ChatInterface from './components/ChatInterface'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/chat/:conversationId?" element={<ChatPage />} />
        <Route path="/share/:shareToken" element={<SharedConversation />} />
      </Routes>
    </Router>
  )
}

function HomePage() {
  const navigate = useNavigate();

  const createConversation = async () => {
    try {
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'New Conversation' })
      });

      if (response.ok) {
        const conversation = await response.json();
        navigate(`/chat/${conversation.id}`);
      }
    } catch (error) {
      console.error('Error creating conversation:', error);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-white dark:bg-[#1A1A1A]">
      <div className="text-center">
        <h1 className="text-4xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Welcome to Claude</h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
          Your AI assistant for any task
        </p>
        <button
          onClick={createConversation}
          className="px-6 py-3 bg-[#CC785C] text-white rounded-lg font-medium hover:bg-[#b86949] transition-colors"
        >
          Start New Conversation
        </button>
      </div>
    </div>
  )
}

function ChatPage() {
  const { conversationId } = useParams();
  const [currentConversationId, setCurrentConversationId] = useState(conversationId);

  // Update when URL changes
  React.useEffect(() => {
    setCurrentConversationId(conversationId);
  }, [conversationId]);

  return (
    <div className="flex h-screen bg-white dark:bg-[#1A1A1A]">
      <Sidebar
        currentConversationId={currentConversationId}
        onConversationSelect={setCurrentConversationId}
      />
      <div className="flex-1">
        {currentConversationId ? (
          <ChatInterface conversationId={currentConversationId} />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
                Select a conversation or start a new one
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Choose from the sidebar or click "New Chat" to begin
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function SharedConversation() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-white dark:bg-[#1A1A1A]">
      <div className="text-center">
        <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Shared Conversation</h2>
        <p className="text-gray-600 dark:text-gray-400">
          Coming soon: View shared conversations
        </p>
      </div>
    </div>
  )
}

export default App
