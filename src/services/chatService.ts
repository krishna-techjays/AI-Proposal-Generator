import { ChatMessage, ChatContext } from '@/types/chat';

export class ChatService {
  private static getApiKey(): string | null {
    return localStorage.getItem("ai_api_key");
  }

  private static getModel(): string {
    return localStorage.getItem("ai_model") || "gpt-3.5-turbo";
  }

  private static getProvider(): string {
    return localStorage.getItem("ai_provider") || "openai";
  }

  static async sendChatMessage(
    userMessage: string, 
    chatHistory: ChatMessage[], 
    context: ChatContext
  ): Promise<string> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new Error("AI API key not configured. Please set it in Profile settings.");
    }

    const provider = this.getProvider();
    const model = this.getModel();
    const prompt = this.buildChatPrompt(userMessage, chatHistory, context);
    
    try {
      let response;
      
      switch (provider) {
        case "openai":
        case "groq":
          response = await this.callOpenAICompatibleChat(apiKey, model, prompt, provider);
          break;
        case "huggingface":
          response = await this.callHuggingFaceChat(apiKey, model, prompt);
          break;
        case "anthropic":
          response = await this.callAnthropicChat(apiKey, model, prompt);
          break;
        case "cohere":
          response = await this.callCohereChat(apiKey, model, prompt);
          break;
        default:
          throw new Error(`Unsupported AI provider: ${provider}`);
      }

      return response;
    } catch (error) {
      console.error("Chat AI Service Error:", error);
      throw error;
    }
  }

  private static buildChatPrompt(
    userMessage: string, 
    chatHistory: ChatMessage[], 
    context: ChatContext
  ): string {
    // Use unlimited chat history for better conversational flow
    const fullHistory = chatHistory.map(msg => 
      `${msg.type === 'user' ? 'User' : 'Assistant'}: ${msg.message}`
    ).join('\n');

    // Detect user intent
    const isSimpleGreeting = /^(hi|hello|hey|thanks?|thank you|bye|goodbye)$/i.test(userMessage.trim());
    const isResearchRequest = /(explore|analyze|tell me about|research|detailed|comprehensive|full analysis|complete)/i.test(userMessage);
    const isSpecificRequest = /(executive summary|team details|market analysis|project features|timeline|budget|risks|objectives|goals|scope|resources|technology|implementation|methodology|deliverables|stakeholders|assumptions|constraints|success metrics|evaluation|testing|deployment|maintenance|support|training|documentation)/i.test(userMessage) || /^(give me|show me|tell me about|what is|list)/i.test(userMessage.trim());
    const isQuestion = userMessage.includes('?') || /^(what|how|why|when|where|who|can you|could you)/i.test(userMessage.trim());

    return `You are a smart presentation assistant helping with a presentation called "${context.presentationName}".

CRITICAL CONVERSATION FLOW INSTRUCTIONS:
- MAINTAIN CONVERSATIONAL CONTINUITY: Always reference previous parts of our conversation when relevant
- UNDERSTAND CONTEXT: Use the full conversation history to provide contextually aware responses
- FOLLOW-UP QUESTIONS: When users ask follow-up questions, connect them to previous topics discussed
- CONVERSATION MEMORY: Remember what we've talked about and build upon previous discussions
- NATURAL FLOW: Respond as if you're having a continuous conversation, not isolated interactions

CURRENT SLIDE CONTEXT:
- Slide ${context.currentSlide.id}: "${context.currentSlide.title}"
- Content: "${context.currentSlide.content}"

PRESENTATION OVERVIEW:
${context.allSlides.map(slide => `- Slide ${slide.id}: "${slide.title}"`).join('\n')}

FULL CONVERSATION HISTORY:
${fullHistory}

USER'S CURRENT MESSAGE: ${userMessage}

INTELLIGENT RESPONSE SCALING:

${isSimpleGreeting ? `
SIMPLE GREETING DETECTED - Respond as a friendly assistant:
- Keep response to 1-2 sentences
- Be warm and helpful
- Ask how you can assist with their presentation
- Examples: "Hello! How can I help you with your presentation today?" or "Thanks! Happy to help with your slides!"

` : isResearchRequest ? `
RESEARCH REQUEST DETECTED - Respond as a comprehensive research assistant:
1. EXPLORE and TELL everything about the slide topic - provide comprehensive information
2. ANALYZE the current content and identify what's missing or incomplete
3. PROVIDE complete details, data, examples, and real-world information
4. RESEARCH the topic thoroughly and share all relevant insights
5. COVER all aspects of the subject matter comprehensively
6. GIVE detailed explanations, not just suggestions
7. PROVIDE full information about the topic, including:
   - Current market data and trends
   - Real-world examples and case studies
   - Industry insights and statistics
   - Best practices and methodologies
   - Complete analysis of the subject area

` : isSpecificRequest ? `
SPECIFIC REQUEST DETECTED - Respond with FOCUSED content only:
- Provide ONLY the specific information requested
- Do NOT include related or additional information
- Be laser-focused on the exact topic asked
- Keep response clean and precise
- Examples: "Executive Summary" → Only project overview and key features, NO team details
- "Team Details" → Only team information, NO project overview
- Do NOT mix different topics or sections
- For Executive Summary: Include only project name, objective, and key features - EXCLUDE team composition

` : isQuestion ? `
QUESTION DETECTED - Respond with appropriate detail level:
- For simple questions: Provide clear, concise answers (2-3 sentences)
- For complex questions: Provide detailed explanations
- Always be helpful and informative
- Scale response based on question complexity

` : `
GENERAL REQUEST - Respond as a helpful presentation assistant:
- Provide relevant information about the slide or presentation
- Be informative but not overly verbose
- Focus on what the user is asking for
- Keep response appropriate to the request
`}

Remember: Be conversational, helpful, and scale your response based on the user's intent.`;
  }

  private static async callOpenAICompatibleChat(
    apiKey: string, 
    model: string, 
    prompt: string, 
    provider: string
  ): Promise<string> {
    const apiUrl = provider === "groq" 
      ? "https://api.groq.com/openai/v1/chat/completions"
      : "https://api.openai.com/v1/chat/completions";

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: "system",
            content: "You are a helpful presentation assistant. Provide concise, actionable advice for improving presentation slides."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 300,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`${provider} API request failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || "I'm sorry, I couldn't process your request.";
  }

  private static async callHuggingFaceChat(apiKey: string, model: string, prompt: string): Promise<string> {
    const response = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          max_length: 200,
          temperature: 0.7,
          return_full_text: false
        }
      }),
    });

    if (!response.ok) {
      throw new Error(`Hugging Face API request failed: ${response.statusText}`);
    }

    const data = await response.json();
    return Array.isArray(data) ? data[0]?.generated_text || "I'm sorry, I couldn't process your request." : "I'm sorry, I couldn't process your request.";
  }

  private static async callAnthropicChat(apiKey: string, model: string, prompt: string): Promise<string> {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "Content-Type": "application/json",
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: model,
        max_tokens: 300,
        messages: [
          {
            role: "user",
            content: prompt
          }
        ]
      }),
    });

    if (!response.ok) {
      throw new Error(`Anthropic API request failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.content[0]?.text || "I'm sorry, I couldn't process your request.";
  }

  private static async callCohereChat(apiKey: string, model: string, prompt: string): Promise<string> {
    const response = await fetch("https://api.cohere.ai/v1/generate", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: model,
        prompt: prompt,
        max_tokens: 200,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`Cohere API request failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.generations[0]?.text || "I'm sorry, I couldn't process your request.";
  }
}
