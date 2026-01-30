import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Sidebar({ currentConversationId, onConversationSelect }) {
  const [conversations, setConversations] = useState([]);
  const [filteredConversations, setFilteredConversations] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState({});
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
        setFilteredConversations(data);
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  };

  // Filter conversations based on search query, archive status, and sort by pinned status
  useEffect(() => {
    let filtered = conversations;

    // Filter by archive status
    filtered = filtered.filter(conv =>
      showArchived ? conv.is_archived : !conv.is_archived
    );

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(conv =>
        conv.title?.toLowerCase().includes(query) ||
        'new conversation'.includes(query)
      );
    }

    // Sort: pinned conversations first, then by date
    const sorted = [...filtered].sort((a, b) => {
      // Pinned conversations come first
      if (a.is_pinned && !b.is_pinned) return -1;
      if (!a.is_pinned && b.is_pinned) return 1;

      // Then sort by last_message_at or created_at
      const dateA = new Date(a.last_message_at || a.created_at);
      const dateB = new Date(b.last_message_at || b.created_at);
      return dateB - dateA;
    });

    setFilteredConversations(sorted);
  }, [searchQuery, conversations, showArchived]);

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

  const togglePinConversation = async (conversationId, currentlyPinned, e) => {
    e.stopPropagation();

    try {
      const response = await fetch(`/api/conversations/${conversationId}/pin`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pinned: !currentlyPinned })
      });

      if (response.ok) {
        const updatedConversation = await response.json();
        setConversations(prev =>
          prev.map(c => c.id === conversationId ? updatedConversation : c)
        );
      }
    } catch (error) {
      console.error('Error pinning conversation:', error);
    }
  };

  const toggleArchiveConversation = async (conversationId, currentlyArchived, e) => {
    e.stopPropagation();

    try {
      const response = await fetch(`/api/conversations/${conversationId}/archive`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ archived: !currentlyArchived })
      });

      if (response.ok) {
        const updatedConversation = await response.json();
        setConversations(prev =>
          prev.map(c => c.id === conversationId ? updatedConversation : c)
        );
      }
    } catch (error) {
      console.error('Error archiving conversation:', error);
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

  const getDateGroup = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const convDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    if (convDate.getTime() === today.getTime()) return 'Today';
    if (convDate.getTime() === yesterday.getTime()) return 'Yesterday';
    if (convDate >= sevenDaysAgo) return 'Previous 7 Days';
    if (convDate >= thirtyDaysAgo) return 'Previous 30 Days';
    return 'Older';
  };

  const groupConversationsByDate = (conversations) => {
    const groups = {
      'Today': [],
      'Yesterday': [],
      'Previous 7 Days': [],
      'Previous 30 Days': [],
      'Older': []
    };

    conversations.forEach(conv => {
      const group = getDateGroup(conv.last_message_at || conv.created_at);
      groups[group].push(conv);
    });

    // Return only groups that have conversations
    return Object.entries(groups).filter(([_, convs]) => convs.length > 0);
  };

  const toggleGroup = (groupName) => {
    setCollapsedGroups(prev => ({
      ...prev,
      [groupName]: !prev[groupName]
    }));
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

      {/* Search input */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-800">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-3 py-2 bg-white dark:bg-[#3A3A3A] border border-gray-300 dark:border-gray-700
                     rounded-lg text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400
                     focus:outline-none focus:ring-2 focus:ring-[#CC785C] focus:border-transparent"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Archive toggle */}
        <div className="mt-3 flex items-center justify-between">
          <button
            onClick={() => setShowArchived(!showArchived)}
            className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
            </svg>
            <span>{showArchived ? 'Show Active' : 'Show Archived'}</span>
          </button>
          {showArchived && (
            <span className="text-xs text-gray-500 dark:text-gray-500">
              {filteredConversations.length} archived
            </span>
          )}
        </div>
      </div>

      {/* Conversations list */}
      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="p-4 text-center text-gray-500 dark:text-gray-400 text-sm">
            No conversations yet
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="p-4 text-center text-gray-500 dark:text-gray-400 text-sm">
            No conversations match "{searchQuery}"
          </div>
        ) : (
          <div className="py-2">
            {groupConversationsByDate(filteredConversations).map(([groupName, groupConversations]) => (
              <div key={groupName} className="mb-4">
                {/* Group header */}
                <button
                  onClick={() => toggleGroup(groupName)}
                  className="w-full px-4 py-2 flex items-center justify-between text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                >
                  <span>{groupName}</span>
                  <svg
                    className={`w-4 h-4 transition-transform ${collapsedGroups[groupName] ? '-rotate-90' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Group conversations */}
                {!collapsedGroups[groupName] && groupConversations.map((conversation) => (
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
                  <div className="flex-1 min-w-0 pr-16">
                    <div className="flex items-center space-x-2">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        {conversation.title || 'New Conversation'}
                      </div>
                      {conversation.is_pinned ? (
                        <svg className="w-3 h-3 text-[#CC785C] flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10 2a.75.75 0 01.75.75v8.59l2.95-2.95a.75.75 0 111.06 1.06l-4.25 4.25a.75.75 0 01-1.06 0L5.2 9.45a.75.75 0 011.06-1.06l2.95 2.95V2.75A.75.75 0 0110 2z"/>
                        </svg>
                      ) : null}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {formatDate(conversation.last_message_at || conversation.created_at)}
                    </div>
                  </div>

                  <div className="absolute right-2 top-3 flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {!showArchived && (
                      <button
                        onClick={(e) => togglePinConversation(conversation.id, conversation.is_pinned, e)}
                        className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
                        title={conversation.is_pinned ? 'Unpin conversation' : 'Pin conversation'}
                      >
                        <svg className={`w-4 h-4 ${conversation.is_pinned ? 'text-[#CC785C]' : 'text-gray-500 dark:text-gray-400'}`} fill={conversation.is_pinned ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 20 20">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 2a.75.75 0 01.75.75v8.59l2.95-2.95a.75.75 0 111.06 1.06l-4.25 4.25a.75.75 0 01-1.06 0L5.2 9.45a.75.75 0 011.06-1.06l2.95 2.95V2.75A.75.75 0 0110 2z"/>
                        </svg>
                      </button>
                    )}
                    <button
                      onClick={(e) => toggleArchiveConversation(conversation.id, conversation.is_archived, e)}
                      className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
                      title={conversation.is_archived ? 'Unarchive conversation' : 'Archive conversation'}
                    >
                      <svg className={`w-4 h-4 ${conversation.is_archived ? 'text-[#CC785C]' : 'text-gray-500 dark:text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                      </svg>
                    </button>
                    <button
                      onClick={(e) => deleteConversation(conversation.id, e)}
                      className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
                      title="Delete conversation"
                    >
                      <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
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
