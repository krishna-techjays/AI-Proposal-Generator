
import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ArrowLeft, Download, Save, Edit3, Eye, FileText, Presentation } from "lucide-react";

export default function DocumentEditor() {
  const location = useLocation();
  const navigate = useNavigate();
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [documentType, setDocumentType] = useState("document");

  useEffect(() => {
    // Check if content passed via navigation state
    if (location.state?.content) {
      setContent(location.state.content || "");
      setTitle(location.state.title || "Generated Project Document");
      setDocumentType(location.state.documentType || "document");
    } else {
      // Check if content passed via localStorage (from presentations list)
      const currentDocument = localStorage.getItem("currentDocument");
      if (currentDocument) {
        try {
          const doc = JSON.parse(currentDocument);
          setContent(doc.content || "");
          setTitle(doc.title || "Untitled Document");
          setDocumentType(doc.documentType || "document");
          setIsSaved(true); // Already saved if coming from list
          localStorage.removeItem("currentDocument"); // Clean up
        } catch (error) {
          console.error("Error parsing saved document:", error);
          toast.error("Error loading document. Redirecting to create new document.");
          navigate("/new-presentation");
        }
      } else {
        // If no content at all, redirect back
        navigate("/new-presentation");
      }
    }
  }, [location.state, navigate]);

  const handleSave = () => {
    if (!title.trim()) {
      toast.error("Please enter a title for your document");
      return;
    }

    // Save to localStorage for demo purposes
    const savedProjects = JSON.parse(localStorage.getItem("savedProjects") || "[]");
    const newProject = {
      id: Date.now(),
      title: title,
      content: content,
      createdAt: new Date().toISOString(),
      type: documentType,
      author: "You"
    };

    savedProjects.unshift(newProject);
    localStorage.setItem("savedProjects", JSON.stringify(savedProjects));

    setIsSaved(true);
    toast.success(`${documentType === 'document' ? 'Document' : 'Presentation'} saved successfully!`);
  };

  const handleDownload = () => {
    const element = document.createElement("a");
    const file = new Blob([content], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = `${title || documentType}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    toast.success(`${documentType === 'document' ? 'Document' : 'Presentation'} downloaded!`);
  };

  const toggleEdit = () => {
    setIsEditing(!isEditing);
  };

  const formatContentForDisplay = (content: string) => {
    if (!content || typeof content !== 'string') {
      return '';
    }
    return content
      .replace(/^# /gm, '\n# ')
      .replace(/^## /gm, '\n## ')
      .replace(/^### /gm, '\n### ')
      .trim();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/presentations")}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Presentations
            </Button>
            <div className="flex items-center gap-2">
              {documentType === 'slides' ? (
                <Presentation className="h-5 w-5 text-green-600" />
              ) : (
                <FileText className="h-5 w-5 text-blue-600" />
              )}
              <h1 className="text-xl font-semibold text-gray-900">
                AI Generated {documentType === 'slides' ? 'Presentation' : 'Document'}
              </h1>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="outline" size="sm" onClick={toggleEdit}>
              {isEditing ? <Eye className="h-4 w-4 mr-2" /> : <Edit3 className="h-4 w-4 mr-2" />}
              {isEditing ? "Preview" : "Edit"}
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownload}>
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            <Button onClick={handleSave} disabled={isSaved} size="sm">
              <Save className="h-4 w-4 mr-2" />
              {isSaved ? "Saved" : "Save"}
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-6 py-8 max-w-4xl">
        <Card className="shadow-sm">
          <CardHeader className="pb-4">
            <div>
              <Label htmlFor="title">{documentType === 'slides' ? 'Presentation' : 'Document'} Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={`Enter ${documentType} title`}
                className="mt-2"
              />
            </div>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <div>
                <Label htmlFor="content" className="text-sm font-medium mb-2 block">
                  {documentType === 'slides' ? 'Presentation' : 'Document'} Content
                </Label>
                <Textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="AI-generated content will appear here..."
                  className="min-h-[600px] font-mono text-sm"
                />
              </div>
            ) : (
              <div className="prose prose-lg max-w-none">
                <div className="bg-white p-8 rounded-lg border">
                  <div 
                    className="whitespace-pre-wrap leading-relaxed text-gray-800"
                    style={{
                      fontFamily: 'system-ui, -apple-system, sans-serif',
                      lineHeight: '1.7'
                    }}
                  >
                    {formatContentForDisplay(content) || "No content available"}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
