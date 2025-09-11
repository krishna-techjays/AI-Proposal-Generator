import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { TopNavbar } from "@/components/TopNavbar";
import Index from "./pages/Index";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import NewPresentationForm from "./pages/AIChatProposalInterface";
import DocumentEditor from "./pages/DocumentEditor";
import SlideEditor from "./pages/SlideEditor";
import NotFound from "./pages/NotFound";
import Profile from "./pages/Profile";


import Signup from "./pages/Signup";
import { useEffect, useState } from "react";

const queryClient = new QueryClient();

// Protected Route Component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const authStatus = localStorage.getItem("is_authenticated");
    setIsAuthenticated(authStatus === "true");
  }, []);

  if (isAuthenticated === null) {
    // Loading state
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/signup" replace />;
  }

  return <>{children}</>;
};

// Authenticated Route Component - redirects to /dashboard if authenticated
const AuthenticatedRoute = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const authStatus = localStorage.getItem("is_authenticated");
    setIsAuthenticated(authStatus === "true");
  }, []);

  if (isAuthenticated === null) {
    // Loading state
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Home />} />
            <Route path="/signup" element={
              <AuthenticatedRoute>
                <Signup />
              </AuthenticatedRoute>
            } />
            
            {/* Protected routes */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <div className="min-h-screen w-full bg-gray-50">
                  <TopNavbar />
                  <main className="flex-1">
                    <Dashboard />
                  </main>
                </div>
              </ProtectedRoute>
            } />
            
            <Route path="/presentations" element={
              <ProtectedRoute>
                <div className="min-h-screen w-full bg-gray-50">
                  <TopNavbar />
                  <main className="flex-1">
                    <Index />
                  </main>
                </div>
              </ProtectedRoute>
            } />
            
            <Route path="/new-presentation" element={
              <ProtectedRoute>
                <div className="min-h-screen w-full bg-gray-50">
                  <TopNavbar />
                  <main className="flex-1">
                    <NewPresentationForm />
                  </main>
                </div>
              </ProtectedRoute>
            } />
            
            <Route path="/slide-editor/:id" element={
              <ProtectedRoute>
                <div className="slide-editor-container bg-gray-50">
                  <TopNavbar />
                  <main className="flex-1 overflow-hidden">
                    <SlideEditor />
                  </main>
                </div>
              </ProtectedRoute>
            } />
            
            <Route path="/document-editor" element={
              <ProtectedRoute>
                <div className="min-h-screen w-full bg-gray-50">
                  <TopNavbar />
                  <main className="flex-1">
                    <DocumentEditor />
                  </main>
                </div>
              </ProtectedRoute>
            } />
            
            <Route path="/profile" element={
              <ProtectedRoute>
                <div className="min-h-screen w-full bg-gray-50">
                  <TopNavbar />
                  <main className="flex-1">
                    <Profile />
                  </main>
                </div>
              </ProtectedRoute>
            } />

            

            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
