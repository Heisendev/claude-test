import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { okaidia } from 'react-syntax-highlighter/dist/esm/styles/prism';

export default function ChatInterface({ conversationId }) {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState('');
  const [conversationTitle, setConversationTitle] = useState('');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInputValue, setTitleInputValue] = useState('');
  const [selectedModel, setSelectedModel] = useState('claude-sonnet-4-20250514');
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const titleInputRef = useRef(null);
  const modelDropdownRef = useRef(null);

  // Available models
  const models = [
    {
      id: 'claude-sonnet-4-20250514',
      name: 'Claude Sonnet 4.5',
      description: 'Balanced intelligence and speed',
      contextWindow: '200K tokens'
    },
    {
      id: 'claude-haiku-4-20250417',
      name: 'Claude Haiku 4.5',
      description: 'Fast and efficient',
      contextWindow: '200K tokens'
    },
    {
      id: 'claude-opus-4-20250514',
      name: 'Claude Opus 4.1',
      description: 'Most capable model',
      contextWindow: '200K tokens'
    }
  ];

  // Auto-scroll to bottom when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingMessage]);

  // Load messages and conversation details
  useEffect(() => {
    if (conversationId) {
      loadMessages();
      loadConversationDetails();
    }
  }, [conversationId]);

  // Focus title input when editing starts
  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [isEditingTitle]);

  // Click outside handler for model dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modelDropdownRef.current && !modelDropdownRef.current.contains(event.target)) {
        setIsModelDropdownOpen(false);
      }
    };

    if (isModelDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isModelDropdownOpen]);

  const loadMessages = async () => {
    try {
      const response = await fetch(`/api/conversations/${conversationId}/messages`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const loadConversationDetails = async () => {
    try {
      const response = await fetch(`/api/conversations/${conversationId}`);
      if (response.ok) {
        const data = await response.json();
        setConversationTitle(data.title || 'New Conversation');
        // Load model from conversation settings
        if (data.model) {
          setSelectedModel(data.model);
        } else if (data.settings && data.settings.model) {
          setSelectedModel(data.settings.model);
        }
      }
    } catch (error) {
      console.error('Error loading conversation details:', error);
    }
  };

  const startEditingTitle = () => {
    setTitleInputValue(conversationTitle);
    setIsEditingTitle(true);
  };

  const saveTitle = async () => {
    if (!titleInputValue.trim()) {
      setIsEditingTitle(false);
      return;
    }

    try {
      const response = await fetch(`/api/conversations/${conversationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: titleInputValue.trim() })
      });

      if (response.ok) {
        setConversationTitle(titleInputValue.trim());
        setIsEditingTitle(false);
        // Trigger a re-fetch of conversations in sidebar
        window.dispatchEvent(new CustomEvent('conversation-updated'));
      }
    } catch (error) {
      console.error('Error updating conversation title:', error);
      setIsEditingTitle(false);
    }
  };

  const handleTitleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveTitle();
    } else if (e.key === 'Escape') {
      setIsEditingTitle(false);
    }
  };

  const handleModelChange = async (modelId) => {
    setSelectedModel(modelId);
    setIsModelDropdownOpen(false);

    // Update conversation settings with the new model
    try {
      await fetch(`/api/conversations/${conversationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: modelId })
      });
      // Trigger a re-fetch of conversations in sidebar
      window.dispatchEvent(new CustomEvent('conversation-updated'));
    } catch (error) {
      console.error('Error updating model:', error);
    }
  };

  const sendMessage = async () => {
    if (!inputValue.trim() || isStreaming) return;

    const userMessage = {
      role: 'user',
      content: inputValue,
      created_at: new Date().toISOString()
    };

    // Add user message to UI immediately
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsStreaming(true);
    setStreamingMessage('');

    try {
      const response = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: userMessage.content,
          model: selectedModel
        })
      });

      // Check if response is successful
      if (!response.ok) {
        const errorData = await response.json();
        console.error('API error:', errorData);
        setIsStreaming(false);
        setStreamingMessage('');
        // Optionally show error to user
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = JSON.parse(line.slice(6));

            if (data.type === 'content') {
              setStreamingMessage(prev => prev + data.text);
            } else if (data.type === 'done') {
              // Stream complete, add final message
              const assistantMessage = {
                role: 'assistant',
                content: streamingMessage + data.text || streamingMessage,
                created_at: new Date().toISOString()
              };
              setMessages(prev => [...prev, assistantMessage]);
              setStreamingMessage('');
              setIsStreaming(false);
            } else if (data.type === 'error') {
              console.error('Streaming error:', data.error);
              setIsStreaming(false);
              setStreamingMessage('');
            }
          }
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setIsStreaming(false);
      setStreamingMessage('');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [inputValue]);

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-[#1A1A1A]">
      {/* Header with editable title and model selector */}
      <div className="border-b dark:border-gray-800 bg-white dark:bg-[#1A1A1A] px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex-1">
            {isEditingTitle ? (
              <input
                ref={titleInputRef}
                type="text"
                value={titleInputValue}
                onChange={(e) => setTitleInputValue(e.target.value)}
                onKeyDown={handleTitleKeyDown}
                onBlur={saveTitle}
                className="text-lg font-semibold text-gray-900 dark:text-gray-100 bg-transparent
                         border-b-2 border-[#CC785C] focus:outline-none w-full max-w-md"
                maxLength={100}
              />
            ) : (
              <h1
                onClick={startEditingTitle}
                className="text-lg font-semibold text-gray-900 dark:text-gray-100 cursor-pointer
                         hover:text-[#CC785C] transition-colors inline-block"
                title="Click to edit title"
              >
                {conversationTitle || 'New Conversation'}
              </h1>
            )}
          </div>

          {/* Model Selector */}
          <div className="relative ml-4" ref={modelDropdownRef}>
            <button
              onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
              className="flex items-center space-x-2 px-3 py-2 bg-gray-100 dark:bg-[#2A2A2A]
                       text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200
                       dark:hover:bg-[#3A3A3A] transition-colors text-sm font-medium"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
              </svg>
              <span>{models.find(m => m.id === selectedModel)?.name || 'Select Model'}</span>
              <svg className={`w-4 h-4 transition-transform ${isModelDropdownOpen ? 'rotate-180' : ''}`}
                   fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Dropdown Menu */}
            {isModelDropdownOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-[#2A2A2A] rounded-lg shadow-xl
                            border border-gray-200 dark:border-gray-700 z-50 overflow-hidden">
                {models.map((model) => (
                  <button
                    key={model.id}
                    onClick={() => handleModelChange(model.id)}
                    className={`w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-[#3A3A3A]
                              transition-colors ${
                                selectedModel === model.id
                                  ? 'bg-[#FFF5F0] dark:bg-[#3A2A2A] border-l-4 border-[#CC785C]'
                                  : 'border-l-4 border-transparent'
                              }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                          {model.name}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                          {model.description}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-500">
                          Context: {model.contextWindow}
                        </div>
                      </div>
                      {selectedModel === model.id && (
                        <svg className="w-5 h-5 text-[#CC785C] flex-shrink-0 ml-2"
                             fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-8">
        <div className="max-w-3xl mx-auto space-y-6">
          {messages.map((message, index) => (
            <MessageBubble key={index} message={message} />
          ))}

          {/* Streaming message */}
          {isStreaming && streamingMessage && (
            <MessageBubble
              message={{ role: 'assistant', content: streamingMessage }}
              isStreaming={true}
            />
          )}

          {/* Typing indicator */}
          {isStreaming && !streamingMessage && (
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 rounded-full bg-[#CC785C] flex items-center justify-center text-white font-semibold">
                C
              </div>
              <div className="flex space-x-1 py-3">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input area */}
      <div className="border-t dark:border-gray-800 bg-white dark:bg-[#1A1A1A]">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-end space-x-3">
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Message Claude..."
                disabled={isStreaming}
                rows={1}
                className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-700 rounded-lg
                         bg-white dark:bg-[#2A2A2A] text-gray-900 dark:text-gray-100
                         focus:outline-none focus:ring-2 focus:ring-[#CC785C] focus:border-transparent
                         resize-none max-h-32 disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <div className="absolute bottom-3 right-3 text-xs text-gray-400">
                {inputValue.length}
              </div>
            </div>
            <button
              onClick={sendMessage}
              disabled={!inputValue.trim() || isStreaming}
              className="px-6 py-3 bg-[#CC785C] text-white rounded-lg font-medium
                       hover:bg-[#b86949] transition-colors disabled:opacity-50
                       disabled:cursor-not-allowed disabled:hover:bg-[#CC785C]"
            >
              {isStreaming ? (
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              )}
            </button>
          </div>
          <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-center">
            Press Enter to send, Shift+Enter for new line
          </div>
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ message, isStreaming }) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex items-start space-x-3 ${isUser ? 'justify-end' : ''}`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-[#CC785C] flex items-center justify-center text-white font-semibold flex-shrink-0">
          C
        </div>
      )}

      <div className={`flex-1 ${isUser ? 'flex justify-end' : ''}`}>
        <div className={`prose prose-sm dark:prose-invert max-w-none ${
          isUser
            ? 'bg-[#CC785C] text-white rounded-2xl px-4 py-3 max-w-[80%]'
            : 'text-gray-900 dark:text-gray-100'
        }`}>
          {isUser ? (
            <div className="whitespace-pre-wrap">{message.content}</div>
          ) : (
            <div className="markdown-content">
              <ReactMarkdown
                components={{
                  code({ node, inline, className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || '');
                    return !inline && match ? (
                      <div className="relative my-4">
                        <div className="absolute top-2 right-2">
                          <button
                            onClick={() => navigator.clipboard.writeText(String(children))}
                            className="px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-white rounded"
                          >
                            Copy
                          </button>
                        </div>
                        <SyntaxHighlighter
                          style={okaidia}
                          language={match[1]}
                          PreTag="div"
                          {...props}
                        >
                          {String(children).replace(/\n$/, '')}
                        </SyntaxHighlighter>
                      </div>
                    ) : (
                      <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-sm" {...props}>
                        {children}
                      </code>
                    );
                  }
                }}
              >
                {message.content}
              </ReactMarkdown>
              {isStreaming && (
                <span className="inline-block w-1 h-4 bg-[#CC785C] ml-1 animate-pulse" />
              )}
            </div>
          )}
        </div>
      </div>

      {isUser && (
        <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-700 flex items-center justify-center text-gray-700 dark:text-gray-300 font-semibold flex-shrink-0">
          U
        </div>
      )}
    </div>
  );
}
