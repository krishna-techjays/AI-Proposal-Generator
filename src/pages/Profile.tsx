
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Save, Key, Bot, ExternalLink, Edit, X, Check, LogOut } from "lucide-react";

export default function Profile() {
  const navigate = useNavigate();
  const [apiKey, setApiKey] = useState("");
  const [selectedModel, setSelectedModel] = useState("gpt-3.5-turbo");
  const [selectedProvider, setSelectedProvider] = useState("openai");
  const [isLoading, setIsLoading] = useState(false);
  
  // User profile state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [userProfile, setUserProfile] = useState({
    name: "Jhon Defano",
    email: "jhon.fany@gmail.com"
  });
  const [tempProfile, setTempProfile] = useState({
    name: "Jhon Defano",
    email: "jhon.fany@gmail.com"
  });

  useEffect(() => {
    // Load saved API key, model, and provider from localStorage
    const savedApiKey = localStorage.getItem("ai_api_key");
    const savedModel = localStorage.getItem("ai_model");
    const savedProvider = localStorage.getItem("ai_provider");
    if (savedApiKey) setApiKey(savedApiKey);
    if (savedModel) setSelectedModel(savedModel);
    if (savedProvider) setSelectedProvider(savedProvider);
    
    // Load saved user profile from localStorage
    const savedProfile = localStorage.getItem("user_profile");
    if (savedProfile) {
      const profile = JSON.parse(savedProfile);
      setUserProfile(profile);
      setTempProfile(profile);
    }
  }, []);

  const handleEditProfile = () => {
    setIsEditingProfile(true);
    setTempProfile(userProfile);
  };

  const handleCancelEdit = () => {
    setIsEditingProfile(false);
    setTempProfile(userProfile);
  };

  const handleSaveProfile = () => {
    if (!tempProfile.name.trim() || !tempProfile.email.trim()) {
      toast.error("Please fill in all fields");
      return;
    }
    
    setUserProfile(tempProfile);
    localStorage.setItem("user_profile", JSON.stringify(tempProfile));
    setIsEditingProfile(false);
    toast.success("Profile updated successfully!");
  };

  const handleLogout = () => {
    // Clear authentication data
    localStorage.removeItem("is_authenticated");
    localStorage.removeItem("user_profile");
    
    // Show success message
    toast.success("Logged out successfully");
    
    // Redirect to home page
    navigate("/");
  };

  const aiProviders = {
    openai: {
      name: "OpenAI",
      models: [
        { value: "gpt-3.5-turbo", name: "GPT-3.5 Turbo" },
        { value: "gpt-4", name: "GPT-4" },
        { value: "gpt-4-turbo", name: "GPT-4 Turbo" }
      ],
      apiUrl: "https://api.openai.com/v1/chat/completions",
      getApiKeyUrl: "https://platform.openai.com/api-keys",
      free: false
    },
    huggingface: {
      name: "Hugging Face",
      models: [
        { value: "microsoft/DialoGPT-medium", name: "DialoGPT Medium" },
        { value: "microsoft/DialoGPT-large", name: "DialoGPT Large" },
        { value: "facebook/blenderbot-400M-distill", name: "BlenderBot 400M" },
        { value: "microsoft/GODEL-v1_1-base-seq2seq", name: "GODEL Base" }
      ],
      apiUrl: "https://api-inference.huggingface.co/models/",
      getApiKeyUrl: "https://huggingface.co/settings/tokens",
      free: true
    },
    groq: {
      name: "Groq",
      models: [
        { value: "llama3-8b-8192", name: "Llama 3 8B" },
        { value: "llama3-70b-8192", name: "Llama 3 70B" },
        { value: "mixtral-8x7b-32768", name: "Mixtral 8x7B" },
        { value: "gemma-7b-it", name: "Gemma 7B" }
      ],
      apiUrl: "https://api.groq.com/openai/v1/chat/completions",
      getApiKeyUrl: "https://console.groq.com/keys",
      free: true
    },
    anthropic: {
      name: "Anthropic Claude",
      models: [
        { value: "claude-3-sonnet", name: "Claude 3 Sonnet" },
        { value: "claude-3-opus", name: "Claude 3 Opus" },
        { value: "claude-3-haiku", name: "Claude 3 Haiku" }
      ],
      apiUrl: "https://api.anthropic.com/v1/messages",
      getApiKeyUrl: "https://console.anthropic.com/",
      free: false
    },
    cohere: {
      name: "Cohere",
      models: [
        { value: "command", name: "Command" },
        { value: "command-light", name: "Command Light" },
        { value: "command-nightly", name: "Command Nightly" }
      ],
      apiUrl: "https://api.cohere.ai/v1/generate",
      getApiKeyUrl: "https://dashboard.cohere.ai/api-keys",
      free: true
    }
  };

  const handleSaveSettings = () => {
    if (!apiKey.trim()) {
      toast.error("Please enter an API key");
      return;
    }

    setIsLoading(true);
    
    // Save to localStorage
    localStorage.setItem("ai_api_key", apiKey);
    localStorage.setItem("ai_model", selectedModel);
    localStorage.setItem("ai_provider", selectedProvider);
    
    setTimeout(() => {
      setIsLoading(false);
      toast.success("AI settings saved successfully!");
    }, 1000);
  };

  const testConnection = async () => {
    if (!apiKey.trim()) {
      toast.error("Please enter an API key first");
      return;
    }

    setIsLoading(true);
    
    try {
      const provider = aiProviders[selectedProvider as keyof typeof aiProviders];
      let response;

      if (selectedProvider === "openai" || selectedProvider === "groq") {
        response = await fetch(provider.apiUrl, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: selectedModel,
            messages: [{ role: "user", content: "Test connection" }],
            max_tokens: 10
          }),
        });
      } else if (selectedProvider === "huggingface") {
        response = await fetch(`${provider.apiUrl}${selectedModel}`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            inputs: "Test connection"
          }),
        });
      } else if (selectedProvider === "anthropic") {
        response = await fetch(provider.apiUrl, {
          method: "POST",
          headers: {
            "x-api-key": apiKey,
            "Content-Type": "application/json",
            "anthropic-version": "2023-06-01"
          },
          body: JSON.stringify({
            model: selectedModel,
            max_tokens: 10,
            messages: [{ role: "user", content: "Test connection" }]
          }),
        });
      } else if (selectedProvider === "cohere") {
        response = await fetch(provider.apiUrl, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: selectedModel,
            prompt: "Test connection",
            max_tokens: 10
          }),
        });
      }

      if (response && response.ok) {
        toast.success("API connection successful!");
      } else {
        toast.error("Invalid API key or connection failed");
      }
    } catch (error) {
      toast.error("Failed to test connection");
    } finally {
      setIsLoading(false);
    }
  };

  const currentProvider = aiProviders[selectedProvider as keyof typeof aiProviders];

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
        <p className="text-gray-600 mt-2">Manage your AI model settings and API configuration</p>
      </div>

      <div className="grid gap-6">
        {/* User Profile Section */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <div className="w-10 h-10 bg-gray-400 rounded-full flex items-center justify-center text-white font-semibold">
                  {userProfile.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                </div>
                User Profile
              </CardTitle>
              <CardDescription>Your account information</CardDescription>
            </div>
            {!isEditingProfile ? (
              <Button
                variant="outline"
                size="sm"
                onClick={handleEditProfile}
                className="flex items-center gap-2"
              >
                <Edit className="h-4 w-4" />
                Edit
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancelEdit}
                  className="flex items-center gap-2"
                >
                  <X className="h-4 w-4" />
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSaveProfile}
                  className="flex items-center gap-2"
                >
                  <Check className="h-4 w-4" />
                  Save
                </Button>
              </div>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input 
                  id="name" 
                  value={isEditingProfile ? tempProfile.name : userProfile.name}
                  onChange={(e) => isEditingProfile && setTempProfile({...tempProfile, name: e.target.value})}
                  disabled={!isEditingProfile}
                  className={isEditingProfile ? "bg-white" : "bg-gray-50"}
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  value={isEditingProfile ? tempProfile.email : userProfile.email}
                  onChange={(e) => isEditingProfile && setTempProfile({...tempProfile, email: e.target.value})}
                  disabled={!isEditingProfile}
                  className={isEditingProfile ? "bg-white" : "bg-gray-50"}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* AI Model Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              AI Model Configuration
            </CardTitle>
            <CardDescription>
              Configure your AI model settings for document generation. Many providers offer free tiers!
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="provider-select">AI Provider</Label>
              <Select value={selectedProvider} onValueChange={setSelectedProvider}>
                <SelectTrigger>
                  <SelectValue placeholder="Select AI provider" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(aiProviders).map(([key, provider]) => (
                    <SelectItem key={key} value={key}>
                      {provider.name} {provider.free && "🆓"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {currentProvider && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span>{currentProvider.free ? "🆓 Free tier available" : "💰 Paid service"}</span>
                  <a 
                    href={currentProvider.getApiKeyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-blue-600 hover:text-blue-800"
                  >
                    Get API Key <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="model-select">AI Model</Label>
              <Select value={selectedModel} onValueChange={setSelectedModel}>
                <SelectTrigger>
                  <SelectValue placeholder="Select AI model" />
                </SelectTrigger>
                <SelectContent>
                  {currentProvider?.models.map((model) => (
                    <SelectItem key={model.value} value={model.value}>
                      {model.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="api-key" className="flex items-center gap-2">
                <Key className="h-4 w-4" />
                API Key
              </Label>
              <Input
                id="api-key"
                type="password"
                placeholder={`Enter your ${currentProvider?.name} API key`}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="font-mono"
              />
              <p className="text-sm text-gray-500">
                Your API key is stored locally and used to generate AI-powered documents
              </p>
            </div>

            <div className="flex gap-3">
              <Button 
                onClick={handleSaveSettings} 
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                {isLoading ? "Saving..." : "Save Settings"}
              </Button>
              <Button 
                variant="outline" 
                onClick={testConnection} 
                disabled={isLoading || !apiKey.trim()}
              >
                Test Connection
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Free AI Providers Info */}
        <Card>
          <CardHeader>
            <CardTitle>Free AI Providers</CardTitle>
            <CardDescription>Take advantage of these free AI services</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold text-green-600">🆓 Hugging Face</h4>
                  <p className="text-gray-600 mt-1">Free inference API with various open-source models</p>
                  <p className="text-xs text-gray-500 mt-2">Rate limited but completely free</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold text-green-600">🆓 Groq</h4>
                  <p className="text-gray-600 mt-1">Ultra-fast inference with free tier</p>
                  <p className="text-xs text-gray-500 mt-2">Fast Llama and Mixtral models</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold text-green-600">🆓 Cohere</h4>
                  <p className="text-gray-600 mt-1">Free tier for text generation</p>
                  <p className="text-xs text-gray-500 mt-2">Good for document generation</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold text-blue-600">💰 OpenAI</h4>
                  <p className="text-gray-600 mt-1">Most powerful models (paid)</p>
                  <p className="text-xs text-gray-500 mt-2">$5 free credit for new users</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Usage Guidelines */}
        <Card>
          <CardHeader>
            <CardTitle>AI Proposal Generator</CardTitle>
            <CardDescription>How the AI uses your project data</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm text-gray-600">
              <p>• The AI analyzes your project requirements and team information</p>
              <p>• Generates customized documents based on industry type and features</p>
              <p>• Creates project timelines and milestone suggestions</p>
              <p>• Provides feature recommendations based on your inputs</p>
              <p>• All data processing happens securely using your API key</p>
              <p>• Start with free providers like Hugging Face or Groq to test the functionality</p>
            </div>
          </CardContent>
        </Card>

        {/* Logout Section */}
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800">Account Actions</CardTitle>
            <CardDescription className="text-red-600">
              Manage your account and logout
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <Button
                variant="destructive"
                onClick={handleLogout}
                className="flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
