import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-white dark:bg-[#1A1A1A] text-[#1A1A1A] dark:text-[#E5E5E5]">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/chat/:conversationId?" element={<ChatPage />} />
          <Route path="/share/:shareToken" element={<SharedConversation />} />
        </Routes>
      </div>
    </Router>
  )
}

// Placeholder components - will be implemented later
function HomePage() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-4xl font-semibold mb-4">Welcome to Claude</h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
          Your AI assistant for any task
        </p>
        <button className="px-6 py-3 bg-[#CC785C] text-white rounded-lg font-medium hover:bg-[#b86949] transition-colors">
          Start New Conversation
        </button>
      </div>
    </div>
  )
}

function ChatPage() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h2 className="text-2xl font-semibold mb-4">Chat Interface</h2>
        <p className="text-gray-600 dark:text-gray-400">
          Coming soon: Full chat interface with streaming responses
        </p>
      </div>
    </div>
  )
}

function SharedConversation() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h2 className="text-2xl font-semibold mb-4">Shared Conversation</h2>
        <p className="text-gray-600 dark:text-gray-400">
          Coming soon: View shared conversations
        </p>
      </div>
    </div>
  )
}

export default App
