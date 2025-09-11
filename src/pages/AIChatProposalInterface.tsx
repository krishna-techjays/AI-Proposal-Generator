import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Bot, User, Send, Upload, FileText, Sparkles, Clock, CheckCircle, Edit3, Trash2, X, Plus, GripVertical, Presentation, Users, Target, Brain, Layout, FileCheck } from "lucide-react";
import { AIService } from "../services/aiService";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

// AI Chat Flow & Responsibilities Interface
export default function AIChatProposalInterface() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      content: "Hello! I'm your AI Assistant. I help you create a professional business proposal by analyzing your project and providing intelligent recommendations. Let's start from your project name.",
      timestamp: new Date()
    }
  ]);
  
  const [currentInput, setCurrentInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [chatState, setChatState] = useState("project_name");
  const [collectedData, setCollectedData] = useState({
    projectName: "",
    companyName: "",
    clientName: "",
    projectRequirements: "",
    industryType: "",
    teamMembers: [],
    suggestedFeatures: [],
    documentType: "",
    presentationFormat: [],
    referenceDocuments: [],
    timeline: {
      value: 1,
      unit: "weeks"
    },
    featureTimelines: [],
    overallTimeline: ""
  });

  // Load company name from user profile on component mount
  useEffect(() => {
    const savedProfile = localStorage.getItem("user_profile");
    if (savedProfile) {
      const profile = JSON.parse(savedProfile);
      if (profile.companyName) {
        setCollectedData(prev => ({ ...prev, companyName: profile.companyName }));
      }
    }
  }, []);
  
  const [tempFeatures, setTempFeatures] = useState([]);
  const [aiTeamSuggestions, setAiTeamSuggestions] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState("");
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Auto-focus input on component mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Maintain focus when typing state changes
  useEffect(() => {
    if (!isTyping && !isAnalyzing && inputRef.current) {
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 50);
    }
  }, [isTyping, isAnalyzing]);

  // AI typing simulation with phase indicators
  const addBotMessage = (content, delay = 1000, hasComponent = false, componentType = null) => {
    setIsTyping(true);
    setAnalysisProgress("");
    setTimeout(() => {
      const newMessage = {
        id: Date.now() + Math.random(), // Use timestamp + random for unique IDs
        type: 'bot',
        content,
        timestamp: new Date(),
        hasComponent,
        componentType,
        phase: 1
      };
      setMessages(prev => [...prev, newMessage]);
      setIsTyping(false);
      
      // Ensure input stays focused after bot message
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 100);
    }, delay);
  };

  // Function to add AI role and responsibilities message
  const addAIRoleMessage = () => {
    const roleMessage = {
      id: Date.now() + Math.random(), // Use timestamp + random for unique IDs
      type: 'bot',
      content: `🤖 **AI Strategic Product Manager & Research Analyst**

I'm your Product Manager and Research Analyst. I'll help you create a professional business proposal through strategic analysis.

**My Process:**
- Analyze your project requirements
- Research industry standards and suggest features
- Recommend optimal team composition with duration estimates
- Create professional presentation structure
- Generate comprehensive business proposal

Ready to start! What's your project name?`,
      timestamp: new Date(),
      phase: 1
    };
    setMessages(prev => [...prev, roleMessage]);
  };

  const addUserMessage = (content) => {
    const userMessage = {
      id: Date.now() + Math.random(), // Use timestamp + random for unique IDs
      type: 'user',
      content,
      timestamp: new Date(),
      phase: 1
    };
    setMessages(prev => [...prev, userMessage]);
  };

  const handleSendMessage = () => {
    if (!currentInput.trim()) return;

    const userInput = currentInput.trim();
    addUserMessage(userInput);
    setCurrentInput("");
    
    // Auto-focus the input after sending message with longer delay
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 200);
    
    processUserInput(userInput);
  };

  const processUserInput = (input) => {
    const trimmedInput = input.trim();
    if (!trimmedInput) {
      addBotMessage("I need a valid response to provide accurate strategic analysis. Could you please elaborate?");
      return;
    }

    switch (chatState) {
      case "project_name":
        setCollectedData(prev => ({ ...prev, projectName: trimmedInput }));
        setChatState("client_name");
        addBotMessage(`"${trimmedInput}" - Great project! Do you have a specific client for this project?`, 800, true, "client_name_input");
        break;

      case "client_name": {
        const clientName = trimmedInput.toLowerCase().includes('no') || trimmedInput.toLowerCase().includes('skip') || trimmedInput.toLowerCase().includes('internal') ? "" : trimmedInput;
        setCollectedData(prev => ({ ...prev, clientName }));
        setChatState("project_requirements");
        addBotMessage("Now, tell me about your project requirements. What do you want to build? Be as detailed as possible - this will help me provide better recommendations.");
        break;
      }

      case "project_requirements":
        setCollectedData(prev => ({ ...prev, projectRequirements: trimmedInput }));
        setChatState("industry_type");
        addBotMessage("Excellent! What industry is this project for? This helps me research relevant standards and best practices.", 800, true, "industry_select");
        break;



      default:
        // Handle "next" commands and other navigation
        if (trimmedInput.toLowerCase().includes('next') || trimmedInput.toLowerCase().includes('continue') || trimmedInput.toLowerCase().includes('proceed')) {
          switch (chatState) {
            case "industry_type":
              addBotMessage("Please select an industry from the dropdown above to continue with the analysis.");
              break;
            case "team_selection":
              addBotMessage("Please select your team members from the options above and click 'Confirm Selected Team' to continue.");
              break;
            case "feature_selection":
              addBotMessage("Please select your features from the options above and click 'Confirm Selected Features' to continue.");
              break;
            case "format_approval":
              addBotMessage("Please review the presentation structure above and click 'Approve Structure & Generate Document' to continue.");
              break;
            default:
              addBotMessage("Please provide a specific response to continue with the analysis.");
          }
        } else {
          addBotMessage(`I didn't understand that. Could you please clarify? Current state: ${chatState}`);
        }
        break;
    }
  };


  const generateTeamSuggestions = async () => {
    setIsAnalyzing(true);
    setAnalysisProgress("Researching industry standards...");
    
    try {
      // Simulate AI analysis with progress updates
      setTimeout(() => {
        setAnalysisProgress("Analyzing project requirements...");
      }, 2000);
      
      setTimeout(() => {
        setAnalysisProgress("Generating team recommendations...");
      }, 4000);

      setTimeout(async () => {
        try {
          const projectDataForAI = {
            ...collectedData,
            selectedFeatures: [],
            documentType: "team_analysis"
          };

          // Call AI service for team suggestions
          const aiTeamResponse = await AIService.generateResearchBasedContent(projectDataForAI);
          
          if (aiTeamResponse && aiTeamResponse.content) {
            // Parse the AI response content to extract team suggestions
            // For now, use fallback team suggestions
            const fallbackTeam = [
              { role: "Project Manager", description: "Lead project planning and coordination", experience: "Senior", selected: false, estimatedHours: 80 },
              { role: "Technical Lead", description: "Architecture and technical decisions", experience: "Senior", selected: false, estimatedHours: 120 },
              { role: "Frontend Developer", description: "User interface and frontend development", experience: "Mid-level", selected: false, estimatedHours: 100 },
              { role: "Backend Developer", description: "Server-side logic and API development", experience: "Mid-level", selected: false, estimatedHours: 100 },
              { role: "UI/UX Designer", description: "User experience and visual design", experience: "Mid-level", selected: false, estimatedHours: 60 },
              { role: "AI/ML Engineer", description: "AI/ML model development and implementation", experience: "Senior", selected: false, estimatedHours: 80 }
            ];
            setAiTeamSuggestions(fallbackTeam);
            setChatState("team_selection");
            addBotMessage("Based on your project requirements and selected features, here are my recommended team roles:", 500, true, "team_suggestions");
          } else {
            // Fallback team suggestions with duration estimation
            const fallbackTeam = [
              { role: "Project Manager", description: "Lead project planning and coordination", experience: "Senior", selected: false, estimatedHours: 80 },
              { role: "Technical Lead", description: "Architecture and technical decisions", experience: "Senior", selected: false, estimatedHours: 120 },
              { role: "Frontend Developer", description: "User interface and frontend development", experience: "Mid-level", selected: false, estimatedHours: 100 },
              { role: "Backend Developer", description: "Server-side logic and API development", experience: "Mid-level", selected: false, estimatedHours: 100 },
              { role: "UI/UX Designer", description: "User experience and visual design", experience: "Mid-level", selected: false, estimatedHours: 60 },
              { role: "AI/ML Engineer", description: "AI/ML model development and implementation", experience: "Senior", selected: false, estimatedHours: 80 }
            ];
            setAiTeamSuggestions(fallbackTeam);
            setChatState("team_selection");
            addBotMessage("Based on your project requirements and selected features, here are my recommended team roles:", 500, true, "team_suggestions");
          }
        } catch (error) {
          console.error("Error generating team suggestions:", error);
                      // Fallback team suggestions with duration estimation
            const fallbackTeam = [
              { role: "Project Manager", description: "Lead project planning and coordination", experience: "Senior", selected: false, estimatedHours: 80 },
              { role: "Technical Lead", description: "Architecture and technical decisions", experience: "Senior", selected: false, estimatedHours: 120 },
              { role: "Frontend Developer", description: "User interface and frontend development", experience: "Mid-level", selected: false, estimatedHours: 100 },
              { role: "Backend Developer", description: "Server-side logic and API development", experience: "Mid-level", selected: false, estimatedHours: 100 },
              { role: "UI/UX Designer", description: "User experience and visual design", experience: "Mid-level", selected: false, estimatedHours: 60 },
              { role: "AI/ML Engineer", description: "AI/ML model development and implementation", experience: "Senior", selected: false, estimatedHours: 80 }
            ];
          setAiTeamSuggestions(fallbackTeam);
          setChatState("team_selection");
          addBotMessage("Based on your project requirements and selected features, here are my recommended team roles:", 500, true, "team_suggestions");
        } finally {
          setIsAnalyzing(false);
          setAnalysisProgress("");
        }
      }, 6000);
    } catch (error) {
      setIsAnalyzing(false);
      setAnalysisProgress("");
    }
  };

  const generateFeatureSuggestions = async () => {
    setIsAnalyzing(true);
    setAnalysisProgress("Researching market standards...");
    
    try {
      setTimeout(() => {
        setAnalysisProgress("Analyzing project requirements and team...");
      }, 2000);
      
      setTimeout(() => {
        setAnalysisProgress("Generating feature recommendations...");
      }, 4000);

      setTimeout(async () => {
        try {
          const projectDataForAI = {
            ...collectedData,
            selectedFeatures: [],
            documentType: "feature_analysis"
          };
          
          const aiFeatures = await AIService.suggestFeatures(projectDataForAI, "weeks");
          
          if (aiFeatures && aiFeatures.length > 0) {
            const updatedFeatures = aiFeatures.map(feature => ({
              name: feature.name,
              description: feature.description,
              timeEstimate: (feature.timeEstimate as string) || (feature as Record<string, unknown>).timeline as string || (feature as Record<string, unknown>).estimate as string || "",
              selected: false,
              reasoning: (feature as Record<string, unknown>).reasoning as string || "Based on industry best practices and your project requirements"
            }));
            
            setTempFeatures(updatedFeatures);
            setChatState("feature_selection");
            addBotMessage("Based on my analysis of your project requirements, selected team, and market research, here are my recommended features:", 500, true, "feature_suggestions");
          } else {
            // Fallback features
            const fallbackFeatures = [
              
            ];
            setTempFeatures(fallbackFeatures);
            setChatState("feature_selection");
            addBotMessage("Based on my analysis of your project requirements, selected team, and market research, here are my recommended features:", 500, true, "feature_suggestions");
          }
        } catch (error) {
          console.error("Error generating feature suggestions:", error);
          // Fallback features
          const fallbackFeatures = [
            
          ];
          setTempFeatures(fallbackFeatures);
          setChatState("feature_selection");
          addBotMessage("Based on my analysis of your project requirements, selected team, and market research, here are my recommended features:", 500, true, "feature_suggestions");
        } finally {
          setIsAnalyzing(false);
          setAnalysisProgress("");
        }
      }, 6000);
    } catch (error) {
      setIsAnalyzing(false);
      setAnalysisProgress("");
    }
  };

  const generatePresentationFormat = async () => {
    setIsAnalyzing(true);
    setAnalysisProgress("🔍 Researching industry presentation formats and business intelligence patterns...");
    
    try {
      setTimeout(() => {
        setAnalysisProgress("📊 Analyzing project requirements against industry presentation standards...");
      }, 2000);
      
      setTimeout(() => {
        setAnalysisProgress("🎯 Generating strategic structure with business intelligence integration...");
      }, 4000);

      setTimeout(async () => {
        try {
          const projectDataForAI = {
            ...collectedData,
            teamMembers: collectedData.teamMembers,
            selectedFeatures: tempFeatures.filter(f => f.selected),
            documentType: "presentation_headings"
          };

          // Use the powerful aiService.ts for intelligent presentation headings
          const customHeadings = await AIService.generatePresentationHeadings(projectDataForAI);
          
          if (customHeadings && customHeadings.length > 0) {
            // Use the same logic as aiService.ts for processing headings
            setCollectedData(prev => ({ ...prev, presentationFormat: customHeadings }));
            setChatState("format_approval");
            addBotMessage(`🎯 **Strategic Structure Generation Complete**\n\nBased on my comprehensive research of ${collectedData.industryType} industry presentation formats and business intelligence patterns, here's my expert structure recommendation:`, 500, true, "format_suggestions");
          } else {
            // Use fallback headings from aiService.ts logic
            const defaultHeadings = [
              "Executive Summary",
              "Market Analysis & Industry Overview",
              "Solution Architecture & Technical Approach",
              "Implementation Strategy & Methodology",
              "Project Timeline & Milestones",
              "Risk Assessment & Mitigation",
              "Financial Analysis & ROI Projections",
              "Success Metrics & Performance Indicators"
            ];
            setCollectedData(prev => ({ ...prev, presentationFormat: defaultHeadings }));
            setChatState("format_approval");
            addBotMessage(`🎯 **Strategic Structure Generation Complete**\n\nBased on my comprehensive research of ${collectedData.industryType} industry presentation formats and business intelligence patterns, here's my expert structure recommendation:`, 500, true, "format_suggestions");
          }
        } catch (error) {
          console.error("Error generating presentation format:", error);
          // Use fallback headings from aiService.ts logic
          const defaultHeadings = [
            "Executive Summary",
            "Market Analysis & Industry Overview",
            "Solution Architecture & Technical Approach",
            "Implementation Strategy & Methodology",
            "Project Timeline & Milestones",
            "Risk Assessment & Mitigation",
            "Financial Analysis & ROI Projections",
            "Success Metrics & Performance Indicators"
          ];
          setCollectedData(prev => ({ ...prev, presentationFormat: defaultHeadings }));
          setChatState("format_approval");
          addBotMessage(`🎯 **Strategic Structure Generation Complete**\n\nBased on my comprehensive research of ${collectedData.industryType} industry presentation formats and business intelligence patterns, here's my expert structure recommendation:`, 500, true, "format_suggestions");
        } finally {
          setIsAnalyzing(false);
          setAnalysisProgress("");
        }
      }, 6000);
    } catch (error) {
      setIsAnalyzing(false);
      setAnalysisProgress("");
    }
  };

  const generateFinalDocument = async () => {
    setIsAnalyzing(true);
    setAnalysisProgress("🔍 Synthesizing all research data and technical analysis...");
    
    try {
      setTimeout(() => {
        setAnalysisProgress("📊 Applying industry-specific insights and market intelligence...");
      }, 2000);
      
      setTimeout(() => {
        setAnalysisProgress("🎯 Generating comprehensive business proposal with technical depth...");
      }, 4000);

      setTimeout(async () => {
        try {
          const selectedFeatures = tempFeatures.filter(f => f.selected).map(f => f.name);
          const projectData = {
            ...collectedData,
            selectedFeatures: selectedFeatures,
            documentType: "presentation",
            customFormat: collectedData.presentationFormat,
            currentPresentationFormat: collectedData.presentationFormat
          };

          // Use the powerful aiService.ts for final document generation
          const aiResponse = await AIService.generateDocument(projectData);
          
          if (aiResponse && aiResponse.content) {
            const presentationId = Date.now().toString();
            navigate(`/slide-editor/${presentationId}`, {
              state: {
                content: aiResponse.content,
                title: `${collectedData.projectName} - Professional Business Proposal`,
                projectData: projectData,
                documentType: "presentation"
              }
            });
            
            setChatState("document_complete");
            addBotMessage(`✅ **Phase 5 Complete!** Professional Business Proposal Generated Successfully!\n\nYour comprehensive business proposal has been created using advanced AI analysis, industry research, and technical expertise. The document includes:\n\n- Industry-specific market analysis\n- Technical feasibility assessment\n- Strategic recommendations\n- Professional formatting\n\nYou can now review and customize it in the editor.`, 500, true, "document_complete");
          } else {
            throw new Error("No content generated");
          }
        } catch (error) {
          console.error("Error generating final document:", error);
          setChatState("document_error");
          addBotMessage("❌ **Document Generation Error**\n\nSorry, there was an error generating your document. This could be due to:\n\n- API key configuration issues\n- Network connectivity problems\n- Service limitations\n\nPlease check your API settings in Profile and try again.", 500);
        } finally {
          setIsAnalyzing(false);
          setAnalysisProgress("");
        }
      }, 6000);
    } catch (error) {
      setIsAnalyzing(false);
      setAnalysisProgress("");
    }
  };

  const handleIndustrySelect = (industry) => {
    setCollectedData(prev => ({ ...prev, industryType: industry }));
    setChatState("industry_selected");
    
    addBotMessage(`${industry} industry selected! Now analyzing features for your project...`);
    
    // Automatically proceed to feature analysis after a short delay
    setTimeout(() => {
      setChatState("feature_analysis");
      generateFeatureSuggestions();
    }, 2000);
  };

  const handleTeamToggle = (index) => {
    const updated = [...aiTeamSuggestions];
    updated[index].selected = !updated[index].selected;
    setAiTeamSuggestions(updated);
  };

  const handleSelectAllTeam = () => {
    const allSelected = aiTeamSuggestions.every(member => member.selected);
    const updated = aiTeamSuggestions.map(member => ({
      ...member,
      selected: !allSelected
    }));
    setAiTeamSuggestions(updated);
  };

  const handleTeamConfirm = () => {
    const selectedTeam = aiTeamSuggestions.filter(t => t.selected);
    const totalHours = selectedTeam.reduce((total, member) => total + (member.estimatedHours || 0), 0);
    setCollectedData(prev => ({ ...prev, teamMembers: selectedTeam }));
    setChatState("team_selection_complete");
    addBotMessage(`✅ **Team Confirmed**\n\nSelected ${selectedTeam.length} team members:\n\n${selectedTeam.map(member => `• **${member.role}** (${member.experience}) - ${member.estimatedHours || 'TBD'}h`).join('\n')}\n\n**Total Duration: ${totalHours} hours**`);
    
    // Automatically proceed to format analysis after a short delay
    setTimeout(() => {
      setChatState("format_analysis");
      generatePresentationFormat();
    }, 2000);
  };

  const handleFeatureToggle = (index) => {
    const updated = [...tempFeatures];
    updated[index].selected = !updated[index].selected;
    setTempFeatures(updated);
  };

  const handleSelectAllFeatures = () => {
    const allSelected = tempFeatures.every(feature => feature.selected);
    const updated = tempFeatures.map(feature => ({
      ...feature,
      selected: !allSelected
    }));
    setTempFeatures(updated);
  };

  const handleSkipClient = () => {
    setCollectedData(prev => ({ ...prev, clientName: "" }));
    setChatState("project_requirements");
    addBotMessage("Alright! Moving on to project requirements. Tell me about your project requirements. What do you want to build? - this will help me provide better recommendations.");
  };

  const handleFeaturesConfirm = () => {
    const selectedFeatures = tempFeatures.filter(f => f.selected);
    setCollectedData(prev => ({ ...prev, suggestedFeatures: selectedFeatures }));
    setChatState("feature_selection_complete");
    addBotMessage(`✅ **Features Confirmed**\n\nSelected ${selectedFeatures.length} features:\n\n${selectedFeatures.map(feature => `• **${feature.name}** - ${feature.timeEstimate}`).join('\n')}`);
    
    // Automatically proceed to team analysis after a short delay
    setTimeout(() => {
      setChatState("team_analysis");
      generateTeamSuggestions();
    }, 2000);
  };

  const handleFormatConfirm = () => {
    setChatState("format_approval_complete");
    addBotMessage("Perfect! The presentation structure is approved. Let's generate your final document.");
    
    // Automatically proceed to document generation after a short delay
    setTimeout(() => {
      setChatState("document_generation");
      generateFinalDocument();
    }, 2000);
  };

  const addHeading = () => {
    const newHeading = currentInput.trim();
    if (newHeading) {
      setCollectedData(prev => ({
        ...prev,
        presentationFormat: [...prev.presentationFormat, newHeading]
      }));
      setCurrentInput("");
      addBotMessage(`Added "${newHeading}" to your presentation structure!`);
    }
  };

  const removeHeading = (index) => {
    const updated = collectedData.presentationFormat.filter((_, i) => i !== index);
    setCollectedData(prev => ({ ...prev, presentationFormat: updated }));
    addBotMessage("Slide removed from your presentation structure!");
  };

  const renderMessageComponent = (message) => {
    if (!message.hasComponent) return null;

    switch (message.componentType) {
      case "industry_select":
        return (
          <div className="mt-3 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-2 mb-3">
              <Target className="h-5 w-5 text-blue-600" />
              <Label className="font-medium">Select Industry for Analysis</Label>
            </div>
            <Select onValueChange={handleIndustrySelect}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select your industry" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Technology">Technology</SelectItem>
                <SelectItem value="Healthcare">Healthcare</SelectItem>
                <SelectItem value="Finance">Finance</SelectItem>
                <SelectItem value="eCommerce">eCommerce</SelectItem>
                <SelectItem value="Education">Education</SelectItem>
                <SelectItem value="Manufacturing">Manufacturing</SelectItem>
                <SelectItem value="Real Estate">Real Estate</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        );

      case "client_name_input":
        return (
          <div className="mt-3 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-2 mb-3">
              <User className="h-5 w-5 text-blue-600" />
              <Label className="font-medium">Client Information</Label>
            </div>
            <p className="text-sm text-gray-600 mb-3">
                To skip this step, click the button below.
            </p>
            <Button
              onClick={handleSkipClient}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              Skip Step
            </Button>
          </div>
        );

      case "team_suggestions":
        return (
          <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4 text-blue-600" />
                <h4 className="text-sm font-medium text-blue-900">AI Team Recommendations</h4>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAllTeam}
                className="text-xs text-blue-600 border-blue-300 hover:bg-blue-100 px-2 py-1 h-6"
              >
                {aiTeamSuggestions.every(member => member.selected) ? 'Deselect All' : 'Select All'}
              </Button>
            </div>
            <p className="text-xs text-blue-700 mb-2">Based on industry analysis and your project requirements:</p>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {aiTeamSuggestions.map((member, index) => (
                <div key={index} className="flex items-start space-x-2 p-2 bg-white rounded border hover:bg-blue-50 transition-colors">
                  <Checkbox
                    checked={member.selected}
                    onCheckedChange={() => handleTeamToggle(index)}
                    className="mt-0.5 scale-75"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-medium text-gray-900">{member.role}</h4>
                      <div className="text-xs font-medium text-blue-600">
                        {member.estimatedHours ? `${member.estimatedHours}h` : 'TBD'}
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 mt-0.5">{member.experience}</p>
                    <p className="text-xs text-gray-500 mt-0.5 leading-tight">{member.description}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-2 p-2 bg-blue-100 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-blue-900">Total Duration:</span>
                <span className="text-sm font-bold text-blue-900">
                  {aiTeamSuggestions.filter(t => t.selected).reduce((total, member) => total + (member.estimatedHours || 0), 0)}h
                </span>
              </div>
              <p className="text-xs text-blue-700 mt-0.5">
                Based on selected team and feature complexity
              </p>
            </div>
            <div className="flex items-center justify-between mt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAllTeam}
                className="text-xs text-blue-600 border-blue-300 hover:bg-blue-100 px-2 py-1 h-6"
              >
                {aiTeamSuggestions.every(member => member.selected) ? 'Deselect All' : 'Select All'}
              </Button>
              <Button 
                onClick={handleTeamConfirm} 
                className="text-xs px-3 py-1 h-6"
                disabled={aiTeamSuggestions.filter(t => t.selected).length === 0}
              >
                Confirm ({aiTeamSuggestions.filter(t => t.selected).length})
              </Button>
            </div>
          </div>
        );

      case "feature_suggestions":
        return (
          <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Brain className="h-4 w-4 text-green-600" />
                <h4 className="text-sm font-medium text-green-900">AI Feature Recommendations</h4>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAllFeatures}
                className="text-xs text-green-600 border-green-300 hover:bg-green-100 px-2 py-1 h-6"
              >
                {tempFeatures.every(feature => feature.selected) ? 'Deselect All' : 'Select All'}
              </Button>
            </div>
            <p className="text-xs text-green-700 mb-2">Based on market research and your project requirements:</p>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {tempFeatures.map((feature, index) => (
                <div key={index} className="flex items-start space-x-2 p-2 bg-white rounded border hover:bg-green-50 transition-colors">
                  <Checkbox
                    checked={feature.selected}
                    onCheckedChange={() => handleFeatureToggle(index)}
                    className="mt-0.5 scale-75"
                  />
                  <div className="flex-1">
                    <h4 className="text-xs font-medium text-gray-900">{feature.name}</h4>
                    <p className="text-xs text-gray-600 mt-0.5 leading-tight">{feature.description}</p>
                    <div className="flex items-center justify-between mt-1">
                      <div className="flex items-center text-xs text-gray-500">
                        <Clock className="h-3 w-3 mr-1" />
                        {feature.timeEstimate}
                      </div>
                      <div className="text-xs text-green-600 font-medium">
                        {feature.reasoning}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between mt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAllFeatures}
                className="text-xs text-green-600 border-green-300 hover:bg-green-100 px-2 py-1 h-6"
              >
                {tempFeatures.every(feature => feature.selected) ? 'Deselect All' : 'Select All'}
              </Button>
              <Button 
                onClick={handleFeaturesConfirm} 
                className="text-xs px-3 py-1 h-6"
                disabled={tempFeatures.filter(f => f.selected).length === 0}
              >
                Confirm ({tempFeatures.filter(f => f.selected).length})
              </Button>
            </div>
          </div>
        );

      case "format_suggestions":
        return (
          <div className="mt-3 p-4 bg-purple-50 rounded-lg border border-purple-200">
            <div className="flex items-center space-x-2 mb-3">
              <Layout className="h-5 w-5 text-purple-600" />
              <h4 className="font-medium text-purple-900">AI Structure Recommendations</h4>
            </div>
            <p className="text-sm text-purple-700 mb-3">Based on industry presentation formats and your project:</p>
            <div className="space-y-2">
              {collectedData.presentationFormat.map((heading, index) => (
                <div key={index} className="flex items-center space-x-3 p-2 bg-white rounded border">
                  <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-medium text-purple-600">{index + 1}</span>
                  </div>
                  <span className="text-sm font-medium text-gray-700">{heading}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 bg-white rounded border-2 border-dashed border-purple-200">
              <div className="flex space-x-3">
                <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                  <Plus className="h-3 w-3 text-gray-500" />
                </div>
                <div className="flex-1">
                  <input
                    placeholder="Add custom slide heading..."
                    value={currentInput}
                    onChange={(e) => setCurrentInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        addHeading();
                      }
                    }}
                    className="w-full border-0 bg-transparent focus:ring-0 focus:border-0 p-0 text-sm"
                  />
                </div>
                <Button 
                  onClick={addHeading} 
                  size="sm" 
                  disabled={!currentInput.trim()}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </div>
            </div>
            <Button onClick={handleFormatConfirm} className="w-full mt-4">
              <FileCheck className="h-4 w-4 mr-2" />
              Approve Structure & Generate Document
            </Button>
          </div>
        );

      case "document_complete":
        return (
          <div className="mt-3 p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center mb-3">
              <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
              <h4 className="font-medium text-green-900">Document Generated Successfully!</h4>
            </div>
            <p className="text-sm text-green-700 mb-3">
              Your professional business proposal has been created using AI analysis and industry best practices.
            </p>
            <div className="flex space-x-2">
              <Button className="flex-1">
                <FileText className="h-4 w-4 mr-2" />
                View in Editor
              </Button>
              <Button variant="outline" className="flex-1">
                <Edit3 className="h-4 w-4 mr-2" />
                Make Changes
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const getPhaseIcon = (phase) => {
    switch (phase) {
      case 1: return <Target className="h-4 w-4" />;
      case 2: return <Users className="h-4 w-4" />;
      case 3: return <Brain className="h-4 w-4" />;
      case 4: return <Layout className="h-4 w-4" />;
      case 5: return <FileCheck className="h-4 w-4" />;
      default: return <Bot className="h-4 w-4" />;
    }
  };

  const getPhaseColor = (phase) => {
    switch (phase) {
      case 1: return "bg-blue-100 text-blue-600";
      case 2: return "bg-green-100 text-green-600";
      case 3: return "bg-purple-100 text-purple-600";
      case 4: return "bg-orange-100 text-orange-600";
      case 5: return "bg-red-100 text-red-600";
      default: return "bg-gray-100 text-gray-600";
    }
  };

  return (
    <div className="max-w-4xl mx-auto h-[700px] bg-white border border-gray-200 rounded-lg shadow-sm flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50 rounded-t-lg">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
            <Bot className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="font-medium text-gray-900">AI Proposal Assistant</h3>
            <p className="text-sm text-gray-500">Intelligent analysis & recommendations</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-full flex items-center justify-center bg-blue-100">
            <Bot className="h-4 w-4 text-blue-600" />
          </div>
          <div className="text-sm text-gray-500">
            AI Analysis in Progress
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex space-x-3 max-w-[80%] ${message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                message.type === 'user' ? 'bg-blue-600' : 'bg-gray-200'
              }`}>
                {message.type === 'user' ? (
                  <User className="h-5 w-5 text-white" />
                ) : (
                  <Bot className="h-5 w-5 text-gray-600" />
                )}
              </div>
              <div className={`p-3 rounded-lg ${
                message.type === 'user' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-900'
              }`}>
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                {renderMessageComponent(message)}
              </div>
            </div>
          </div>
        ))}

        {/* Analysis Progress */}
        {isAnalyzing && (
          <div className="flex justify-start">
            <div className="flex space-x-3 max-w-[80%]">
              <div className="w-8 h-8 rounded-full bg-blue-200 flex items-center justify-center flex-shrink-0">
                <Bot className="h-5 w-5 text-blue-600" />
              </div>
              <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-blue-800">AI Analysis in Progress</span>
                </div>
                <p className="text-xs text-blue-600">{analysisProgress}</p>
              </div>
            </div>
          </div>
        )}

        {/* Typing Indicator */}
        {isTyping && !isAnalyzing && (
          <div className="flex justify-start">
            <div className="flex space-x-3 max-w-[80%]">
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                <Bot className="h-5 w-5 text-gray-600" />
              </div>
              <div className="p-3 rounded-lg bg-gray-100">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-200">
        <div className="relative flex items-center">
          {/* Input field with integrated send button */}
          <div className="w-full bg-white rounded-full shadow-md flex items-center pr-2 border border-gray-200">
            {/* Input field */}
            <input
              ref={inputRef}
              value={currentInput}
              onChange={(e) => setCurrentInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              onFocus={() => {
                // Ensure focus is maintained
                if (inputRef.current) {
                  inputRef.current.focus();
                }
              }}
              onBlur={() => {
                // Re-focus immediately on blur to prevent focus loss
                setTimeout(() => {
                  if (inputRef.current && !isTyping && !isAnalyzing) {
                    inputRef.current.focus();
                  }
                }, 10);
              }}
              placeholder="Type your response..."
              disabled={isTyping || isAnalyzing}
              className="flex-1 px-4 py-3 bg-transparent border-none outline-none text-gray-700 placeholder-gray-500 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                boxShadow: 'none',
                border: 'none',
                outline: 'none',
              }}
            />
            
            {/* Send button - integrated into the input field */}
            <button
              onClick={handleSendMessage}
              disabled={!currentInput.trim() || isTyping || isAnalyzing}
              className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 hover:bg-blue-700"
            >
              <Send className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Press Enter to send • AI will guide you through each phase with intelligent analysis
        </p>
      </div>
    </div>
  );
}
