
import { Plus, Upload, FileText, Search, Bell, Grid3X3, List, MoreHorizontal, Palette, BarChart3, Briefcase, Rocket, Music, FileCheck, Brain, Zap, Target, Clock, Shield, TrendingUp, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

const Index = () => {
  const navigate = useNavigate();
  const [savedProjects, setSavedProjects] = useState([]);

  useEffect(() => {
    // Load saved projects from localStorage
    const projects = JSON.parse(localStorage.getItem("savedProjects") || "[]");
    setSavedProjects(projects);
  }, []);

  const defaultPresentations = [
    {
      id: 1,
      title: "Branding for new product",
      workspace: "Workspace",
      updated: "1 week ago",
      author: "GR",
      icon: Palette,
      color: "bg-purple-100",
      iconColor: "text-purple-600",
      type: "template"
    },
    {
      id: 2,
      title: "Tasko - Mobile presentation",
      workspace: "Workspace",
      updated: "2 mins ago",
      author: "TD",
      icon: BarChart3,
      color: "bg-blue-100",
      iconColor: "text-blue-600",
      type: "template"
    },
    {
      id: 3,
      title: "New Pitch Deck for Sales",
      workspace: "Workspace",
      updated: "10 mins ago",
      author: "JG",
      icon: Briefcase,
      color: "bg-orange-100",
      iconColor: "text-orange-600",
      type: "template"
    },
    {
      id: 4,
      title: "Social Media Report Dec 2023",
      workspace: "Workspace",
      updated: "1 day ago",
      author: "SM",
      icon: BarChart3,
      color: "bg-green-100",
      iconColor: "text-green-600",
      type: "template"
    },
    {
      id: 5,
      title: "Marketing Campaign Deck",
      workspace: "Workspace",
      updated: "2 days ago",
      author: "NR",
      icon: Rocket,
      color: "bg-red-100",
      iconColor: "text-red-600",
      type: "template"
    },
    {
      id: 6,
      title: "Music - New Monthly Insight",
      workspace: "Workspace",
      updated: "10 days ago",
      author: "MI",
      icon: Music,
      color: "bg-indigo-100",
      iconColor: "text-indigo-600",
      type: "template"
    }
  ];

  // Transform saved projects for display
  const userWorks = savedProjects.map(project => ({
    id: `saved-${project.id}`,
    title: project.title,
    workspace: "Your Projects",
    updated: getTimeAgo(new Date(project.lastModified || project.createdAt)),
    author: project.author || "You",
    icon: FileCheck,
    color: "bg-emerald-100",
    iconColor: "text-emerald-600",
    type: "saved",
    content: project.content,
    createdAt: project.lastModified || project.createdAt,
    originalType: project.type // Store the original project type
  }));

  // Sort user works by creation date (most recent first)
  const sortedUserWorks = userWorks.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  function getTimeAgo(date: Date): string {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} min ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hour ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} day ago`;
    return `${Math.floor(diffInSeconds / 2592000)} month ago`;
  }

  const handleProjectClick = (presentation) => {
    if (presentation.type === "saved") {
      // Get the original saved project data to check its actual type
      const savedProjects = JSON.parse(localStorage.getItem("savedProjects") || "[]");
      const originalProject = savedProjects.find(p => p.id === presentation.id.replace('saved-', ''));
      
      if (originalProject && originalProject.type === 'presentation') {
        // Navigate to slide editor for saved presentations
        navigate(`/slide-editor/${originalProject.id}`, {
          state: {
            content: originalProject.slides ? null : presentation.content, // Use slides if available
            title: presentation.title,
            slides: originalProject.slides,
            documentType: 'slides'
          }
        });
      } else {
        // Pass data via localStorage for documents
        localStorage.setItem("currentDocument", JSON.stringify({
          content: presentation.content,
          title: presentation.title,
          documentType: originalProject?.type || "document"
        }));
        // Navigate to document editor for saved documents
        navigate("/document-editor");
      }
    } else {
      // Navigate to slide editor for templates
      navigate(`/slide-editor/${presentation.id}`);
    }
  };

  const renderProjectCard = (presentation) => {
    const IconComponent = presentation.icon;
    return (
      <Card 
        key={presentation.id} 
        className="border border-gray-200 hover:shadow-lg transition-all duration-200 cursor-pointer group"
        onClick={() => handleProjectClick(presentation)}
      >
        <CardContent className="p-0">
          <div className="aspect-square bg-gray-50 border-b border-gray-200 flex items-center justify-center relative">
            <div className={`w-10 h-10 ${presentation.color} rounded-lg flex items-center justify-center`}>
              <IconComponent className={`h-5 w-5 ${presentation.iconColor}`} />
            </div>
            <Avatar className="absolute top-2 right-2 h-6 w-6 bg-gray-600">
              <AvatarFallback className="text-white text-xs">{presentation.author}</AvatarFallback>
            </Avatar>
            {presentation.type === "saved" && (
              <div className="absolute top-2 left-2 bg-emerald-500 text-white px-1.5 py-0.5 rounded-full text-xs font-medium">
                AI
              </div>
            )}
          </div>
          <div className="p-3">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                  {presentation.title}
                </h3>
                <div className="text-xs text-gray-500 mt-1">
                  <span>Updated {presentation.updated}</span>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreHorizontal className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="flex-1 bg-gray-50">
      {/* Content */}
      <main className="flex-1 p-6">
        {/* Search and Actions Bar */}
        <div className="flex items-center justify-between mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input 
              placeholder="Search your recent files..." 
              className="pl-10 w-80 bg-white border-gray-200"
            />
          </div>
          <div className="flex items-center space-x-4">
            <Link to="/new-presentation">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2">
                New Presentation
              </Button>
            </Link>
          </div>
        </div>

        {/* User's Recent Works Section */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <FolderOpen className="h-6 w-6 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900">Your Recent Works</h2>
              {sortedUserWorks.length > 0 && (
                <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                  {sortedUserWorks.length}
                </span>
              )}
            </div>

          </div>

          {sortedUserWorks.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No recent works yet</h3>
              <p className="text-gray-500 mb-6">Create your first AI-generated document to get started</p>
              <Link to="/new-presentation">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Document
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {sortedUserWorks.map(renderProjectCard)}
            </div>
          )}
        </div>

        {/* Templates Section */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <Palette className="h-6 w-6 text-purple-600" />
              <h2 className="text-xl font-semibold text-gray-900">Templates</h2>
              <span className="text-sm text-gray-500">Ready-to-use templates</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {defaultPresentations.map(renderProjectCard)}
          </div>
        </div>

        {/* AI Document Generation Section */}
        <div className="mt-12">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-8">
              <div className="flex items-center justify-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <Brain className="h-6 w-6 text-white" />
                </div>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">AI Document Generation</h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Discover how our advanced AI technology transforms your project data into professional documents
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-br from-blue-50 to-blue-100">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Target className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">Smart Analysis</h3>
                  <p className="text-sm text-gray-600">Analyzes your project requirements and team information</p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-br from-purple-50 to-purple-100">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Zap className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">Custom Generation</h3>
                  <p className="text-sm text-gray-600">Generates customized documents based on industry type and features</p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-br from-green-50 to-green-100">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Clock className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">Timeline Planning</h3>
                  <p className="text-sm text-gray-600">Creates project timelines and milestone suggestions</p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-br from-orange-50 to-orange-100">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <TrendingUp className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">Feature Recommendations</h3>
                  <p className="text-sm text-gray-600">Provides intelligent feature recommendations based on your inputs</p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-br from-red-50 to-red-100">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Shield className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">Secure Processing</h3>
                  <p className="text-sm text-gray-600">All data processing happens securely using your API key</p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-br from-indigo-50 to-indigo-100">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-indigo-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FileText className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">Free Testing</h3>
                  <p className="text-sm text-gray-600">Start with free providers like Hugging Face or Groq to test functionality</p>
                </CardContent>
              </Card>
            </div>

            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
              <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">How It Works</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center mb-4">
                      <span className="text-white font-bold text-xl">1</span>
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-2">Input Your Data</h4>
                    <p className="text-gray-600 text-center">Provide project details, requirements, and team information</p>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full flex items-center justify-center mb-4">
                      <span className="text-white font-bold text-xl">2</span>
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-2">AI Processing</h4>
                    <p className="text-gray-600 text-center">Our AI analyzes and generates customized content</p>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center mb-4">
                      <span className="text-white font-bold text-xl">3</span>
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-2">Professional Output</h4>
                    <p className="text-gray-600 text-center">Get polished documents ready for presentation</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
