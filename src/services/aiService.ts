interface ProjectData {
  projectName: string;
  companyName: string;
  clientName?: string;
  projectRequirements: string;
  industryType: string;
  teamMembers: Array<{
    role: string;
    experience: string;
  }>;
  timeline: {
    value: number;
    unit: string;
  };
  selectedFeatures: string[];
  documentType?: string;
  customFormat?: string[];
  referenceDocuments?: Array<{
    name: string;
    size: number;
    type: string;
    content: string;
  }>;
  currentPresentationFormat?: string[]; // Current user-modified presentation structure
}

interface AIResponse {
  content: string;
  suggestions?: string[];
}

interface FeatureTimeline {
  name: string;
  timeline: string;
  description?: string;
}

interface TimelineResponse {
  featureTimelines: FeatureTimeline[];
  overallTimeline: string;
}

export class AIService {
  private static getApiKey(): string | null {
    return localStorage.getItem("ai_api_key");
  }

  private static getModel(): string {
    return localStorage.getItem("ai_model") || "gpt-3.5-turbo";
  }

  private static getProvider(): string {
    return localStorage.getItem("ai_provider") || "openai";
  }

  static async generatePresentationHeadings(projectData) {
    try {
      const prompt = `**URGENT: GENERATE CUSTOM PRESENTATION HEADINGS**

**PROJECT CONTEXT:**
Company: ${projectData.companyName}
Project: ${projectData.projectName}
Industry: ${projectData.industryType}
Requirements: "${projectData.projectRequirements}"
Timeline: ${projectData.timeline.value} ${projectData.timeline.unit}
Team: ${projectData.teamMembers.map(member => `${member.role} (${member.experience})`).join(', ')}

**YOUR TASK:**
Research and create EXACTLY 16 SPECIFIC presentation headings using a TWO-TIER approach:

**TIER 1: MANDATORY TRAINED STRUCTURE (8 slides)**
You MUST include these 8 mandatory headings as the foundation:
1. Executive Summary
2. Market Analysis & Industry Overview
3. Solution Architecture & Technical Approach
4. Implementation Strategy & Methodology
5. Project Timeline & MilESTONES
6. Risk Management & Mitigation
7. Financial Analysis & ROI Projections
8. Success Metrics & Performance Indicators

**TIER 2: RESEARCH-BASED CUSTOMIZATION (8 slides)**
After the mandatory structure, generate EXACTLY 8 additional headings that are:
- Customized to their specific project and industry
- Based on research of their requirements: "${projectData.projectRequirements}"
- Specific to ${projectData.industryType} industry challenges
- Addressing unique problems mentioned in their requirements
- Each heading should focus on a different aspect of their project requirements

**ADAPTIVE BEHAVIOR:**
If the user has deleted some mandatory headings from their presentation structure, adapt your content generation accordingly:
- Generate content for the remaining mandatory headings that are still present
- Adjust the research-based content to fill any gaps created by deleted mandatory sections
- Ensure the final document/presentation maintains logical flow and completeness
- If a mandatory section is missing, incorporate its key points into other relevant sections

✅ **TAILORED** to ${projectData.companyName}'s ${projectData.projectName} project
✅ **INDUSTRY-SPECIFIC** for ${projectData.industryType} sector
✅ **REQUIREMENT-FOCUSED** addressing: "${projectData.projectRequirements}"
✅ **PROFESSIONAL** business presentation style

**STRICT REQUIREMENTS:**
🚫 **FORBIDDEN**: Generic headings like "Market Analysis", "Solution Overview", "Implementation Strategy" (unless part of mandatory structure)
🚫 **FORBIDDEN**: One-size-fits-all business templates
🚫 **FORBIDDEN**: Headings that could apply to any company/project

✅ **REQUIRED**: Include ALL 8 mandatory trained structure headings
✅ **REQUIRED**: Each additional heading must be specific to this project context
✅ **REQUIRED**: Use industry terminology relevant to ${projectData.industryType}
✅ **REQUIRED**: Address specific challenges in their requirements
✅ **REQUIRED**: Consider their team's experience level

**OUTPUT FORMAT:**
Return ONLY a JSON array of strings (no additional text):
["Executive Summary", "Market Analysis & Industry Overview", "Solution Architecture & Technical Approach", "Implementation Strategy & Methodology", "Project Timeline & MilESTONES", "Risk Management & Mitigation", "Financial Analysis & ROI Projections", "Success Metrics & Performance Indicators", "Custom Heading 9", "Custom Heading 10", "Custom Heading 11", "Custom Heading 12", "Custom Heading 13", "Custom Heading 14", "Custom Heading 15", "Custom Heading 16"]

**EXAMPLES OF RESEARCH-BASED HEADINGS (DO NOT COPY - CREATE YOUR OWN):**
Healthcare AI: ["AI Diagnostic Accuracy for Radiology", "HIPAA Compliance Framework", "EMR Integration Strategy"]
FinTech: ["Digital Payment Security Architecture", "Regulatory Compliance for Financial APIs", "Fraud Detection Implementation"]
E-commerce: ["Customer Acquisition Cost Optimization", "Inventory Management Automation", "Conversion Rate Enhancement Strategy"]

Generate headings that combine mandatory structure with research-based customization for ${projectData.companyName}'s ${projectData.projectName} project.`;

      const apiKey = this.getApiKey();
      if (!apiKey) {
        throw new Error("AI API key not configured. Please set it in Profile settings.");
      }

      const provider = this.getProvider();
      const model = this.getModel();

      let response;
      switch (provider) {
        case "openai":
        case "groq":
          response = await this.callOpenAICompatibleForHeadings(apiKey, model, prompt, provider);
          break;
        case "anthropic":
          response = await this.callAnthropicForHeadings(apiKey, model, prompt);
          break;
        default:
          response = await this.callOpenAICompatibleForHeadings(apiKey, model, prompt, "openai");
      }

      const content = response;
      
      // Extract JSON array from response
      try {
        // Look for JSON array in the response
        const jsonMatch = content.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          const headings = JSON.parse(jsonMatch[0]);
          if (Array.isArray(headings) && headings.length > 0) {
            return headings;
          }
        }
        
        // If JSON parsing fails, try to extract headings manually
        const lines = content.split('\n').filter(line => line.trim());
        const headings = lines
          .filter(line => line.includes('"') || line.match(/^\d+\./))
          .map(line => line.replace(/^\d+\.\s*/, '').replace(/["\\[\\],]/g, '').trim())
          .filter(heading => heading.length > 0)
          .slice(0, 8);
          
        if (headings.length > 0) {
          return headings;
        }
      } catch (parseError) {
        console.error("Error parsing AI response:", parseError);
      }
      
      return null;
    } catch (error) {
      console.error("Error generating presentation headings:", error);
      return null;
    }
  }

  static async generateDocument(projectData: ProjectData): Promise<AIResponse> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new Error("AI API key not configured. Please set it in Profile settings.");
    }

    const provider = this.getProvider();
    const model = this.getModel();
    const prompt = this.buildPrompt(projectData);
    
    try {
      let response;
      
      switch (provider) {
        case "openai":
        case "groq":
          response = await this.callOpenAICompatible(apiKey, model, prompt, provider);
          break;
        case "huggingface":
          response = await this.callHuggingFace(apiKey, model, prompt);
          break;
        case "anthropic":
          response = await this.callAnthropic(apiKey, model, prompt);
          break;
        case "cohere":
          response = await this.callCohere(apiKey, model, prompt);
          break;
        default:
          throw new Error(`Unsupported AI provider: ${provider}`);
      }

      return response;
    } catch (error) {
      console.error("AI Service Error:", error);
      throw error;
    }
  }

