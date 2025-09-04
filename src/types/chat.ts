export interface ChatMessage {
  id: number;
  type: 'user' | 'ai';
  message: string;
  time: string;
}

export interface ChatContext {
  presentationName: string;
  currentSlide: {
    id: number;
    title: string;
    content: string;
  };
  allSlides: Array<{
    id: number;
    title: string;
    content: string;
  }>;
}

export interface ChatHistory {
  id: number;
  title: string;
  messages: ChatMessage[];
  timestamp: string;
}
