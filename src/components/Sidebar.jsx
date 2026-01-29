import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Sidebar({ currentConversationId, onConversationSelect }) {
  const [conversations, setConversations] = useState([]);
  const [isCreating, setIsCreating] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadConversations();

    // Listen for conversation updates
    const handleConversationUpdate = () => {
      loadConversations();
    };

    window.addEventListener('conversation-updated', handleConversationUpdate);

    return () => {
      window.removeEventListener('conversation-updated', handleConversationUpdate);
    };
  }, []);

  const loadConversations = async () => {
    try {
      const response = await fetch('/api/conversations');
      if (response.ok) {
        const data = await response.json();
        setConversations(data);
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  };

  const createNewConversation = async () => {
    if (isCreating) return;
    setIsCreating(true);

    try {
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'New Conversation' })
      });

      if (response.ok) {
        const newConversation = await response.json();
        setConversations(prev => [newConversation, ...prev]);
        onConversationSelect(newConversation.id);
        navigate(`/chat/${newConversation.id}`);
      }
    } catch (error) {
      console.error('Error creating conversation:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const deleteConversation = async (conversationId, e) => {
    e.stopPropagation();

    if (!confirm('Are you sure you want to delete this conversation?')) {
      return;
    }

    try {
      const response = await fetch(`/api/conversations/${conversationId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setConversations(prev => prev.filter(c => c.id !== conversationId));

        // If deleting current conversation, redirect to home
        if (conversationId === currentConversationId) {
          navigate('/');
        }
      }
    } catch (error) {
      console.error('Error deleting conversation:', error);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="w-64 h-screen bg-[#F5F5F5] dark:bg-[#2A2A2A] border-r border-gray-200 dark:border-gray-800 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-800">
        <button
          onClick={createNewConversation}
          disabled={isCreating}
          className="w-full px-4 py-3 bg-[#CC785C] text-white rounded-lg font-medium
                   hover:bg-[#b86949] transition-colors disabled:opacity-50
                   disabled:cursor-not-allowed flex items-center justify-center space-x-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>New Chat</span>
        </button>
      </div>

      {/* Conversations list */}
      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="p-4 text-center text-gray-500 dark:text-gray-400 text-sm">
            No conversations yet
          </div>
        ) : (
          <div className="py-2">
            {conversations.map((conversation) => (
              <div
                key={conversation.id}
                onClick={() => {
                  onConversationSelect(conversation.id);
                  navigate(`/chat/${conversation.id}`);
                }}
                className={`mx-2 mb-1 px-3 py-3 rounded-lg cursor-pointer group relative
                          transition-colors ${
                            conversation.id === currentConversationId
                              ? 'bg-white dark:bg-[#3A3A3A] shadow-sm'
                              : 'hover:bg-white dark:hover:bg-[#3A3A3A]'
                          }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0 pr-8">
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {conversation.title || 'New Conversation'}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {formatDate(conversation.last_message_at || conversation.created_at)}
                    </div>
                  </div>

                  <button
                    onClick={(e) => deleteConversation(conversation.id, e)}
                    className="absolute right-2 top-3 opacity-0 group-hover:opacity-100
                             p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700
                             transition-opacity"
                  >
                    <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-800">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-700 flex items-center justify-center">
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">U</span>
          </div>
          <div className="flex-1">
            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">Default User</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Free Plan</div>
          </div>
        </div>
      </div>
    </div>
  );
}