  static async validateAndAnalyzeRequirements(
    projectRequirements: string, 
    industryType: string, 
    referenceDocuments: Array<{name: string; size: number; type: string; content: string}> = []
  ): Promise<{isValid: boolean; feedback: string; suggestions: string[]}> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new Error('API key not configured. Please check your profile settings.');
    }

    const provider = this.getProvider();
    const model = this.getModel();
    const documentContext = referenceDocuments.map(doc => doc.content).join('\n\n');
    const prompt = this.buildValidationPrompt(projectRequirements, industryType, documentContext);

    try {
      let content: string;
      
      switch (provider) {
        case "openai":
        case "groq":
          content = await this.callOpenAICompatibleFeatures(prompt, apiKey, model, 800, 0.3);
          break;
        case "anthropic":
          content = await this.callAnthropicFeatures(prompt, apiKey, model, 800, 0.3);
          break;
        default:
          content = await this.callOpenAICompatibleFeatures(prompt, apiKey, model, 800, 0.3);
      }

      return this.parseValidationResponse(content);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`Validation failed: ${errorMessage}`);
    }
  }

  private static async callOpenAICompatible(apiKey: string, model: string, prompt: string, provider: string): Promise<AIResponse> {
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
            content: "You are an expert project manager and technical writer. CRITICAL: You must analyze and respond SPECIFICALLY to the user's exact requirements, industry, and team composition. Generate comprehensive project documentation that is DIRECTLY tailored to their specific inputs. Never use generic content - everything must be customized to their unique project needs. CRITICAL FORMATTING: Use bullet points (-) for lists and key points, keep paragraphs to 1-2 lines maximum, make company names, project names, and key metrics appear as BOLD TEXT (not markdown symbols). Structure content with 70% bullet points and 30% brief paragraphs."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 2000,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`${provider} API request failed: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      content: data.choices[0]?.message?.content || "No content generated",
    };
  }

  private static async callHuggingFace(apiKey: string, model: string, prompt: string): Promise<AIResponse> {
    const response = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          max_length: 2000,
          temperature: 0.7,
          return_full_text: false
        }
      }),
    });

    if (!response.ok) {
      throw new Error(`Hugging Face API request failed: ${response.statusText}`);
    }

    const data = await response.json();
    const content = Array.isArray(data) ? data[0]?.generated_text || data[0]?.summary_text || "No content generated" : "No content generated";
    
    return {
      content: content,
    };
  }

  private static async callAnthropic(apiKey: string, model: string, prompt: string): Promise<AIResponse> {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "Content-Type": "application/json",
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: model,
        max_tokens: 2000,
        messages: [
          {
            role: "user",
            content: `You are an expert project manager and technical writer. CRITICAL INSTRUCTION: You must analyze and respond SPECIFICALLY to the user's exact requirements, industry, and team composition. Generate comprehensive project documentation that is DIRECTLY tailored to their specific inputs. Never use generic content - everything must be customized to their unique project needs. CRITICAL FORMATTING: Use bullet points (-) for lists and key points, keep paragraphs to 1-2 lines maximum, make company names, project names, and key metrics appear as BOLD TEXT (not markdown symbols). Structure content with 70% bullet points and 30% brief paragraphs.\n\n${prompt}`
          }
        ]
      }),
    });

    if (!response.ok) {
      throw new Error(`Anthropic API request failed: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      content: data.content[0]?.text || "No content generated",
    };
  }

  private static async callCohere(apiKey: string, model: string, prompt: string): Promise<AIResponse> {
    const response = await fetch("https://api.cohere.ai/v1/generate", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: model,
        prompt: `You are an expert project manager and technical writer. CRITICAL INSTRUCTION: You must analyze and respond SPECIFICALLY to the user's exact requirements, industry, and team composition. Generate comprehensive project documentation that is DIRECTLY tailored to their specific inputs. Never use generic content - everything must be customized to their unique project needs. CRITICAL FORMATTING: Use bullet points (-) for lists and key points, keep paragraphs to 1-2 lines maximum, make company names, project names, and key metrics appear as BOLD TEXT (not markdown symbols). Structure content with 70% bullet points and 30% brief paragraphs.\n\n${prompt}`,
        max_tokens: 2000,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`Cohere API request failed: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      content: data.generations[0]?.text || "No content generated",
    };
  }

  static async generateFeatureTimelines(projectData: ProjectData): Promise<TimelineResponse> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new Error("AI API key not configured. Please set it in Profile settings.");
    }

    const provider = this.getProvider();
    const model = this.getModel();
    const prompt = this.buildTimelinePrompt(projectData);
    
    try {
      let response;
      
      switch (provider) {
        case "openai":
        case "groq":
          response = await this.callOpenAICompatibleForTimelines(apiKey, model, prompt, provider);
          break;
        case "huggingface":
          response = await this.callHuggingFaceForTimelines(apiKey, model, prompt);
          break;
        case "anthropic":
          response = await this.callAnthropicForTimelines(apiKey, model, prompt);
          break;
        case "cohere":
          response = await this.callCohereForTimelines(apiKey, model, prompt);
          break;
        default:
          throw new Error(`Unsupported AI provider: ${provider}`);
      }

      return response;
    } catch (error) {
      console.error("Timeline generation error:", error);
      throw error;
    }
  }

  static async suggestFeatures(projectData: ProjectData, timeUnit: string = "hours"): Promise<Array<{name: string; description: string; timeEstimate?: string}>> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      console.log("No AI API key configured, returning fallback features");
      return this.getFallbackFeatures(timeUnit);
    }

    const provider = this.getProvider();
    const model = this.getModel();
    const prompt = this.buildFeatureSuggestionPrompt(projectData, timeUnit);

    console.log("Calling AI with provider:", provider, "model:", model);

    try {
      let response;
      
      switch (provider) {
        case "openai":
        case "groq":
          response = await this.callOpenAICompatibleForFeatures(apiKey, model, prompt, provider);
          break;
        case "huggingface":
          response = await this.callHuggingFaceForFeatures(apiKey, model, prompt);
          break;
        case "anthropic":
          response = await this.callAnthropicForFeatures(apiKey, model, prompt);
          break;
        case "cohere":
          response = await this.callCohereForFeatures(apiKey, model, prompt);
          break;
        default:
          console.log("Unknown provider, returning fallback features");
          return this.getFallbackFeatures(timeUnit);
      }

      if (response && response.length > 0) {
        console.log("AI returned", response.length, "features");
        return response;
      } else {
        console.log("AI returned empty response, using fallback features");
        return this.getFallbackFeatures(timeUnit);
      }
    } catch (error) {
      console.error("Feature suggestion error:", error);
      return this.getFallbackFeatures(timeUnit);
    }
  }

  private static async callOpenAICompatibleForFeatures(apiKey: string, model: string, prompt: string, provider: string): Promise<Array<{name: string; description: string; timeEstimate?: string}>> {
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
            content: "You are an expert project manager and technical writer. CRITICAL INSTRUCTION: You must analyze and respond SPECIFICALLY to the user's exact requirements, industry, and team composition. Generate comprehensive project documentation that is DIRECTLY tailored to their specific inputs. Never use generic content - everything must be customized to their unique project needs. CRITICAL FORMATTING: Use bullet points (-) for lists and key points, keep paragraphs to 1-2 lines maximum, make company names, project names, and key metrics appear as BOLD TEXT (not markdown symbols). Structure content with 70% bullet points and 30% brief paragraphs."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 2000,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      console.error("OpenAI API error:", response.status, response.statusText);
      return [];
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content || "";
    console.log("OpenAI API response content:", content.substring(0, 200) + "...");
    
    return this.parseFeatures(content);
  }

  private static async callHuggingFaceForFeatures(apiKey: string, model: string, prompt: string): Promise<Array<{name: string; description: string; timeEstimate?: string}>> {
    const response = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          max_length: 500,
          temperature: 0.8,
          return_full_text: false
        }
      }),
    });

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    const content = Array.isArray(data) ? data[0]?.generated_text || data[0]?.summary_text || "" : "";
    
    return this.parseFeatures(content);
  }

  private static async callAnthropicForFeatures(apiKey: string, model: string, prompt: string): Promise<Array<{name: string; description: string; timeEstimate?: string}>> {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "Content-Type": "application/json",
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: model,
        max_tokens: 2000,
        messages: [
          {
            role: "user",
            content: `You are an expert project manager and technical writer. CRITICAL INSTRUCTION: You must analyze and respond SPECIFICALLY to the user's exact requirements, industry, and team composition. Generate comprehensive project documentation that is DIRECTLY tailored to their specific inputs. Never use generic content - everything must be customized to their unique project needs. CRITICAL FORMATTING: Use bullet points (-) for lists and key points, keep paragraphs to 1-2 lines maximum, make company names, project names, and key metrics appear as BOLD TEXT (not markdown symbols). Structure content with 70% bullet points and 30% brief paragraphs.\n\n${prompt}`
          }
        ]
      }),
    });

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    const content = data.content[0]?.text || "";
    
    return this.parseFeatures(content);
  }

  private static async callCohereForFeatures(apiKey: string, model: string, prompt: string): Promise<Array<{name: string; description: string; timeEstimate?: string}>> {
    const response = await fetch("https://api.cohere.ai/v1/generate", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: model,
        prompt: `You are an expert project manager and technical writer. CRITICAL INSTRUCTION: You must analyze and respond SPECIFICALLY to the user's exact requirements, industry, and team composition. Generate comprehensive project documentation that is DIRECTLY tailored to their specific inputs. Never use generic content - everything must be customized to their unique project needs. CRITICAL FORMATTING: Use bullet points (-) for lists and key points, keep paragraphs to 1-2 lines maximum, make company names, project names, and key metrics appear as BOLD TEXT (not markdown symbols). Structure content with 70% bullet points and 30% brief paragraphs.\n\n${prompt}`,
        max_tokens: 500,
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    const content = data.generations[0]?.text || "";
    
    return this.parseFeatures(content);
  }

  private static async callOpenAICompatibleForTimelines(apiKey: string, model: string, prompt: string, provider: string): Promise<TimelineResponse> {
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
            content: "You are an expert project manager and technical writer. CRITICAL INSTRUCTION: You must analyze and respond SPECIFICALLY to the user's exact requirements, industry, and team composition. Generate comprehensive project documentation that is DIRECTLY tailored to their specific inputs. Never use generic content - everything must be customized to their unique project needs. CRITICAL FORMATTING: Use bullet points (-) for lists and key points, keep paragraphs to 1-2 lines maximum, make company names, project names, and key metrics appear as BOLD TEXT (not markdown symbols). Structure content with 70% bullet points and 30% brief paragraphs."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 1000,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      throw new Error(`${provider} API request failed: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content || "";
    
    return this.parseTimelines(content);
  }

  private static async callHuggingFaceForTimelines(apiKey: string, model: string, prompt: string): Promise<TimelineResponse> {
    const response = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          max_length: 1000,
          temperature: 0.3,
          return_full_text: false
        }
      }),
    });

    if (!response.ok) {
      throw new Error(`Hugging Face API request failed: ${response.statusText}`);
    }

    const data = await response.json();
    const content = Array.isArray(data) ? data[0]?.generated_text || data[0]?.summary_text || "" : "";
    
    return this.parseTimelines(content);
  }

  private static async callAnthropicForTimelines(apiKey: string, model: string, prompt: string): Promise<TimelineResponse> {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "Content-Type": "application/json",
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: model,
        max_tokens: 1000,
        messages: [
          {
            role: "user",
            content: `You are an expert project manager and technical writer. CRITICAL INSTRUCTION: You must analyze and respond SPECIFICALLY to the user's exact requirements, industry, and team composition. Generate comprehensive project documentation that is DIRECTLY tailored to their specific inputs. Never use generic content - everything must be customized to their unique project needs. CRITICAL FORMATTING: Use bullet points (-) for lists and key points, keep paragraphs to 1-2 lines maximum, make company names, project names, and key metrics appear as BOLD TEXT (not markdown symbols). Structure content with 70% bullet points and 30% brief paragraphs.\n\n${prompt}`
          }
        ]
      }),
    });

    if (!response.ok) {
      throw new Error(`Anthropic API request failed: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.content[0]?.text || "";
    
    return this.parseTimelines(content);
  }

  private static async callCohereForTimelines(apiKey: string, model: string, prompt: string): Promise<TimelineResponse> {
    const response = await fetch("https://api.cohere.ai/v1/generate", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: model,
        prompt: `You are an expert project manager and technical writer. CRITICAL INSTRUCTION: You must analyze and respond SPECIFICALLY to the user's exact requirements, industry, and team composition. Generate comprehensive project documentation that is DIRECTLY tailored to their specific inputs. Never use generic content - everything must be customized to their unique project needs. CRITICAL FORMATTING: Use bullet points (-) for lists and key points, keep paragraphs to 1-2 lines maximum, make company names, project names, and key metrics appear as BOLD TEXT (not markdown symbols). Structure content with 70% bullet points and 30% brief paragraphs.\n\n${prompt}`,
        max_tokens: 1000,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      throw new Error(`Cohere API request failed: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.generations[0]?.text || "";
    
    return this.parseTimelines(content);
  }

  private static parseFeatures(content: string): Array<{name: string; description: string; timeEstimate?: string}> {
    try {
      // Try to parse as JSON first - look for JSON array in the content
      let jsonContent = content.trim();
      
      // Extract JSON array if there's extra text around it
      const jsonMatch = jsonContent.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        jsonContent = jsonMatch[0];
      }
      
      const parsed = JSON.parse(jsonContent);
      if (Array.isArray(parsed) && parsed.length > 0) {
        console.log("Successfully parsed JSON features:", parsed.length);
        return parsed.map(item => ({
          name: typeof item === 'string' ? item : item.name || item.feature || 'Unknown Feature',
          description: typeof item === 'string' ? 'AI-suggested feature for your project' : item.description || item.desc || 'AI-suggested feature for your project',
          timeEstimate: typeof item === 'string' ? undefined : (item.timeEstimate || item.estimate || item.timeline || item.time || item.duration)
        }));
      }
    } catch (error) {
      console.log("JSON parsing failed, trying text parsing:", error);
      // If JSON parsing fails, try to extract features from text
      const lines = content.split('\n').filter(line => line.trim().length > 0);
      const features: Array<{name: string; description: string; timeEstimate?: string}> = [];
      
      let current: {name?: string; description?: string; timeEstimate?: string} = {};
      const timeRegex = /(\d+\s*(?:-\s*\d+)?\s*(?:hours?|days?|weeks?|months?))/i;

      for (const raw of lines) {
        const line = raw.trim();
        // Start of a new list item
        if (line.startsWith('-') || line.startsWith('*') || /^\d+\./.test(line)) {
          // push previous
          if (current.name) {
            features.push({
              name: current.name,
              description: current.description || 'AI-suggested feature for your project',
              timeEstimate: current.timeEstimate
            });
          }
          current = {};

          const clean = line.replace(/^[-*\d.]+\s*/, '');
          const parts = clean.split(':');
          if (parts.length >= 2) {
            current.name = parts[0].trim();
            const rest = parts.slice(1).join(':').trim();
            const timeMatch = rest.match(timeRegex);
            current.timeEstimate = timeMatch ? timeMatch[0] : undefined;
            current.description = rest.replace(timeRegex, '').trim() || undefined;
          } else {
            current.name = clean.trim();
          }
        } else if (current.name) {
          // continuation line
          const timeMatch = line.match(timeRegex);
          if (!current.timeEstimate && timeMatch) current.timeEstimate = timeMatch[0];
          current.description = [current.description, line.replace(timeRegex, '').trim()].filter(Boolean).join(' ');
        }
      }
      if (current.name) {
        features.push({
          name: current.name,
          description: current.description || 'AI-suggested feature for your project',
          timeEstimate: current.timeEstimate
        });
      }
      return features.slice(0, 12);
    }
    
    return [];
  }

  private static parseTimelines(content: string): TimelineResponse {
    const lines = content.split('\n').filter(line => line.trim().length > 0);
    const featureTimelines: FeatureTimeline[] = [];
    let overallTimeline = "";

    let currentFeature: Partial<FeatureTimeline> = {};
    let isOverallSection = false;

    for (const line of lines) {
      const trimmed = line.trim();
      
      // Check for overall timeline section
      if (trimmed.toLowerCase().includes('overall') || trimmed.toLowerCase().includes('total')) {
        isOverallSection = true;
        continue;
      }

      if (isOverallSection) {
        if (trimmed.includes(':')) {
          overallTimeline = trimmed.split(':')[1].trim();
        } else if (!overallTimeline && trimmed.length > 10) {
          overallTimeline = trimmed;
        }
        continue;
      }

      // Parse feature timelines
      if (trimmed.startsWith('-') || trimmed.startsWith('*') || /^\d+\./.test(trimmed)) {
        // Save previous feature if exists
        if (currentFeature.name && currentFeature.timeline) {
          featureTimelines.push(currentFeature as FeatureTimeline);
        }

        // Parse new feature
        const cleanLine = trimmed.replace(/^[-*\d.]\s*/, '');
        const parts = cleanLine.split(':');
        
        if (parts.length >= 2) {
          currentFeature = {
            name: parts[0].trim(),
            timeline: parts[1].trim(),
            description: parts.length > 2 ? parts.slice(2).join(':').trim() : undefined
          };
        }
      } else if (currentFeature.name && !currentFeature.description && trimmed.length > 10) {
        currentFeature.description = trimmed;
      }
    }

    // Save last feature
    if (currentFeature.name && currentFeature.timeline) {
      featureTimelines.push(currentFeature as FeatureTimeline);
    }

    // Fallback if no proper parsing
    if (featureTimelines.length === 0 && !overallTimeline) {
      overallTimeline = "8-12 weeks estimated based on project complexity";
    }

    return {
      featureTimelines,
      overallTimeline: overallTimeline || "8-12 weeks estimated based on project complexity"
    };
  }

  private static buildValidationPrompt(projectRequirements: string, industryType: string, documentContext: string): string {
    return `You are an expert business analyst performing market and requirement validation for a ${industryType} project.

Project Requirements:
${projectRequirements}

${documentContext ? `Reference Documents:\n${documentContext}\n` : ''}

Industry: ${industryType}

Analyze the requirements thoroughly and provide validation including:
1. Market feasibility analysis
2. Technical feasibility assessment  
3. Requirement clarity evaluation
4. Industry-specific compliance considerations
5. Potential risks and challenges

Respond in JSON format:
{
  "isValid": boolean (true if requirements are clear and feasible),
  "feedback": "string (specific issues if not valid, or positive confirmation if valid)",
  "suggestions": ["array of improvement suggestions"]
}

Consider:
- Are the requirements specific enough to build a project?
- Do they align with industry standards and practices?
- Are there any obvious gaps or ambiguities?
- Is the scope realistic for the given industry?

Return only the JSON object, no other text.`;
  }

  private static buildFeatureSuggestionPrompt(projectData: ProjectData, timeUnit: string = "hours"): string {
    const teamExperience = projectData.teamMembers.map(member => `${member.role}: ${member.experience} experience`).join(', ');
    const referenceContext = projectData.referenceDocuments && projectData.referenceDocuments.length > 0 
      ? `\n\nReference Documents Context:\n${projectData.referenceDocuments.map(doc => `${doc.name}: ${doc.content.substring(0, 500)}...`).join('\n')}` 
      : '';
    
    return `You are an expert software architect and product manager specializing in the ${projectData.industryType} industry. 

**CRITICAL TRAINING INSTRUCTIONS - FOLLOW EXACTLY:**
🎯 **PRIMARY OBJECTIVE**: Analyze the user's SPECIFIC project requirements and generate features that DIRECTLY solve their stated problems and needs.

**MANDATORY REQUIREMENTS (NO EXCEPTIONS):**
1. ✅ Generate EXACTLY 20-25 features (MINIMUM 20)
2. ✅ Each feature MUST be directly related to their specific project requirements
3. ✅ Consider their team's EXACT experience levels: ${teamExperience}
4. ✅ Features must be specific to ${projectData.industryType} industry needs
5. ✅ Prioritize features that solve the EXACT problems mentioned in their requirements
6. ✅ NO generic features - everything must be customized to their project
7. ✅ Time estimates must reflect their team's experience (junior = more time, senior = less time)
8. ✅ Research their requirements to identify additional relevant features
9. ✅ Combine trained feature patterns with research-based discoveries

**ANALYSIS PROCESS (FOLLOW THIS ORDER):**
STEP 1: Read and understand their requirements: "${projectData.projectRequirements}"
STEP 2: Identify the specific problems and goals mentioned
STEP 3: Consider their industry (${projectData.industryType}) and team capabilities
STEP 4: Generate features that DIRECTLY address each identified need
STEP 5: Ensure time estimates match their team experience levels
STEP 6: Analyse the requirements and generate features that directly solve the problems mentioned in the requirements
STEP 7: Research for the business proposal formats and headings and generate the content for the business proposal

**PROJECT CONTEXT:**
- Project: ${projectData.projectName}
- Company: ${projectData.companyName}
- Industry: ${projectData.industryType}
- Team: ${teamExperience}
- Timeline: ${projectData.timeline.value} ${projectData.timeline.unit}

**DETAILED PROJECT REQUIREMENTS:**
${projectData.projectRequirements}${referenceContext}

**FEATURE GENERATION INSTRUCTIONS:**
Analyze the requirements above and generate features that:
1. **SOLVE SPECIFIC PROBLEMS** mentioned in the requirements
2. **ALIGN WITH INDUSTRY NEEDS** for ${projectData.industryType}
3. **MATCH TEAM CAPABILITIES** based on experience levels: ${teamExperience}
4. **FIT THE TIMELINE** of ${projectData.timeline.value} ${projectData.timeline.unit}

**TIME ESTIMATION GUIDELINES:**
Consider team experience when estimating:
- Junior teams: Add 30-50% more time
- Senior teams: Can work 20-30% faster
- Mixed teams: Use average estimates

Provide response as JSON array with exactly this structure:
[
  {
    "name": "Specific Feature Name",
    "description": "Detailed 100-200 word description explaining: what it does, how users interact with it, why it's needed for THIS specific project, and how it addresses the requirements",
    "timeEstimate": "${timeUnit === "hours" ? 'X-Y hours' : timeUnit === "days" ? 'X-Y days' : 'X-Y weeks'}"
  }
]

**CRITICAL FINAL INSTRUCTIONS:**
🚫 **FORBIDDEN**: Do NOT generate generic features like "User Authentication" or "Admin Panel" unless specifically mentioned in requirements
✅ **REQUIRED**: Every feature must solve a specific problem mentioned in: "${projectData.projectRequirements}"
✅ **REQUIRED**: Consider team experience for time estimates: ${teamExperience}
✅ **REQUIRED**: Make features industry-specific for ${projectData.industryType}
✅ **REQUIRED**: Reference their company (${projectData.companyName}) and project (${projectData.projectName}) context
✅ **REQUIRED**: Generate features that are relevant to the project requirements
✅ **REQUIRED**: Generate presentation format and headings for specific user requirements given
✅ **REQUIRED**: Do research on the project requirements and generate features that are relevant to the project requirements
✅ **REQUIRED**: Do research with the user inputs and develop headings, content, and structure for the proposal

**VALIDATION CHECKLIST (Before responding):**
- [ ] Did I read and understand their specific requirements?
- [ ] Did I research ${projectData.industryType} industry challenges and opportunities?
- [ ] Does each feature solve a problem they mentioned?
- [ ] Are time estimates appropriate for their team's experience?
- [ ] Are features specific to ${projectData.industryType} industry?
- [ ] Do I have 20-25 features minimum?
- [ ] Is everything customized to their project, not generic?
- [ ] Did I combine trained patterns with research-based discoveries?
- [ ] Is the presentation format and headings generated based on the user requirements?
- [ ] Is the content generated based on the user requirements?
- [ ] Is the structure generated based on the user requirements?
- [ ] Did I research additional relevant features beyond the obvious requirements?
- [ ] Did I generate additional presentation format and headings for specific user requirements given?

**RESPONSE FORMAT:** Return ONLY the JSON array with 20-25 features. Each feature must be justified by their requirements.`;
  }

  private static buildTimelinePrompt(projectData: ProjectData): string {
    const teamExperience = projectData.teamMembers.map(member => `${member.role} (${member.experience} level)`).join(', ');
    
    return `**CRITICAL TIMELINE ANALYSIS INSTRUCTIONS:**
You must analyze this SPECIFIC project and provide realistic timeline estimates based on the EXACT team composition and project requirements provided.

**MANDATORY ANALYSIS FACTORS:**
1. ✅ Team Experience Levels: ${teamExperience}
2. ✅ Industry Complexity: ${projectData.industryType} industry requirements
3. ✅ Project Scope: Based on their specific requirements
4. ✅ Feature Interdependencies: Consider how features connect
5. ✅ Quality Assurance: Include testing time appropriate for team experience

**PROJECT CONTEXT:**
- Project Name: ${projectData.projectName}
- Company: ${projectData.companyName}
- Industry: ${projectData.industryType}
- Team Composition: ${teamExperience}
- Project Timeline Goal: ${projectData.timeline.value} ${projectData.timeline.unit}

**SPECIFIC PROJECT REQUIREMENTS TO CONSIDER:**
${projectData.projectRequirements}

**FEATURES TO ESTIMATE (selected by user):**
${projectData.selectedFeatures.map(feature => `- ${feature}`).join('\n')}

**EXPERIENCE-BASED ESTIMATION RULES:**
- Junior developers: Add 40-60% buffer time for complexity and learning
- Mid-level developers: Standard estimates with 20-30% buffer
- Senior developers: Can work 20-30% faster, reduce estimates accordingly
- Mixed teams: Weight estimates based on who will work on each feature

**REQUIRED OUTPUT FORMAT:**
1. **Individual Feature Timelines**: "- Feature Name: X weeks/days: Justification based on team experience and complexity"
2. **Overall Project Timeline**: "Overall Timeline: X weeks/months (considering team experience and feature dependencies)"

**VALIDATION REQUIREMENTS:**
- Estimates must reflect the ACTUAL team experience levels provided
- Consider ${projectData.industryType} industry-specific complexity
- Account for their ${projectData.timeline.value} ${projectData.timeline.unit} goal
- Include realistic buffers for testing and deployment

Generate realistic, professional estimates that this specific team can actually achieve.`;
  }

  private static buildPrompt(projectData: ProjectData): string {
    let referenceContent = "";
    if (projectData.referenceDocuments && projectData.referenceDocuments.length > 0) {
      referenceContent = "\n\n## Reference Documents:\n";
      projectData.referenceDocuments.forEach((doc, index) => {
        referenceContent += `\n### Document ${index + 1}: ${doc.name}\n${doc.content}\n`;
      });
      referenceContent += "\nPlease use the information from these reference documents to enhance the generated content where relevant.\n";
    }
    const isSlides = projectData.documentType === 'slides';
    
    // Add information about current presentation format if available
    const currentFormatInfo = projectData.currentPresentationFormat && projectData.currentPresentationFormat.length > 0 
      ? `\n\n**CURRENT PRESENTATION STRUCTURE:**
The user has customized their presentation structure. Current headings:
${projectData.currentPresentationFormat.map((heading, index) => `${index + 1}. ${heading}`).join('\n')}

**ADAPTIVE REQUIREMENT:**
Generate content that matches this exact structure. If mandatory sections are missing, incorporate their key points into other relevant sections to maintain completeness.`
      : '';
    
    const basePrompt = `You are a senior business consultant, technical architect, and a product manager. You are an expert in the ${projectData.industryType} industry.

**CRITICAL INSTRUCTIONS - READ CAREFULLY:**
1. ANALYZE THE USER'S SPECIFIC REQUIREMENTS: Study every detail of their project requirements, team composition, and industry context
2. GENERATE CUSTOMIZED CONTENT: Create content that DIRECTLY addresses their specific needs, problems, and goals
3. USE THEIR EXACT CONTEXT: Reference their company name, project name, industry type, and team experience throughout
4. SOLVE THEIR PROBLEMS: Focus on the specific challenges and requirements they've outlined
5. BE INDUSTRY-SPECIFIC: Tailor all content to their ${projectData.industryType} industry with relevant examples and considerations
6. CONSIDER TEAM CAPABILITIES: Adjust complexity and recommendations based on their team's experience levels
7. RESEARCH AND ANALYZE: Conduct research on their specific requirements to generate additional relevant headings
8. COMBINE APPROACHES: Use trained structure as base AND add research-based sections

Generate a professional, detailed, and compelling ${isSlides ? 'business presentation' : 'project proposal document'} that is SPECIFICALLY tailored to this user's unique project.

**MANDATORY ANALYSIS AREAS (customize each to their specific context):**
1. Market analysis and industry trends SPECIFIC to ${projectData.industryType} and their project scope
2. Competitive advantages and unique value propositions based on THEIR requirements
3. Technical feasibility considering THEIR team's experience: ${projectData.teamMembers.map(member => `${member.role} (${member.experience})`).join(', ')}
4. Risk assessment specific to THEIR project complexity and team capabilities
5. ROI and business impact analysis relevant to THEIR company size and industry
6. Compliance and security considerations for ${projectData.industryType} industry
7. Research-based additional sections based on their specific requirements
8. Industry-specific analysis and recommendations
9. Generate presentation format and headings for specific user requirements given
10. Do research and develop the format and structure for the proposal and content for each headings
11. Generate content for each slide based on the user requirements and the research-based additional sections and the trained structure headings

Project Details:
- Project Name: ${projectData.projectName}
- Company: ${projectData.companyName}
${projectData.clientName ? `- Client: ${projectData.clientName}` : ''}
- Industry: ${projectData.industryType}

Project Requirements:
${projectData.projectRequirements}

Team Composition:
${projectData.teamMembers.map(member => `- ${member.role}: ${member.experience} level`).join('\n')}

Timeline: ${projectData.timeline.value} ${projectData.timeline.unit}

Selected Features:
${projectData.selectedFeatures.map(feature => `- ${feature}`).join('\n')}${referenceContent}${currentFormatInfo}

**CRITICAL CONTENT GENERATION GUIDELINES:**

**MANDATORY USER-SPECIFIC CUSTOMIZATION:**
1. ✅ Reference their company (${projectData.companyName}) and project (${projectData.projectName}) throughout
2. ✅ Address their SPECIFIC requirements: "${projectData.projectRequirements}"
3. ✅ Consider their EXACT team: ${projectData.teamMembers.map(member => `${member.role} (${member.experience})`).join(', ')}
4. ✅ Focus on ${projectData.industryType} industry-specific challenges and opportunities
5. ✅ Align with their ${projectData.timeline.value} ${projectData.timeline.unit} timeline
6. ✅ Include relevant ${projectData.industryType} industry statistics and market data
7. ✅ Address business value specific to their company size and market
8. ✅ Consider compliance requirements specific to ${projectData.industryType}
9. ✅ Research their requirements and generate additional relevant sections
10. ✅ Combine trained structure with research-based content
11. ✅ Check for the Repeatative headings and remove them
12. ✅ The generated content should be include both bullets and also minimal words of paragraphs must not exceed 1-2 lines.

**CONTENT REQUIREMENTS:**
- Every section must reference their specific project context
- Use their company name and project name naturally throughout
- Address the exact problems mentioned in their requirements
- Provide solutions that match their team's capabilities
- Include industry-specific examples and case studies
- Focus on ROI relevant to their business model
- Consider their timeline constraints in all recommendations
- Research their requirements to identify additional relevant sections
- Generate both trained structure content AND research-based content
- Generate presentation format and headings for specific user requirements given
- Do research and develop the format and structure for the proposal and content for each headings

**FORBIDDEN CONTENT:**
🚫 Generic industry overviews without their specific context
🚫 Standard templates that could apply to any company
🚫 Recommendations that don't match their team experience
🚫 Solutions that don't address their stated requirements

Generate content that could ONLY apply to ${projectData.companyName}'s ${projectData.projectName} project.`;

    if (isSlides) {
      // Generate dynamic slide structure based on user requirements if no custom format provided
      const slideStructure = projectData.customFormat && projectData.customFormat.length > 0 
        ? projectData.customFormat.map((heading, index) => `# SLIDE ${index + 1}: ${heading.toUpperCase()}`).join('\n\n')
        : `**SLIDE STRUCTURE APPROACH:**
You will generate a comprehensive business presentation using a TWO-TIER approach:

**TIER 1: TRAINED STRUCTURE (MANDATORY BASE SLIDES)**
Generate content for these 8 core slides that follow proven business proposal structure:

# SLIDE 1: EXECUTIVE SUMMARY
# SLIDE 2: MARKET ANALYSIS & INDUSTRY OVERVIEW
# SLIDE 3: SOLUTION ARCHITECTURE & TECHNICAL APPROACH
# SLIDE 4: IMPLEMENTATION STRATEGY & METHODOLOGY
# SLIDE 5: PROJECT TIMELINE & MILESTONES
# SLIDE 6: RISK MANAGEMENT & MITIGATION
# SLIDE 7: FINANCIAL ANALYSIS & ROI PROJECTIONS
# SLIDE 8: SUCCESS METRICS & PERFORMANCE INDICATORS

**TIER 2: RESEARCH-BASED ADDITIONAL SLIDES**
After completing the trained structure above, conduct research and analysis on their specific requirements: "${projectData.projectRequirements}"

Based on your research, generate EXACTLY 8 ADDITIONAL slides that are:
- Specific to their project requirements: "${projectData.projectRequirements}"
- Relevant to their ${projectData.industryType} industry challenges
- Addressing unique problems mentioned in their requirements
- Providing additional value beyond the standard structure
- Each slide should focus on a different aspect of their project requirements

**MANDATORY REQUIREMENT:**
You MUST include BOTH the trained structure headings AND research-based headings in your final output. The trained structure provides the foundation, and the research-based headings add customization specific to their project.
 **Check for the Repeatative headings and remove them**
 **Check for the headings that are not relevant to the project and remove them**
 **Check with both trained mandatory heading and research-based additional headings and remove the headings if it is repeatative**

**RESEARCH PROCESS FOR ADDITIONAL SLIDES:**
1. Analyze their specific requirements: "${projectData.projectRequirements}"
2. Research ${projectData.industryType} industry challenges and opportunities
3. Identify gaps in the standard structure for their specific needs
4. Generate EXACTLY 8 additional slides that address their unique requirements
5. Ensure these slides complement, not duplicate, the trained structure
6. Each slide should cover a different aspect of their project requirements

**EXAMPLE ADDITIONAL SLIDES (based on research):**
- Industry-specific compliance requirements for ${projectData.industryType}
- Unique technical challenges for their specific project
- Specialized market considerations for their industry
- Custom integration requirements based on their needs
- Specific risk factors for their industry/project combination
- Specialized success metrics for their business model
- Industry-specific ROI considerations and benchmarks

**TOTAL SLIDES: 16 slides (8 trained + 9-16 research-based)**

**CRITICAL REQUIREMENTS:**
✅ **SPECIFIC** to ${projectData.companyName}'s ${projectData.projectName} project
✅ **RELEVANT** to ${projectData.industryType} industry challenges
✅ **ADDRESSING** the requirements: "${projectData.projectRequirements}"
✅ **APPROPRIATE** for the team's experience level: ${projectData.teamMembers.map(member => `${member.role} (${member.experience})`).join(', ')}
✅ **LOGICAL** presentation flow for business stakeholders
✅ **Check for the Repeatative headings and remove them**
✅ **Check for the headings that are not relevant to the project and remove them**
✅ **Check with both trained mandatory heading and research-based additional headings and remove the headings if it is repeatative**


**FORBIDDEN GENERIC HEADINGS:**
🚫 Do NOT use: "Market Analysis", "Solution Overview", "Implementation Strategy"
🚫 Do NOT use generic business presentation templates
🚫 Do NOT use one-size-fits-all slide titles

**SCHEMA-BASED CONTENT GENERATION:**
🚨 **CRITICAL**: You must generate content using the EXACT schema format below. This ensures perfect slide separation and structure.

**CONTENT STRUCTURE RULES:**
✅ Each SLIDE_CONTENT must contain ONLY content relevant to that specific slide title
✅ Do NOT include subheadings or content from other slides within SLIDE_CONTENT
✅ Each slide must be self-contained and focused on its specific topic
✅ Use bullet points, paragraphs, and lists within SLIDE_CONTENT
✅ Do NOT mix content from different slides or sections

**MANDATORY CORE SECTIONS (Slides 1-8):**
Generate these 8 slides using the schema format:

===SLIDE_START===
SLIDE_NUMBER: 1
SLIDE_TITLE: Executive Summary
SLIDE_CONTENT: 
• Project Overview: ${projectData.projectName} - A comprehensive solution for ${projectData.companyName}
• Key Objectives: Deliver innovative features including ${projectData.selectedFeatures}
• Business Benefits: Enhanced efficiency, improved user experience, and competitive advantage
• Target Market: ${projectData.industryType} industry with focus on modern technology adoption
===SLIDE_END===

===SLIDE_START===
SLIDE_NUMBER: 2
SLIDE_TITLE: Market Analysis
SLIDE_CONTENT: 
• Industry Trends: Current market dynamics in ${projectData.industryType} sector
• Market Size: Growing demand for digital transformation solutions
• Competitive Landscape: Analysis of existing solutions and market gaps
• Opportunities: Untapped potential in AI-powered automation and user experience enhancement
===SLIDE_END===

===SLIDE_START===
SLIDE_NUMBER: 3
SLIDE_TITLE: Solution Architecture
SLIDE_CONTENT: 
• Technical Approach: Modern, scalable architecture designed for ${projectData.projectName}
• System Design: Microservices-based architecture with cloud-native deployment
• Technology Stack: Latest frameworks and tools for optimal performance
• Integration Capabilities: Seamless integration with existing systems and third-party services
===SLIDE_END===

===SLIDE_START===
SLIDE_NUMBER: 4
SLIDE_TITLE: Implementation Strategy
SLIDE_CONTENT: 
• Development Phases: Structured approach with clear milestones
• Feature Implementation: Prioritized rollout of ${projectData.selectedFeatures}
• Deployment Approach: Agile methodology with continuous integration
• Quality Assurance: Comprehensive testing and validation processes
===SLIDE_END===

===SLIDE_START===
SLIDE_NUMBER: 5
SLIDE_TITLE: Project Timeline
SLIDE_CONTENT: 
• Project Duration: ${projectData.timeline} timeline with clear phases
• Key Milestones: Major deliverables and checkpoints
• Critical Path: Essential tasks and dependencies
• Resource Allocation: Team assignments and timeline optimization
===SLIDE_END===

===SLIDE_START===
SLIDE_NUMBER: 6
SLIDE_TITLE: Risk Management
SLIDE_CONTENT: 
• Risk Assessment: Comprehensive analysis of potential challenges
• Mitigation Strategies: Proactive measures for ${projectData.industryType} industry
• Contingency Planning: Backup plans for critical scenarios
• Monitoring Framework: Continuous risk evaluation and management
===SLIDE_END===

===SLIDE_START===
SLIDE_NUMBER: 7
SLIDE_TITLE: Financial Analysis
SLIDE_CONTENT: 
• Cost Breakdown: Detailed budget analysis for ${projectData.companyName}
• ROI Projections: Expected returns and business value
• Investment Requirements: Resource allocation and funding needs
• Financial Benefits: Long-term cost savings and revenue generation
===SLIDE_END===

===SLIDE_START===
SLIDE_NUMBER: 8
SLIDE_TITLE: Success Metrics
SLIDE_CONTENT: 
• Key Performance Indicators: Measurable success criteria
• Performance Metrics: System performance and user satisfaction
• Business Impact: Quantifiable business outcomes
• Evaluation Framework: Continuous monitoring and improvement processes
===SLIDE_END===

**RESEARCH-BASED SLIDES (Slides 9-16):**
After generating the 8 mandatory slides, conduct comprehensive research using ALL user inputs:

**RESEARCH INPUTS:**
- Project Requirements: "${projectData.projectRequirements}"
- Industry: ${projectData.industryType}
- Company: ${projectData.companyName}
- Selected Features: ${projectData.selectedFeatures}
- Team Composition: ${projectData.teamMembers}
- Timeline: ${projectData.timeline}

**FEATURE-BASED RESEARCH ANALYSIS:**
Analyze each selected feature and generate research-based slides that address:
1. Implementation strategies for selected features
2. Integration challenges between features
3. Technical requirements for feature combinations
4. Industry-specific considerations for features
5. Compliance requirements for features in ${projectData.industryType}
6. Training needs for selected features
7. Support and maintenance for feature set
8. Future enhancements based on feature foundation

**RESEARCH SLIDE GENERATION EXAMPLES:**

If user selected features like "AI-Powered Employee Onboarding", "Predictive Analytics", "Automated Compliance":

===SLIDE_START===
SLIDE_NUMBER: 9
SLIDE_TITLE: AI-Powered Employee Onboarding Implementation Strategy
SLIDE_CONTENT: 
• Implementation Approach: AI-driven onboarding system for ${projectData.companyName}
• Feature Integration: Seamless connection with existing HR systems
• AI Model Training: Industry-specific algorithms for ${projectData.industryType}
• Compliance Considerations: Regulatory requirements and data protection
===SLIDE_END===

===SLIDE_START===
SLIDE_NUMBER: 10
SLIDE_TITLE: Predictive Analytics Integration Architecture
SLIDE_CONTENT: 
• Technical Implementation: Advanced analytics platform for ${projectData.projectName}
• Data Pipeline Design: Real-time data processing and analysis
• Integration Strategy: Connection with AI-Powered Onboarding features
• Analytics Dashboard: Customized reporting for ${projectData.companyName}
===SLIDE_END===

===SLIDE_START===
SLIDE_NUMBER: 11
SLIDE_TITLE: Automated Compliance Framework for ${projectData.industryType}
SLIDE_CONTENT: 
• Compliance Automation: Automated monitoring and reporting systems
• Regulatory Requirements: ${projectData.industryType} specific compliance standards
• Feature Integration: Connection with onboarding and analytics systems
• Monitoring Framework: Continuous compliance validation and reporting
===SLIDE_END===

===SLIDE_START===
SLIDE_NUMBER: 12
SLIDE_TITLE: Feature Integration Strategy for ${projectData.companyName}
SLIDE_CONTENT: 
• Integration Architecture: Unified system connecting all selected features
• Data Flow Design: Seamless data exchange between feature modules
• User Experience: Consistent interface across all integrated features
• System Performance: Optimized performance for feature combinations
===SLIDE_END===

===SLIDE_START===
SLIDE_NUMBER: 13
SLIDE_TITLE: Training Program for Selected Features
SLIDE_CONTENT: 
• Training Modules: Comprehensive training for ${projectData.selectedFeatures}
• Hands-on Workshops: Practical training sessions for ${projectData.teamMembers}
• Certification Programs: Skill validation and competency assessment
• Ongoing Support: Continuous learning and skill development
===SLIDE_END===

===SLIDE_START===
SLIDE_NUMBER: 14
SLIDE_TITLE: Support and Maintenance Framework
SLIDE_CONTENT: 
• Support Strategy: 24/7 technical support for all features
• Maintenance Schedule: Regular updates and system optimization
• Troubleshooting Protocols: Quick resolution of technical issues
• Performance Monitoring: Continuous system health and optimization
===SLIDE_END===

===SLIDE_START===
SLIDE_NUMBER: 15
SLIDE_TITLE: ROI Analysis for Feature Combination
SLIDE_CONTENT: 
• Cost-Benefit Analysis: Financial impact of selected features
• ROI Projections: Expected returns for ${projectData.companyName}
• Break-even Analysis: Timeline for investment recovery
• Long-term Value: Sustained business benefits and growth
===SLIDE_END===

===SLIDE_START===
SLIDE_NUMBER: 16
SLIDE_TITLE: Future Enhancement Roadmap
SLIDE_CONTENT: 
• Feature Evolution: Planned enhancements and new capabilities
• Scalability Planning: Growth strategies for ${projectData.companyName}
• Technology Roadmap: Future technology integration and upgrades
• Innovation Pipeline: Next-generation features and capabilities
===SLIDE_END===

**CRITICAL SCHEMA REQUIREMENTS:**
🚨 **MANDATORY FORMAT**: You MUST use the exact schema format for ALL slides:
- Start each slide with: ===SLIDE_START===
- Include: SLIDE_NUMBER: [number]
- Include: SLIDE_TITLE: [title]
- Include: SLIDE_CONTENT: [detailed content]
- End each slide with: ===SLIDE_END===

**SLIDE STRUCTURE REQUIREMENTS:**
- Slides 1-8: Use the exact mandatory structure headings above
- Slides 9-16: Generate research-based headings specific to selected features and project requirements
- Total: EXACTLY 16 slides (8 mandatory + 8 research-based)
- Research-based headings must be specific to: "${projectData.projectRequirements}"
- Research-based headings must be relevant to: ${projectData.industryType} industry
- Research-based headings must address: Selected features ${projectData.selectedFeatures}
- Each research-based slide must focus on a different aspect of their requirements and features
- **ADAPTIVE**: If user has deleted mandatory headings, adjust content generation to maintain completeness

**SCHEMA VALIDATION:**
✅ Every slide must follow the exact schema format
✅ No content outside of SLIDE_CONTENT sections
✅ All 16 slides must be numbered sequentially
✅ Research-based slides must be feature-specific and industry-relevant
✅ Each SLIDE_CONTENT must be self-contained and focused
✅ Do NOT include content from other slides within SLIDE_CONTENT
✅ Use bullet points (•) for organized content structure
✅ Do NOT mix different slide topics or sections

**CONTENT QUALITY REQUIREMENTS:**
🚨 **CRITICAL**: Each slide must contain ONLY content relevant to its specific title
🚨 **NO MIXING**: Do not include subheadings or content from other slides
🚨 **FOCUSED CONTENT**: Each SLIDE_CONTENT should be about ONE specific topic only
🚨 **CLEAN SEPARATION**: Ensure clear boundaries between different slide content
🚨 **PROPER STRUCTURE**: Use bullet points and clear organization within each slide

**REFERENCE BUSINESS PROPOSAL STRUCTURE** (Adapt these concepts to YOUR specific project):
Standard business proposal flow: Title Page → Executive Summary → Introduction/Background → Objectives/Goals → Proposed Solution/Approach → Scope of Work → Timeline → Risk Assessment → Budget/Investment → Success Metrics → Next Steps

**EXAMPLES BY INDUSTRY** (DO NOT COPY - CREATE CUSTOMIZED VERSIONS):
Healthcare AI: "AI DIAGNOSTIC ACCURACY FOR RADIOLOGY", "HIPAA COMPLIANCE FRAMEWORK", "INTEGRATION WITH EXISTING EMR SYSTEMS"
FinTech: "DIGITAL PAYMENT SECURITY ARCHITECTURE", "PCI DSS COMPLIANCE STRATEGY", "FRAUD DETECTION ALGORITHM DEPLOYMENT"
E-commerce: "CUSTOMER ACQUISITION FUNNEL OPTIMIZATION", "INVENTORY MANAGEMENT AUTOMATION", "CONVERSION RATE ENHANCEMENT SYSTEM"

**YOUR TASK:** 
1. RESEARCH the ${projectData.industryType} industry challenges and opportunities
2. ANALYZE their specific requirements: "${projectData.projectRequirements}"
3. CREATE 10-12 slide headings that follow a logical business proposal flow
4. CUSTOMIZE each heading to be specific to ${projectData.companyName}'s ${projectData.projectName}
5. ENSURE headings address their exact problems and goals
6. MAKE each heading so specific that it could ONLY apply to this project
7. COMBINE trained structure with research-based additional content

Generate headings that blend professional business proposal structure with deep customization for their unique project and do research with user inputs and the project requirements.`;

      return `${basePrompt}

${slideStructure}

**STEP 2: AFTER CREATING SLIDE HEADINGS, GENERATE DETAILED CONTENT:**

**CRITICAL SLIDE FORMATTING INSTRUCTIONS:**

**MANDATORY FOR EACH SLIDE:**
1. ✅ Reference ${projectData.companyName} and ${projectData.projectName} specifically
2. ✅ Include data and statistics relevant to ${projectData.industryType} industry
3. ✅ Address problems mentioned in: "${projectData.projectRequirements}"
4. ✅ Consider team capabilities: ${projectData.teamMembers.map(member => `${member.role} (${member.experience})`).join(', ')}
5. ✅ Align with ${projectData.timeline.value} ${projectData.timeline.unit} timeline
6. ✅ Use ${projectData.industryType} industry-specific terminology and examples
7. ✅ Focus on business value specific to their company context
8. ✅ Include realistic recommendations for their team's experience level

**CRITICAL CONTENT FORMATTING INSTRUCTIONS - FOLLOW EXACTLY:**

**MANDATORY FORMATTING RULES:**
1. ✅ **HEADINGS**: Use # for main slide titles, ## for section headings
2. ✅ **BULLET POINTS**: Use - for ALL lists, features, benefits, action items, and key points
3. ✅ **PARAGRAPHS**: Use regular text ONLY for brief explanations (1-2 lines maximum)
4. ✅ **BOLD TEXT**: Make company names, project names, key metrics, and important terms appear as BOLD TEXT (not markdown symbols)
5. ✅ **CONTENT STRUCTURE**: Each slide must have a mix of bullet points and brief paragraphs

**IMPORTANT FORMATTING NOTE:**
- DO NOT use markdown symbols like **text** or *text*
- Instead, make the text appear as actual BOLD TEXT when rendered
- Company names, project names, key metrics should appear as BOLD TEXT
- Use proper formatting that renders as bold text, not markdown syntax

**CONTENT PLACEMENT RULES:**
6. ✅ **BULLET POINTS FOR**: 
   - Lists of features, benefits, or capabilities
   - Key statistics and metrics
   - Action items and next steps
   - Risk factors and mitigation strategies
   - Technical specifications
   - Timeline milestones
   - Cost breakdowns
   - Success metrics

7. ✅ **PARAGRAPHS FOR**:
   - Brief context or background (1-2 lines only)
   - Short explanations of concepts
   - Executive summaries (keep concise)

8. ✅ **BOLD FORMATTING FOR**:
   - Company name: ${projectData.companyName} (appear as BOLD TEXT)
   - Project name: ${projectData.projectName} (appear as BOLD TEXT)
   - Key metrics: $2.5M ROI (appear as BOLD TEXT)
   - Important terms: AI-Powered Solution (appear as BOLD TEXT)
   - Industry terms: ${projectData.industryType} (appear as BOLD TEXT)

**CONTENT BALANCE REQUIREMENTS:**
9. ✅ **EACH SLIDE MUST CONTAIN**:
   - 70% bullet points (for lists, features, metrics)
   - 30% brief paragraphs (for context and explanations)
   - Bold formatting for key terms and names
10. ✅ **PARAGRAPH LIMITS**:
    - Maximum 2 lines per paragraph
    - Use paragraphs sparingly for context only
    - Prefer bullet points over paragraphs for most content

**FORMATTING EXAMPLES:**

**CORRECT FORMAT:**
# EXECUTIVE SUMMARY

**${projectData.companyName}** presents the **${projectData.projectName}** solution designed to revolutionize ${projectData.industryType} industry operations.

**Key Highlights:**
- **$2.5M** projected ROI within 12 months
- **40%** reduction in operational costs
- **AI-powered** automation capabilities
- **Scalable** architecture for future growth

**Project Overview:**
The solution addresses critical challenges in ${projectData.industryType} by implementing advanced automation and AI technologies.

**INCORRECT FORMAT (AVOID):**
# EXECUTIVE SUMMARY

This is a long paragraph that goes on for multiple lines without proper formatting. The content should be structured with bullet points and brief paragraphs instead of long text blocks that don't follow the formatting requirements.

**VALIDATION CHECKLIST:**
- [ ] Are bullet points used for lists and key points?
- [ ] Are paragraphs kept to 1-2 lines maximum?
- [ ] Is bold formatting used for key terms and names?
- [ ] Does each slide have a mix of bullets and brief paragraphs?
- [ ] Is content structured for easy reading and scanning?
- [ ] Are company and project names bolded throughout?
- [ ] Are key metrics and statistics bolded?
- [ ] Is the content placement optimized for presentation format?

**SLIDE CUSTOMIZATION REQUIREMENTS:**
- Every slide must be specific to their project, not generic
- Use their company name and project name in slide titles where appropriate
- Include metrics and KPIs relevant to ${projectData.industryType} industry
- Address their specific challenges and goals mentioned in requirements
- Provide solutions that their team can realistically implement

**VALIDATION FOR EACH SLIDE:**
- Could this slide apply to any other company? If yes, make it more specific
- Does it address their stated requirements and problems?
- Are recommendations appropriate for their team's experience?
- Is industry context (${projectData.industryType}) properly integrated?

**CONTENT FORMATTING EXAMPLES:**
**Slide Title:** # EXECUTIVE SUMMARY
**Section Heading:** ## Project Overview
**Key Terms:** **Company:** techjays, **Project:** uare.ai
**Bullet Points:**
- **AI-Powered Cloning:** Enables users to create personalized connections
- **Virtual Environment:** Secure and scalable online platform
- **User Experience:** Intuitive interface with advanced features
**Paragraph:** The uare.ai project revolutionizes online connections by offering a web application with AI-powered cloning features. This innovative approach enables users to create personalized connections in a secure virtual environment.

Generate presentation slides that are uniquely tailored to ${projectData.companyName}'s ${projectData.projectName}.`;
    } else {
      return `${basePrompt}

**DOCUMENT STRUCTURE APPROACH:**
You will generate a comprehensive business proposal document using a TWO-TIER approach:

**TIER 1: TRAINED STRUCTURE (MANDATORY BASE SECTIONS)**
Generate content for these 8 core sections that are trained and proven:

# 1. EXECUTIVE SUMMARY
- Project overview and objectives
- Business value proposition
- Key benefits and ROI
- Implementation approach
- Resource requirements
- Timeline and budget summary

# 2. MARKET ANALYSIS
- Industry overview and trends
- Market size and growth potential
- Target market segments
- Competitive analysis
- Market opportunity assessment
- SWOT analysis

# 3. SOLUTION ARCHITECTURE
- Technical overview
- System architecture
- Key features and functionalities
- Technology stack
- Integration points
- Security measures
- Scalability considerations

# 4. IMPLEMENTATION STRATEGY
- Development methodology
- Team structure and expertise
- Resource allocation
- Quality assurance approach
- Development phases
- Deployment strategy
- Training and support plan

# 5. PROJECT TIMELINE AND MILESTONES
- Project phases
- Key deliverables
- Critical path analysis
- Resource timeline
- Dependencies
- Progress tracking methodology

# 6. RISK MANAGEMENT
- Risk assessment matrix
- Impact analysis
- Mitigation strategies
- Contingency plans
- Compliance requirements
- Security considerations
- Quality control measures

# 7. FINANCIAL ANALYSIS
- Cost breakdown
- ROI projections
- Resource costs
- Infrastructure expenses
- Maintenance costs
- Revenue projections
- Break-even analysis

# 8. SUCCESS METRICS AND REPORTING
- Key Performance Indicators (KPIs)
- Success criteria
- Monitoring methodology
- Reporting framework
- Performance benchmarks
- Quality metrics
- Business impact measures

**MANDATORY REQUIREMENT:**
You MUST include ALL 8 trained structure sections above in your final document. These provide the foundation for any business proposal.

**ADAPTIVE BEHAVIOR:**
If the user has customized their presentation structure and removed some mandatory sections, adapt your content generation accordingly:
- Generate content for the remaining mandatory sections that are still present
- Adjust the research-based content to fill any gaps created by deleted mandatory sections
- Ensure the final document maintains logical flow and completeness
- If a mandatory section is missing, incorporate its key points into other relevant sections

**TIER 2: RESEARCH-BASED ADDITIONAL SECTIONS**
After completing the trained structure above, conduct research and analysis on their specific requirements: "${projectData.projectRequirements}"

Based on your research, generate EXACTLY 8 ADDITIONAL sections that are:
- Specific to their project requirements
- Relevant to their ${projectData.industryType} industry
- Addressing unique challenges mentioned in their requirements
- Providing additional value beyond the standard structure
- Each section should focus on a different aspect of their project requirements

**RESEARCH PROCESS FOR ADDITIONAL SECTIONS:**
1. Analyze their specific requirements: "${projectData.projectRequirements}"
2. Research ${projectData.industryType} industry challenges and opportunities
3. Identify gaps in the standard structure for their specific needs
4. Generate EXACTLY 8 additional sections that address their unique requirements
5. Ensure these sections complement, not duplicate, the trained structure
6. Each section should cover a different aspect of their project requirements

**EXAMPLE ADDITIONAL SECTIONS (based on research):**
- Industry-specific compliance requirements
- Unique technical challenges for their project
- Specialized market considerations
- Custom integration requirements
- Specific risk factors for their industry/project
- Specialized success metrics
- Industry-specific ROI considerations

**CRITICAL DOCUMENT FORMATTING INSTRUCTIONS:**

**MANDATORY FOR EVERY SECTION:**
1. ✅ Reference ${projectData.companyName} and ${projectData.projectName} throughout
2. ✅ Include market data specific to ${projectData.industryType} industry
3. ✅ Address their specific requirements: "${projectData.projectRequirements}"
4. ✅ Consider team experience: ${projectData.teamMembers.map(member => `${member.role} (${member.experience})`).join(', ')}
5. ✅ Align all recommendations with ${projectData.timeline.value} ${projectData.timeline.unit} timeline
6. ✅ Use ${projectData.industryType} industry-specific terminology and compliance requirements
7. ✅ Focus on ROI and business value relevant to their company size and market
8. ✅ Provide actionable recommendations their team can realistically implement

**CRITICAL DOCUMENT FORMATTING INSTRUCTIONS - FOLLOW EXACTLY:**

**MANDATORY FORMATTING RULES:**
1. ✅ **HEADINGS**: Use # for main section titles, ## for subsection headings
2. ✅ **BULLET POINTS**: Use - for ALL lists, features, benefits, action items, and key points
3. ✅ **PARAGRAPHS**: Use regular text ONLY for brief explanations (1-2 lines maximum)
4. ✅ **BOLD TEXT**: Use **bold** for company names, project names, key metrics, and important terms
5. ✅ **CONTENT STRUCTURE**: Each section must have a mix of bullet points and brief paragraphs

**CONTENT PLACEMENT RULES:**
6. ✅ **BULLET POINTS FOR**: 
   - Lists of features, benefits, or capabilities
   - Key statistics and metrics
   - Action items and next steps
   - Risk factors and mitigation strategies
   - Technical specifications
   - Timeline milestones
   - Cost breakdowns
   - Success metrics
   - Compliance requirements
   - Quality measures

7. ✅ **PARAGRAPHS FOR**:
   - Brief context or background (1-2 lines only)
   - Short explanations of concepts
   - Executive summaries (keep concise)
   - Section introductions (brief)

8. ✅ **BOLD FORMATTING FOR**:
   - Company name: ${projectData.companyName} (appear as BOLD TEXT)
   - Project name: ${projectData.projectName} (appear as BOLD TEXT)
   - Key metrics: $2.5M ROI (appear as BOLD TEXT)
   - Important terms: AI-Powered Solution (appear as BOLD TEXT)
   - Industry terms: ${projectData.industryType} (appear as BOLD TEXT)

**CONTENT BALANCE REQUIREMENTS:**
9. ✅ **EACH SECTION MUST CONTAIN**:
   - 70% bullet points (for lists, features, metrics)
   - 30% brief paragraphs (for context and explanations)
   - Bold formatting for key terms and names
10. ✅ **PARAGRAPH LIMITS**:
    - Maximum 2 lines per paragraph
    - Use paragraphs sparingly for context only
    - Prefer bullet points over paragraphs for most content

**FORMATTING EXAMPLES:**

**CORRECT FORMAT:**
# EXECUTIVE SUMMARY

**${projectData.companyName}** presents the **${projectData.projectName}** solution designed to revolutionize ${projectData.industryType} industry operations.

**Key Highlights:**
- **$2.5M** projected ROI within 12 months
- **40%** reduction in operational costs
- **AI-powered** automation capabilities
- **Scalable** architecture for future growth

**Project Overview:**
The solution addresses critical challenges in ${projectData.industryType} by implementing advanced automation and AI technologies.

**INCORRECT FORMAT (AVOID):**
# EXECUTIVE SUMMARY

This is a long paragraph that goes on for multiple lines without proper formatting. The content should be structured with bullet points and brief paragraphs instead of long text blocks that don't follow the formatting requirements.

**VALIDATION CHECKLIST:**
- [ ] Are bullet points used for lists and key points?
- [ ] Are paragraphs kept to 1-2 lines maximum?
- [ ] Is bold formatting used for key terms and names?
- [ ] Does each section have a mix of bullets and brief paragraphs?
- [ ] Is content structured for easy reading and scanning?
- [ ] Are company and project names bolded throughout?
- [ ] Are key metrics and statistics bolded?
- [ ] Is the content placement optimized for document format?

**DOCUMENT CUSTOMIZATION REQUIREMENTS:**
- Every section header should reference their project context where appropriate
- Include specific examples and case studies from ${projectData.industryType} industry
- Address stakeholder concerns specific to their project requirements
- Provide detailed analysis that justifies solutions for their specific needs
- Include tables and charts with data relevant to their industry and project scope
- Reference their timeline constraints and team capabilities in recommendations

**CONTENT VALIDATION CHECKLIST:**
- Is this section specific to ${projectData.companyName}'s project or generic?
- Does it address problems mentioned in their requirements?
- Are recommendations realistic for their team's experience level?
- Is ${projectData.industryType} industry context properly integrated?
- Are financial projections and ROI relevant to their business model?
- Is all the formatting and the structure is done, bullets must be bullet points and paragraphs must be paragraphs, headings must be headings, and bold text must be bold text.

Generate a comprehensive, professional document that is uniquely tailored to ${projectData.companyName}'s ${projectData.projectName} with proper markdown formatting.`;
    }
  }

  private static getFallbackFeatures(timeUnit: string = "hours"): Array<{name: string; description: string; timeEstimate?: string}> {
    const getTimeEstimate = (base: number): string => {
      switch (timeUnit) {
        case "days":
          return `${Math.ceil(base / 8)}-${Math.ceil((base + 8) / 8)} days`;
        case "weeks":
          return `${Math.ceil(base / 40)}-${Math.ceil((base + 16) / 40)} weeks`;
        default: // hours
          return `${base}-${base + 8} hours`;
      }
    };

    return [
      {
        name: "User Registration",
        description: "Allow users to create an account by providing basic information such as name, email, and password. The system will validate the input data and send a confirmation email to the user. Includes password strength checking and basic security measures.",
        timeEstimate: getTimeEstimate(16)
      },
      {
        name: "User Login",
        description: "Enable users to log in to their accounts using their registered email and password. The system will authenticate the user credentials and redirect them to the dashboard. Includes session management and security features.",
        timeEstimate: getTimeEstimate(12)
      },
      {
        name: "Password Reset",
        description: "Allow users to reset their passwords by providing their registered email address. The system will send a password reset link to the user's email, which will redirect them to a secure password reset page.",
        timeEstimate: getTimeEstimate(8)
      },
      {
        name: "User Profile Management",
        description: "Enable users to view and edit their profile information, including name, email, and personal settings. Users can update their information and manage account preferences with proper validation.",
        timeEstimate: getTimeEstimate(16)
      },
      {
        name: "Dashboard",
        description: "Create a comprehensive dashboard that displays an overview of user activities, recent items, and quick access to main features. Includes data visualization and customizable widgets for better user experience.",
        timeEstimate: getTimeEstimate(24)
      },
      {
        name: "Document Creation",
        description: "Allow users to create new documents using input forms and templates. The system will process user inputs and generate structured documents with proper formatting and styling.",
        timeEstimate: getTimeEstimate(32)
      },
      {
        name: "Document Editing",
        description: "Enable users to edit existing documents with a rich text editor interface. Includes auto-save functionality, version control, and real-time collaboration features for multiple users.",
        timeEstimate: getTimeEstimate(40)
      },
      {
        name: "Document Search",
        description: "Implement a powerful search functionality that allows users to search for documents by keywords, tags, content, and metadata. Includes advanced filtering and sorting options.",
        timeEstimate: getTimeEstimate(20)
      },
      {
        name: "File Upload and Management",
        description: "Allow users to upload various file types including images, PDFs, and documents. Includes file validation, storage management, and secure file access controls with preview functionality.",
        timeEstimate: getTimeEstimate(24)
      },
      {
        name: "User Role Management",
        description: "Implement a comprehensive role-based access control system where administrators can assign different roles to users such as admin, editor, or viewer. Each role has specific permissions and access levels.",
        timeEstimate: getTimeEstimate(32)
      },
      {
        name: "Notification System",
        description: "Design a notification system that sends alerts to users for various events such as document updates, system announcements, and activity notifications. Includes email and in-app notifications.",
        timeEstimate: getTimeEstimate(20)
      },
      {
        name: "Export and Download",
        description: "Enable users to export documents in multiple formats including PDF, Word, and plain text. Includes batch export functionality and format optimization for different use cases.",
        timeEstimate: getTimeEstimate(16)
      },
      {
        name: "Admin Panel",
        description: "Create a comprehensive administration panel for system administrators to manage users, monitor system performance, configure settings, and access analytics and reporting tools.",
        timeEstimate: getTimeEstimate(48)
      },
      {
        name: "API Integration",
        description: "Develop RESTful APIs to integrate with third-party services and allow external applications to interact with the system. Includes authentication, rate limiting, and comprehensive documentation.",
        timeEstimate: getTimeEstimate(40)
      },
      {
        name: "Data Backup and Recovery",
        description: "Implement automated backup systems to ensure data integrity and availability. Includes scheduled backups, data recovery procedures, and disaster recovery planning with regular testing.",
        timeEstimate: getTimeEstimate(32)
      }
    ];
  }

  private static parseValidationResponse(content: string): {isValid: boolean; feedback: string; suggestions: string[]} {
    try {
      const result = JSON.parse(content);
      return {
        isValid: result.isValid || false,
        feedback: result.feedback || 'No feedback provided',
        suggestions: result.suggestions || []
      };
    } catch (error) {
      // Fallback parsing
      const isValid = content.toLowerCase().includes('valid') && !content.toLowerCase().includes('not valid');
      return {
        isValid,
        feedback: isValid ? 'Requirements appear valid' : 'Requirements need improvement',
        suggestions: []
      };
    }
  }

  private static async callOpenAICompatibleFeatures(prompt: string, apiKey: string, model: string, maxTokens: number, temperature: number): Promise<string> {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
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
            content: "You are an expert software architect and business analyst. Provide detailed, accurate responses in the requested JSON format."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: maxTokens,
        temperature: temperature,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  private static async callOpenAICompatibleForHeadings(apiKey: string, model: string, prompt: string, provider: string): Promise<string> {
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
            content: "You are an expert business consultant and presentation designer. Generate professional, industry-specific presentation headings based on the user's exact project requirements."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 800,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`${provider} API request failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || "";
  }

  private static async callAnthropicForHeadings(apiKey: string, model: string, prompt: string): Promise<string> {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "Content-Type": "application/json",
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: model,
        max_tokens: 800,
        messages: [
          {
            role: "user",
            content: `You are an expert business consultant and presentation designer. Generate professional, industry-specific presentation headings based on the user's exact project requirements.\n\n${prompt}`
          }
        ]
      }),
    });

    if (!response.ok) {
      throw new Error(`Anthropic API request failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.content[0]?.text || "";
  }

  private static async callAnthropicFeatures(prompt: string, apiKey: string, model: string, maxTokens: number, temperature: number): Promise<string> {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "Content-Type": "application/json",
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: model,
        max_tokens: maxTokens,
        temperature: temperature,
        messages: [
          {
            role: "user",
            content: prompt
          }
        ]
      }),
    });

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.content[0].text;
  }

  /**
   * Generates research-based additional content sections based on user requirements
   * This method analyzes the project requirements and generates additional sections
   * that complement the trained structure with research-based insights
   */
  static async generateResearchBasedContent(projectData: ProjectData): Promise<AIResponse> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new Error("AI API key not configured. Please set it in Profile settings.");
    }

    const provider = this.getProvider();
    const model = this.getModel();
    const prompt = this.buildResearchPrompt(projectData);
    
    try {
      let response;
      
      switch (provider) {
        case "openai":
        case "groq":
          response = await this.callOpenAICompatible(apiKey, model, prompt, provider);
          break;
        case "huggingface":
          response = await this.callHuggingFace(apiKey, model, prompt);
          break;
        case "anthropic":
          response = await this.callAnthropic(apiKey, model, prompt);
          break;
        case "cohere":
          response = await this.callCohere(apiKey, model, prompt);
          break;
        default:
          throw new Error(`Unsupported AI provider: ${provider}`);
      }

      return response;
    } catch (error) {
      console.error("AI Service Error:", error);
      throw error;
    }
  }

  /**
   * Builds a research-focused prompt for generating additional content sections
   */
  private static buildResearchPrompt(projectData: ProjectData): string {
    let referenceContent = "";
    if (projectData.referenceDocuments && projectData.referenceDocuments.length > 0) {
      referenceContent = "\n\n## Reference Documents:\n";
      projectData.referenceDocuments.forEach((doc, index) => {
        referenceContent += `\n### Document ${index + 1}: ${doc.name}\n${doc.content}\n`;
      });
      referenceContent += "\nPlease use the information from these reference documents to enhance the generated content where relevant.\n";
    }

    return `You are an expert business analyst and industry researcher specializing in ${projectData.industryType} industry.

**RESEARCH-BASED CONTENT GENERATION TASK:**

**PROJECT CONTEXT:**
- Project Name: ${projectData.projectName}
- Company: ${projectData.companyName}
- Industry: ${projectData.industryType}
- Requirements: "${projectData.projectRequirements}"
- Team: ${projectData.teamMembers.map(member => `${member.role} (${member.experience})`).join(', ')}
- Timeline: ${projectData.timeline.value} ${projectData.timeline.unit}

**YOUR MISSION:**
Conduct comprehensive research and analysis on their specific requirements to generate 2-4 ADDITIONAL content sections that complement the standard business proposal structure.

**RESEARCH PROCESS:**
1. **ANALYZE REQUIREMENTS**: Deep dive into their specific requirements: "${projectData.projectRequirements}"
2. **INDUSTRY RESEARCH**: Research ${projectData.industryType} industry challenges, trends, and best practices
3. **GAP ANALYSIS**: Identify what's missing from standard business proposal structure for their specific needs
4. **OPPORTUNITY IDENTIFICATION**: Find unique opportunities specific to their project and industry
5. **RISK ASSESSMENT**: Identify industry-specific risks and challenges for their project
6. **COMPLIANCE RESEARCH**: Research regulatory and compliance requirements for ${projectData.industryType}

**GENERATE ADDITIONAL SECTIONS:**
Based on your research, create 2-4 additional sections that are:
- **SPECIFIC** to their project requirements
- **RELEVANT** to ${projectData.industryType} industry
- **VALUABLE** beyond standard business proposal content
- **ACTIONABLE** for their team's experience level
- **COMPLEMENTARY** to existing structure (not duplicative)

**EXAMPLE RESEARCH-BASED SECTIONS:**
- Industry-specific compliance and regulatory requirements
- Unique technical challenges for their project type
- Specialized market analysis for their industry segment
- Custom integration requirements and considerations
- Industry-specific risk factors and mitigation strategies
- Specialized success metrics and KPIs for their business model
- Industry-specific ROI considerations and benchmarks
- Unique competitive advantages for their project
- Specialized implementation considerations for their industry
- Industry-specific quality assurance and testing requirements

**CONTENT REQUIREMENTS:**
- Each section must be 300-500 words
- Include specific data and statistics relevant to ${projectData.industryType}
- Reference their company and project throughout
- Provide actionable recommendations
- Include industry-specific examples and case studies
- Address their specific timeline and team capabilities
- Use professional business language with 'popins' font style

**OUTPUT FORMAT:**
Generate each additional section in this format:

# [RESEARCH-BASED SECTION TITLE]

[300-500 word content specific to their project and industry]

# [RESEARCH-BASED SECTION TITLE]

[300-500 word content specific to their project and industry]

Continue for 2-4 additional sections total.

**VALIDATION CHECKLIST:**
- [ ] Did I research ${projectData.industryType} industry thoroughly?
- [ ] Are these sections specific to their project requirements?
- [ ] Do they complement, not duplicate, standard structure?
- [ ] Are they relevant to their industry and business model?
- [ ] Do they provide actionable value beyond standard content?
- [ ] Are they appropriate for their team's experience level?
- [ ] Do they address their specific timeline constraints?

Generate research-based content that provides unique value specific to ${projectData.companyName}'s ${projectData.projectName} project.${referenceContent}`;
  }
}
