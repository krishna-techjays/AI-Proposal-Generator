import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  Plus, 
  Clock, 
  TrendingUp, 
  Users, 
  CheckCircle,
  Target,
  BarChart3,
  Bot
} from "lucide-react";

interface Project {
  id: number;
  title: string;
  content: string;
  createdAt: string;
  author?: string;
  type?: string;
  status?: string;
  slides?: unknown[];
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [userProfile, setUserProfile] = useState({
    name: "User",
    email: "user@example.com"
  });
  const [recentProjects, setRecentProjects] = useState([]);
  const [stats, setStats] = useState({
    totalProjects: 0,
    completedProjects: 0,
    inProgressProjects: 0,
    successRate: 85
  });

  useEffect(() => {
    // Load user profile from localStorage
    const savedProfile = localStorage.getItem("user_profile");
    if (savedProfile) {
      const profile = JSON.parse(savedProfile);
      setUserProfile(profile);
    }

    // Load recent projects from localStorage
    const projects = JSON.parse(localStorage.getItem("savedProjects") || "[]");
    setRecentProjects(projects.slice(0, 3)); // Show only 3 most recent

    // Calculate stats
    setStats({
      totalProjects: projects.length,
      completedProjects: projects.filter((p: Project) => p.status === 'completed').length,
      inProgressProjects: projects.filter((p: Project) => p.status === 'in-progress').length,
      successRate: projects.length > 0 ? Math.round((projects.filter((p: Project) => p.status === 'completed').length / projects.length) * 100) : 0
    });
  }, []);





  return (
    <div className="flex-1 bg-gray-50">
      <main className="flex-1 p-6">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {userProfile.name.split(' ')[0]}! 👋
          </h1>
          <p className="text-gray-600">
            Here's what's happening with your proposals today.
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Projects</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalProjects}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Completed</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.completedProjects}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">In Progress</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.inProgressProjects}</p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Clock className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Success Rate</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.successRate}%</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>



        {/* Recent Projects */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Recent Projects</h2>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate("/presentations")}
            >
              View All
            </Button>
          </div>
          
          {recentProjects.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No projects yet</h3>
                <p className="text-gray-600 mb-4">Create your first AI-generated proposal to get started</p>
                <div className="flex space-x-3">
                  <Button onClick={() => navigate("/new-presentation")} className="bg-blue-600 hover:bg-blue-700">
                    <Bot className="h-4 w-4 mr-2" />
                    Start AI Chat
                  </Button>
                  <Button variant="outline" onClick={() => navigate("/new-presentation")}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create New Proposal
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {recentProjects.map((project: Project, index: number) => (
                <Card key={index} className="cursor-pointer hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-semibold text-gray-900 truncate">{project.title}</h3>
                      <Badge variant="secondary" className="text-xs">
                        {project.type || 'proposal'}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">
                        {project.author || 'You'}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
