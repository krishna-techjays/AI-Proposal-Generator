import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { User, Mail, Lock, Eye, EyeOff } from "lucide-react";

interface UserData {
  name: string;
  email: string;
  password: string;
  isAuthenticated: boolean;
  createdAt: string;
}

export default function Signup() {
  const navigate = useNavigate();
  const [isSignIn, setIsSignIn] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = () => {
    if (!isSignIn && !formData.name.trim()) {
      toast.error("Please enter your name");
      return false;
    }
    if (!formData.email.trim()) {
      toast.error("Please enter your email");
      return false;
    }
    if (!formData.email.includes("@")) {
      toast.error("Please enter a valid email address");
      return false;
    }
    if (!formData.password.trim()) {
      toast.error("Please enter a password");
      return false;
    }
    if (formData.password.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return false;
    }
    if (!isSignIn && formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsLoading(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      if (isSignIn) {
        // Check if user exists (for demo, we'll check localStorage)
        const existingUsers = JSON.parse(localStorage.getItem("registered_users") || "[]");
        const existingUser = existingUsers.find((user: UserData) => 
          user.email === formData.email && user.password === formData.password
        );

        if (!existingUser) {
          toast.error("Invalid email or password");
          setIsLoading(false);
          return;
        }

        // Load existing user profile
        const userData = {
          name: existingUser.name,
          email: existingUser.email,
          isAuthenticated: true,
          createdAt: existingUser.createdAt
        };

        localStorage.setItem("user_profile", JSON.stringify(userData));
        localStorage.setItem("is_authenticated", "true");

        toast.success("Welcome back!");
      } else {
        // Create new user
        const userData = {
          name: formData.name,
          email: formData.email,
          password: formData.password, // In real app, this would be hashed
          isAuthenticated: true,
          createdAt: new Date().toISOString()
        };

        // Save to registered users list
        const existingUsers = JSON.parse(localStorage.getItem("registered_users") || "[]");
        const userExists = existingUsers.some((user: UserData) => user.email === formData.email);
        
        if (userExists) {
          toast.error("An account with this email already exists");
          setIsLoading(false);
          return;
        }

        existingUsers.push(userData);
        localStorage.setItem("registered_users", JSON.stringify(existingUsers));

        // Save current user profile
        localStorage.setItem("user_profile", JSON.stringify({
          name: userData.name,
          email: userData.email,
          isAuthenticated: true,
          createdAt: userData.createdAt
        }));
        localStorage.setItem("is_authenticated", "true");

        toast.success("Account created successfully!");
      }
      
      // Navigate to the main application
      navigate("/dashboard");
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setIsSignIn(!isSignIn);
    setFormData({
      name: "",
      email: "",
      password: "",
      confirmPassword: ""
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-xl border-0">
          <CardHeader className="text-center pb-6">
            <div className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-4">
              <User className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              {isSignIn ? "Welcome Back" : "Create Account"}
            </CardTitle>
            <CardDescription className="text-gray-600">
              {isSignIn 
                ? "Sign in to access your proposals" 
                : "Get started with AI-powered proposal generation"
              }
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {!isSignIn && (
              <div className="space-y-2">
                <Label htmlFor="name" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Full Name
                </Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  className="h-11"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={(e) => handleInputChange("password", e.target.value)}
                  className="h-11 pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1 h-9 w-9"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {!isSignIn && (
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  Confirm Password
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                  className="h-11"
                />
              </div>
            )}

            <Button
              onClick={handleSubmit}
              disabled={isLoading}
              className="w-full h-11 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  {isSignIn ? "Signing In..." : "Creating Account..."}
                </div>
              ) : (
                isSignIn ? "Sign In" : "Create Account"
              )}
            </Button>

            <div className="text-center pt-4">
              <p className="text-sm text-gray-600">
                {isSignIn ? "Don't have an account?" : "Already have an account?"}
                <Button
                  variant="link"
                  className="text-blue-600 hover:text-blue-800 p-0 h-auto font-medium"
                  onClick={toggleMode}
                >
                  {isSignIn ? "Sign up" : "Sign in"}
                </Button>
              </p>
            </div>

            {!isSignIn && (
              <div className="text-center pt-2">
                <p className="text-xs text-gray-500">
                  By creating an account, you agree to our Terms of Service and Privacy Policy
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
