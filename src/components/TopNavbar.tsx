import { Home, FileText, Plus, Bell } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useState, useEffect } from "react";

const navigationItems = [{
  title: "Dashboard",
  url: "/dashboard",
  icon: Home
}, {
  title: "Recent Works",
  url: "/presentations",
  icon: FileText
}, {
  title: "Create New",
  url: "/new-presentation",
  icon: Plus
}];

export function TopNavbar() {
  const navigate = useNavigate();
  const [userProfile, setUserProfile] = useState({
    name: "User",
    email: "user@example.com"
  });

  useEffect(() => {
    // Load user profile from localStorage
    const savedProfile = localStorage.getItem("user_profile");
    if (savedProfile) {
      const profile = JSON.parse(savedProfile);
      setUserProfile(profile);
    }
  }, []);

  const handleProfileClick = () => {
    navigate("/profile");
  };



  const getUserInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return <nav className="bg-white border-b border-gray-200 px-6 py-3">
      <div className="flex items-center justify-between">
        {/* Logo/Brand */}
        <div className="flex flex-col">
          <h2 className="text-xl font-semibold text-gray-900">Proposal.ai</h2>
          <p className="text-xs text-gray-500">AI Proposal Builder</p>
          
        </div>

        {/* Navigation Items */}
        <div className="flex items-center space-x-1">
          {navigationItems.map(item => <NavLink key={item.title} to={item.url} className={({
          isActive
        }) => `flex items-center space-x-2 px-3 py-1.5 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors text-sm ${isActive ? "bg-gray-100 text-blue-600" : ""}`}>
              <item.icon className="h-4 w-4" />
              <span className="hidden sm:block">{item.title}</span>
            </NavLink>)}
        </div>

        {/* Profile Section */}
        <div className="flex items-center space-x-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Bell className="h-5 w-5 text-gray-600" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Notifications</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button onClick={handleProfileClick} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                  <Avatar className="h-8 w-8 bg-gray-400">
                    <AvatarFallback className="text-white font-semibold text-sm">
                      {getUserInitials(userProfile.name)}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <div className="text-center">
                  <div className="text-sm font-semibold">{userProfile.name}</div>
                  <div className="text-xs text-gray-500">{userProfile.email}</div>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>


        </div>
      </div>
    </nav>;
}