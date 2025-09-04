import React from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { 
  MessageCircle, 
  Send,
  ArrowUp
} from "lucide-react";
import { ChatContext } from '@/types/chat';
import { useChatBot } from '@/hooks/useChatBot';

interface ChatBotProps {
  context: ChatContext;
  className?: string;
}

// Modern Chat Input Component
function ModernChatInput({ value, onChange, onSend, isTyping = false }: { 
  value: string; 
  onChange: (value: string) => void; 
  onSend: () => void; 
  isTyping?: boolean; 
}) {
  const [isFocused, setIsFocused] = React.useState(false);
  
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (value && value.trim() !== '') {
        onSend();
      }
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  return (
    <div className="w-full">
      <div className="relative flex items-center">
        {/* Input field with integrated send button */}
        <div className="w-full bg-[#FFFFFF] rounded-full shadow-md flex items-center pr-2">
          {/* Input field */}
          <input
            value={value}
            onChange={e => onChange(e.target.value)}
            onKeyPress={handleKeyPress}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder={isFocused ? "Explain, Summarize, edit about current slide." : "Ask anything...."}
            className="flex-1 px-4 py-3 bg-transparent border-none outline-none text-gray-700 placeholder-gray-500 text-sm"
            style={{
              boxShadow: 'none',
              border: 'none',
              outline: 'none',
            }}
          />
          
          {/* Send button - integrated into the input field */}
          <button
            onClick={onSend}
            disabled={!value || value.trim() === '' || isTyping}
            className="w-8 h-8 bg-[#333333] rounded-full flex items-center justify-center transition-all duration-200 disabled:cursor-not-allowed"
          >
            <ArrowUp className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}

interface ChatBotProps {
  context: ChatContext;
  className?: string;
}

const ChatBot: React.FC<ChatBotProps> = ({ context, className = "" }) => {
  const {
    chatMessages,
    chatMessage,
    setChatMessage,
    sendChatMessage,
  } = useChatBot(context);

  return (
    <div className={`w-full h-full bg-white border-l border-gray-200 flex flex-col overflow-hidden ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 flex-shrink-0">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-blue-600" />
          <span className="font-semibold text-gray-800">AI Assistant</span>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 flex flex-col p-4 overflow-hidden">
        <div className="flex-1 space-y-4 overflow-y-auto">
          {chatMessages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-xs p-3 rounded-2xl shadow-sm ${
                msg.type === 'user' 
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white' 
                  : 'bg-gradient-to-r from-gray-50 to-gray-100 text-gray-900 border border-gray-200'
              }`}>
                <p className="text-sm leading-relaxed">{msg.message}</p>
                <span className="text-xs opacity-70 mt-1 block">{msg.time}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Input - Fixed at Bottom */}
      <div className="p-4 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-white flex-shrink-0">
        <ModernChatInput
          value={chatMessage}
          onChange={setChatMessage}
          onSend={sendChatMessage}
          isTyping={false}
        />
      </div>
    </div>
  );
};

export default ChatBot;
