import { useState, useCallback, useEffect } from 'react';
import { ChatMessage, ChatContext, ChatHistory } from '@/types/chat';
import { ChatService } from '@/services/chatService';

export const useChatBot = (context: ChatContext) => {
  // Load chat messages from localStorage or use default
  const loadChatMessages = (): ChatMessage[] => {
    try {
      const saved = localStorage.getItem(`chatMessages_${context.presentationName}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Only return saved messages if they exist, otherwise return empty array
        return parsed && parsed.length > 0 ? parsed : [];
      }
    } catch (error) {
      console.error('Error loading chat messages:', error);
    }
    return []; // Always return empty array for clean start
  };

  const getDefaultMessages = (): ChatMessage[] => [];

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(loadChatMessages);
  const [chatMessage, setChatMessage] = useState("");
  // Removed chat history and showHistory for unlimited flow

  // Save chat messages to localStorage whenever they change
  const saveChatMessages = useCallback((messages: ChatMessage[]) => {
    try {
      localStorage.setItem(`chatMessages_${context.presentationName}`, JSON.stringify(messages));
    } catch (error) {
      console.error('Error saving chat messages:', error);
    }
  }, [context.presentationName]);

  // Auto-save chat messages whenever they change
  useEffect(() => {
    saveChatMessages(chatMessages);
  }, [chatMessages, saveChatMessages]);

  const sendChatMessage = useCallback(async () => {
    if (chatMessage.trim()) {
      const newMessage: ChatMessage = {
        id: chatMessages.length + 1,
        type: 'user',
        message: chatMessage,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      
      const updatedMessages = [...chatMessages, newMessage];
      setChatMessages(updatedMessages);
      setChatMessage("");
      
      try {
        // Call AI service with full conversation history for better context
        const aiResponse = await ChatService.sendChatMessage(chatMessage, updatedMessages, context);
        
        const aiMessage: ChatMessage = {
          id: updatedMessages.length + 1,
          type: 'ai',
          message: aiResponse,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        
        setChatMessages(prev => [...prev, aiMessage]);
      } catch (error) {
        console.error('Chat error:', error);
        const errorMessage: ChatMessage = {
          id: updatedMessages.length + 1,
          type: 'ai',
          message: 'Sorry, I encountered an error. Please check your API key configuration.',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setChatMessages(prev => [...prev, errorMessage]);
      }
    }
  }, [chatMessage, chatMessages, context]);

  const clearAllChatData = useCallback(() => {
    try {
      localStorage.removeItem(`chatMessages_${context.presentationName}`);
      setChatMessages([]);
      setChatMessage("");
    } catch (error) {
      console.error('Error clearing chat data:', error);
    }
  }, [context.presentationName]);

  return {
    // State
    chatMessages,
    chatMessage,
    
    // Actions
    setChatMessage,
    sendChatMessage,
    clearAllChatData,
  };
};
