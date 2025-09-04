
import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { 
  Play, Plus, Download, Share, Type, Image, BarChart3, Square, ArrowLeft, Eye, Send, MessageCircle, Bot, User, Trash2, Edit3,
  Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, List, ListOrdered, Link, Palette, Layers, Copy,
  Undo, Redo, ZoomIn, ZoomOut, Grid, Layout, Shapes, Smartphone, Monitor, RotateCcw, RotateCw, FlipHorizontal, FlipVertical,
  Save, Check
} from "lucide-react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { AIService } from "@/services/aiService";
import ChatBot from "@/components/ChatBot";
import { ChatContext } from "@/types/chat";

interface SlideStyle {
  fontFamily: string;
  fontSize: number;
  fontWeight: string;
  fontStyle: string;
  textDecoration: string;
  textAlign: string;
  color: string;
}

interface SlideElement {
  type: 'text' | 'image' | 'chart' | 'shape';
  content: string;
  style?: Partial<SlideStyle>;
  position?: { x: number; y: number };
  size?: { width: number; height: number };
}

interface Slide {
  id: number;
  title: string;
  content: string;
  elements: SlideElement[];
  background: string;
  layout: string;
  style: SlideStyle;
}

const SlideEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [currentSlide, setCurrentSlide] = useState(1);
  const [commentMessage, setCommentMessage] = useState("");
  const [presentationName, setPresentationName] = useState("Untitled Presentation");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [tempSlides, setTempSlides] = useState<Slide[]>([]);
  
  const defaultStyle: SlideStyle = {
    fontFamily: "Poppins",
    fontSize: 11,
    fontWeight: "normal",
    fontStyle: "normal",
    textDecoration: "none",
    textAlign: "left",
    color: "#000000"
  };

  const [slides, setSlides] = useState<Slide[]>([
    {
      id: 1,
      title: "Title Slide",
      content: "Welcome to My Presentation",
      elements: [],
      background: "#ffffff",
      layout: "title",
      style: defaultStyle
    },
    {
      id: 2,
      title: "Introduction",
      content: "About Our Company",
      elements: [],
      background: "#ffffff",
      layout: "content",
      style: defaultStyle
    },
    {
      id: 3,
      title: "Problem Statement",
      content: "What We're Solving",
      elements: [],
      background: "#ffffff",
      layout: "content",
      style: defaultStyle
    }
  ]);

  // Text formatting state
  const [textFormat, setTextFormat] = useState({
    fontSize: 11,
    fontFamily: "Poppins",
    fontWeight: "normal",
    fontStyle: "normal",
    textDecoration: "none",
    textAlign: "center",
    color: "#000000"
  });

  // Slide editing state
  const [selectedElement, setSelectedElement] = useState(null);
  const [zoom, setZoom] = useState(100);
  const [showGrid, setShowGrid] = useState(false);
  const [showRulers, setShowRulers] = useState(true);
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);

  // Function to convert markdown to formatted HTML
  const convertMarkdownToFormattedText = (text: string): string => {
    return text
      // Convert **bold** to <strong> tags
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      // Convert *italic* to <em> tags
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      // Convert `code` to <code> tags
      .replace(/`(.*?)`/g, '<code>$1</code>')
      // Remove slide number references
      .replace(/SLIDE\s*\d+:\s*/gi, '')
      .trim();
  };

  // Function to convert HTML content to clean text for editing
  const convertHtmlToCleanText = (htmlContent: string): string => {
    return htmlContent
      // Remove HTML tags but keep their content
      .replace(/<h1>(.*?)<\/h1>/g, '$1')
      .replace(/<h2>(.*?)<\/h2>/g, '$1')
      .replace(/<h3>(.*?)<\/h3>/g, '$1')
      .replace(/<p>(.*?)<\/p>/g, '$1')
      .replace(/<ul>(.*?)<\/ul>/g, '$1')
      .replace(/<li>(.*?)<\/li>/g, '- $1')
      .replace(/<strong>(.*?)<\/strong>/g, '**$1**')
      .replace(/<em>(.*?)<\/em>/g, '*$1*')
      .replace(/<code>(.*?)<\/code>/g, '`$1`')
      // Clean up extra whitespace
      .replace(/\n\s*\n/g, '\n\n')
      .trim();
  };

  // Function to convert clean text back to HTML for display
  const convertCleanTextToHtml = (cleanText: string): string => {
    const lines = cleanText.split('\n');
    let htmlContent = '';
    let inBulletList = false;
    let bulletItems = [];

    for (const line of lines) {
      const trimmedLine = line.trim();
      
      if (trimmedLine.startsWith('**') && trimmedLine.endsWith('**')) {
        // Bold text on its own line
        const boldText = trimmedLine.replace(/\*\*(.*?)\*\*/g, '$1');
        htmlContent += `<h2>${boldText}</h2>`;
      } else if (trimmedLine.startsWith('- ')) {
        // Bullet point
        if (!inBulletList) {
          inBulletList = true;
        }
        const bulletText = trimmedLine.substring(2).replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        bulletItems.push(`<li>${bulletText}</li>`);
      } else if (trimmedLine) {
        // Close bullet list if open
        if (inBulletList && bulletItems.length > 0) {
          htmlContent += `<ul>${bulletItems.join('')}</ul>`;
          bulletItems = [];
          inBulletList = false;
        }
        
        // Regular content
        const processedLine = trimmedLine.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        htmlContent += `<p>${processedLine}</p>`;
      } else {
        // Empty line - close bullet list if open
        if (inBulletList && bulletItems.length > 0) {
          htmlContent += `<ul>${bulletItems.join('')}</ul>`;
          bulletItems = [];
          inBulletList = false;
        }
      }
    }

    // Close any remaining bullet list
    if (inBulletList && bulletItems.length > 0) {
      htmlContent += `<ul>${bulletItems.join('')}</ul>`;
    }

    return htmlContent;
  };

  // Function to convert AI content into slides with proper HTML structure
  const convertContentToSlides = (content: string) => {
    const lines = content.split('\n').filter(line => line.trim());
    const slides = [];
    let currentSlide = { 
      id: 1, 
      title: "Title Slide", 
      content: "",
      elements: [],
      background: "#ffffff",
      layout: "title",
      style: {
        fontFamily: "Poppins",
        fontSize: 11,
        fontWeight: "normal",
        fontStyle: "normal",
        textDecoration: "none",
        textAlign: "left",
        color: "#000000"
      }
    };
    let slideId = 1;
    let inBulletList = false;
    let bulletItems = [];

    for (const line of lines) {
      // Check for slide headings in various formats
      if (line.startsWith('# SLIDE') || line.startsWith('# SLIDE ') || 
          line.startsWith('**SLIDE') || line.startsWith('**SLIDE ') ||
          line.match(/^#\s*SLIDE\s*\d+:/i) || line.match(/^\*\*SLIDE\s*\d+:/i) ||
          line.match(/^SLIDE\s*\d+:/i)) {
        
        // Close any open bullet list before creating new slide
        if (inBulletList && bulletItems.length > 0) {
          currentSlide.content += '<ul>' + bulletItems.join('') + '</ul>';
          bulletItems = [];
          inBulletList = false;
        }
        
        // New slide with slide heading
        if (currentSlide.content.trim()) {
          slides.push(currentSlide);
          slideId++;
        }
        
        // Extract slide title from the heading and clean it
        let slideTitle = line.replace(/^#\s*SLIDE\s*\d+:\s*/i, '')
                            .replace(/^\*\*SLIDE\s*\d+:\s*/i, '')
                            .replace(/^SLIDE\s*\d+:\s*/i, '')
                            .replace(/\*\*$/, '')
                            .trim();
        
        // Clean markdown formatting from title
        slideTitle = convertMarkdownToFormattedText(slideTitle);
        
        // If no title extracted, use a default
        if (!slideTitle) {
          slideTitle = `Slide ${slideId}`;
        }
        
        console.log(`Creating slide ${slideId}: ${slideTitle}`); // Debug log
        
        currentSlide = {
          id: slideId,
          title: slideTitle,
          content: slideTitle,
          elements: [],
          background: "#ffffff",
          layout: "content",
          style: {
            fontFamily: "Poppins",
            fontSize: 11,
            fontWeight: "normal",
            fontStyle: "normal",
            textDecoration: "none",
            textAlign: "left",
            color: "#000000"
          }
        };
      } else if (line.startsWith('# ')) {
        // Close any open bullet list
        if (inBulletList && bulletItems.length > 0) {
          currentSlide.content += '<ul>' + bulletItems.join('') + '</ul>';
          bulletItems = [];
          inBulletList = false;
        }
        
        // Regular heading - add to current slide
        const cleanedHeading = convertMarkdownToFormattedText(line.substring(2).trim());
        currentSlide.content += '<h1>' + cleanedHeading + '</h1>';
      } else if (line.startsWith('## ')) {
        // Close any open bullet list
        if (inBulletList && bulletItems.length > 0) {
          currentSlide.content += '<ul>' + bulletItems.join('') + '</ul>';
          bulletItems = [];
          inBulletList = false;
        }
        
        // Subheading - add to current slide
        const cleanedSubheading = convertMarkdownToFormattedText(line.substring(3).trim());
        currentSlide.content += '<h2>' + cleanedSubheading + '</h2>';
      } else if (line.startsWith('### ')) {
        // Close any open bullet list
        if (inBulletList && bulletItems.length > 0) {
          currentSlide.content += '<ul>' + bulletItems.join('') + '</ul>';
          bulletItems = [];
          inBulletList = false;
        }
        
        // Sub-subheading - add to current slide
        const cleanedSubSubheading = convertMarkdownToFormattedText(line.substring(4).trim());
        currentSlide.content += '<h3>' + cleanedSubSubheading + '</h3>';
      } else if (line.startsWith('- ') || line.startsWith('* ')) {
        // Bullet points - start or continue bullet list
        if (!inBulletList) {
          inBulletList = true;
        }
        const cleanedBullet = convertMarkdownToFormattedText(line.replace(/^[-*]\s*/, '').trim());
        bulletItems.push('<li>' + cleanedBullet + '</li>');
      } else if (line.trim()) {
        // Close any open bullet list
        if (inBulletList && bulletItems.length > 0) {
          currentSlide.content += '<ul>' + bulletItems.join('') + '</ul>';
          bulletItems = [];
          inBulletList = false;
        }
        
        // Regular content - add to current slide
        if (line.trim().length > 0) {
          const cleanedContent = convertMarkdownToFormattedText(line.trim());
          currentSlide.content += '<p>' + cleanedContent + '</p>';
        }
      }
    }

    // Close any remaining bullet list
    if (inBulletList && bulletItems.length > 0) {
      currentSlide.content += '<ul>' + bulletItems.join('') + '</ul>';
    }

    // Add the last slide
    if (currentSlide.content.trim()) {
      slides.push(currentSlide);
    }

    // If no slides were created, create a default one
    if (slides.length === 0) {
      slides.push({
        id: 1,
        title: "AI Generated Content",
        content: '<p>' + convertMarkdownToFormattedText(content) + '</p>',
        elements: [],
        background: "#ffffff",
        layout: "content",
        style: {
          fontFamily: "Poppins",
          fontSize: 11,
          fontWeight: "normal",
          fontStyle: "normal",
          textDecoration: "none",
          textAlign: "left",
          color: "#000000"
        }
      });
    }

    return slides;
  };

  useEffect(() => {
    // Add body class to prevent scrolling
    document.body.classList.add('slide-editor-active');
    
    // Check if content passed via navigation state
    if (location.state?.slides) {
      // Loading saved presentation with slides
      const title = location.state.title || "Saved Presentation";
      setPresentationName(title);
      setSlides(location.state.slides);
      setCurrentSlide(1);
    } else if (location.state?.content) {
      // Loading new AI-generated content
      const aiContent = location.state.content;
      const title = location.state.title || "AI Generated Presentation";
      
      console.log("AI Content received:", aiContent); // Debug log
      
      setPresentationName(title);
      
      // Convert AI content to slides
      const convertedSlides = convertContentToSlides(aiContent);
      console.log("Converted slides:", convertedSlides); // Debug log
      
      setSlides(convertedSlides);
      setCurrentSlide(1);
    } else {
      // Check if this is a saved presentation by ID
      const savedProjects = JSON.parse(localStorage.getItem("savedProjects") || "[]");
      const savedPresentation = savedProjects.find(p => p.id === id && p.type === 'presentation');
      
      if (savedPresentation) {
        setPresentationName(savedPresentation.title);
        setSlides(savedPresentation.slides || []);
        setCurrentSlide(1);
      }
    }
    
    // Cleanup function to remove body class when component unmounts
    return () => {
      document.body.classList.remove('slide-editor-active');
    };
  }, [location.state, id]);



  const [comments, setComments] = useState([
    { id: 1, author: 'John Doe', message: 'Great start! Consider adding more visual elements.', time: '1:45 PM' },
    { id: 2, author: 'Sarah Smith', message: 'The color scheme works well with our brand.', time: '2:15 PM' },
  ]);

  const [aiContent, setAiContent] = useState([
    { type: 'suggestion', title: 'Content Enhancement', description: 'Add bullet points to make the slide more readable' },
    { type: 'design', title: 'Visual Improvement', description: 'Consider using a gradient background for better visual appeal' },
    { type: 'template', title: 'Layout Suggestion', description: 'Try the two-column layout for better content organization' },
  ]);

  // Generate AI suggestions based on current slide content
  const generateSlideSpecificSuggestions = () => {
    const currentSlideData = slides.find(s => s.id === currentSlide);
    if (!currentSlideData) return;

    const content = currentSlideData.content.toLowerCase();
    const suggestions = [];

    if (content.includes('problem') || content.includes('issue')) {
      suggestions.push({
        type: 'content',
        title: 'Add Solution Section',
        description: 'Consider adding a solution or approach section after the problem statement'
      });
    }

    if (content.length < 100) {
      suggestions.push({
        type: 'content',
        title: 'Expand Content',
        description: 'This slide could benefit from more detailed information or examples'
      });
    }

    if (content.includes('data') || content.includes('statistics')) {
      suggestions.push({
        type: 'visual',
        title: 'Add Chart',
        description: 'Consider adding a chart or graph to visualize the data'
      });
    }

    if (suggestions.length > 0) {
      setAiContent([...aiContent, ...suggestions]);
    }
  };

  const addNewSlide = () => {
    const newSlide = {
      id: slides.length + 1,
      title: `Slide ${slides.length + 1}`,
      content: "New slide content",
      elements: [],
      background: "#ffffff",
      layout: "content",
      style: {
        fontFamily: "Poppins",
        fontSize: 11,
        fontWeight: "normal",
        fontStyle: "normal",
        textDecoration: "none",
        textAlign: "left",
        color: "#000000"
      }
    };
    setSlides([...slides, newSlide]);
    setCurrentSlide(newSlide.id);
  };

  const deleteSlide = (slideId: number) => {
    if (slides.length > 1) {
      const updatedSlides = slides.filter(slide => slide.id !== slideId);
      setSlides(updatedSlides);
      if (currentSlide === slideId) {
        setCurrentSlide(updatedSlides[0]?.id || 1);
      }
    }
  };

  const updateSlideContent = (slideId: number, newContent: string) => {
    setSlides(slides.map(slide => 
      slide.id === slideId ? { ...slide, content: newContent } : slide
    ));
  };



  const addComment = () => {
    if (commentMessage.trim()) {
      const newComment = {
        id: comments.length + 1,
        author: 'You',
        message: commentMessage,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setComments([...comments, newComment]);
      setCommentMessage("");
    }
  };

  const generateAIContent = () => {
    const newSuggestions = [
      { type: 'suggestion', title: 'Interactive Elements', description: 'Add interactive charts and animations to engage your audience' },
      { type: 'design', title: 'Color Harmony', description: 'Use complementary colors to create visual hierarchy' },
      { type: 'content', title: 'Storytelling', description: 'Structure your content with a clear narrative arc' },
    ];
    setAiContent([...aiContent, ...newSuggestions]);
  };

  const applyAISuggestion = (index: number) => {
    const suggestion = aiContent[index];
    const currentSlideData = slides.find(s => s.id === currentSlide);
    if (currentSlideData) {
      updateSlideContent(currentSlide, `${currentSlideData.content}\n\nApplied: ${suggestion.title}`);
    }
  };

  const exportPresentation = () => {
    console.log('Exporting presentation:', { name: presentationName, slides });
    // Add export logic here
  };

  const sharePresentation = () => {
    console.log('Sharing presentation:', presentationName);
    // Add share logic here
  };

  const previewPresentation = () => {
    console.log('Previewing presentation');
    // Add preview logic here
  };

  const toggleEdit = () => {
    if (isEditing) {
      // Switching to preview mode - save changes
      setIsEditing(false);
      toast.success("Changes saved!");
    } else {
      // Switching to edit mode - create temp copy
      setTempSlides([...slides]);
      setIsEditing(true);
    }
  };

  const cancelEdit = () => {
    // Revert changes by restoring original slides
    setSlides(tempSlides);
    setIsEditing(false);
    toast.info("Changes reverted");
  };

  const saveProject = useCallback(async () => {
    if (isSaving) return;
    
    setIsSaving(true);
    try {
      const savedProjects = JSON.parse(localStorage.getItem("savedProjects") || "[]");
      
      const projectData = {
        id: id || Date.now().toString(),
        title: presentationName,
        slides: slides,
        lastModified: new Date().toISOString(),
        type: 'presentation'
      };

      const existingIndex = savedProjects.findIndex(p => p.id === projectData.id);
      if (existingIndex !== -1) {
        savedProjects[existingIndex] = projectData;
      } else {
        savedProjects.unshift(projectData);
      }

      localStorage.setItem("savedProjects", JSON.stringify(savedProjects));
      toast.success("Project saved successfully!");
    } catch (error) {
      console.error("Error saving project:", error);
      toast.error("Failed to save project. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }, [id, presentationName, slides, isSaving]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 's':
            e.preventDefault();
            saveProject();
            break;
          case '=':
            e.preventDefault();
            setZoom(Math.min(200, zoom + 10));
            break;
          case '-':
            e.preventDefault();
            setZoom(Math.max(50, zoom - 10));
            break;
        }
      } else {
        switch (e.key) {
          case 'ArrowLeft':
            e.preventDefault();
            if (currentSlide > 1) setCurrentSlide(currentSlide - 1);
            break;
          case 'ArrowRight':
            e.preventDefault();
            if (currentSlide < slides.length) setCurrentSlide(currentSlide + 1);
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentSlide, slides.length, zoom, saveProject]);

  const tools = [
    {
      name: "Text",
      icon: Type,
      color: "bg-blue-100 text-blue-600",
      action: () => console.log('Adding text element')
    },
    {
      name: "Image",
      icon: Image,
      color: "bg-green-100 text-green-600",
      action: () => console.log('Adding image element')
    },
    {
      name: "Chart",
      icon: BarChart3,
      color: "bg-purple-100 text-purple-600",
      action: () => console.log('Adding chart element')
    },
    {
      name: "Shape",
      icon: Square,
      color: "bg-orange-100 text-orange-600",
      action: () => console.log('Adding shape element')
    }
  ];

  return (
    <div className="slide-editor-container bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="h-16 bg-white border-b border-gray-200 px-6 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={() => navigate(-1)} className="flex items-center">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          {isEditingTitle ? (
            <Input 
              className="w-64" 
              value={presentationName}
              onChange={(e) => setPresentationName(e.target.value)}
              onBlur={() => setIsEditingTitle(false)}
              onKeyDown={(e) => e.key === 'Enter' && setIsEditingTitle(false)}
              autoFocus
            />
          ) : (
            <div className="flex items-center space-x-2">
              <span className="text-lg font-medium">{presentationName}</span>
              <Button variant="ghost" size="sm" onClick={() => setIsEditingTitle(true)}>
                <Edit3 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          {isEditing && (
            <Button variant="outline" size="sm" onClick={cancelEdit} className="flex items-center text-red-600 hover:text-red-700">
              Cancel
            </Button>
          )}
                  <Button variant="outline" size="sm" onClick={toggleEdit} className="flex items-center">
            {isEditing ? <Check className="h-4 w-4 mr-2" /> : <Edit3 className="h-4 w-4 mr-2" />}
            {isEditing ? "Confirm" : "Edit"}
          </Button>

          <Button variant="outline" size="sm" onClick={sharePresentation} className="flex items-center">
            <Share className="h-4 w-4 mr-2" />
            Share
          </Button>
          
          
          <Button variant="outline" size="sm" onClick={exportPresentation} className="flex items-center">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button 
            size="sm" 
            className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2 font-medium min-w-[120px]" 
            onClick={saveProject}
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save Project
              </>
            )}
          </Button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Slide Thumbnails */}
        <div className="w-64 bg-white border-r border-gray-200 flex flex-col flex-shrink-0">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="font-medium text-gray-900">Slides</h3>
            <Button size="sm" variant="ghost" onClick={addNewSlide} className="flex items-center">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-2">
              {slides.map(slide => (
                <Card
                  key={slide.id}
                  className={`cursor-pointer transition-all relative group ${
                    currentSlide === slide.id ? 'ring-2 ring-blue-500' : ''
                  }`}
                  onClick={() => setCurrentSlide(slide.id)}
                >
                  <CardContent className="p-3">
                    <div className="aspect-video bg-gray-100 rounded mb-2 flex items-center justify-center relative">
                      <span className="text-xs text-gray-500">{slide.id}</span>
                      {slides.length > 1 && (
                        <Button
                          size="sm"
                          variant="destructive"
                          className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteSlide(slide.id);
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                    <p className="text-xs font-medium text-gray-700 truncate">{slide.title}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* Center Canvas Area */}
        <div className="flex-1 bg-gray-100 flex items-center justify-center overflow-hidden">
          {/* Slide Canvas */}
          <div 
            className="relative bg-white shadow-xl"
            style={{
              width: '800px',
              height: '450px',
              transform: `scale(${zoom / 100})`,
              transformOrigin: 'center'
            }}
          >
            {/* Grid Overlay */}
            {showGrid && (
              <div className="absolute inset-0 pointer-events-none">
                {Array.from({length: 16}, (_, i) => (
                  <div key={i} className="absolute top-0 w-px h-full bg-gray-200" style={{left: `${(i + 1) * 6.25}%`}}></div>
                ))}
                {Array.from({length: 9}, (_, i) => (
                  <div key={i} className="absolute left-0 w-full h-px bg-gray-200" style={{top: `${(i + 1) * 11.11}%`}}></div>
                ))}
              </div>
            )}

            {/* Slide Background */}
            <div 
              className="absolute inset-0"
              style={{backgroundColor: slides.find(s => s.id === currentSlide)?.background || "#ffffff"}}
            ></div>

                            {/* Slide Content */}
                <div className="relative h-full p-12 flex flex-col justify-center">
                  {/* Title */}
                  <div className="text-center mb-8">
                    {isEditing ? (
                      <Input
                        className="text-4xl font-bold text-gray-900 text-center border-none bg-transparent mb-4 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded"
                        value={slides.find(s => s.id === currentSlide)?.title || ""}
                        onChange={(e) => {
                          const updatedSlides = slides.map(slide => 
                            slide.id === currentSlide ? { ...slide, title: e.target.value } : slide
                          );
                          setSlides(updatedSlides);
                        }}
                        placeholder="Slide Title"
                        style={{
                          fontFamily: textFormat.fontFamily,
                          fontSize: `${textFormat.fontSize * 1.5}px`,
                          fontWeight: textFormat.fontWeight,
                          fontStyle: textFormat.fontStyle,
                          textDecoration: textFormat.textDecoration,
                          textAlign: textFormat.textAlign as 'left' | 'center' | 'right',
                          color: textFormat.color
                        }}
                      />
                    ) : (
                      <div 
                        className="text-4xl font-bold text-gray-900 text-center mb-4"
                        style={{
                          fontFamily: textFormat.fontFamily,
                          fontSize: `${textFormat.fontSize * 1.5}px`,
                          fontWeight: textFormat.fontWeight,
                          fontStyle: textFormat.fontStyle,
                          textDecoration: textFormat.textDecoration,
                          textAlign: textFormat.textAlign as 'left' | 'center' | 'right',
                          color: textFormat.color
                        }}
                      >
                        {slides.find(s => s.id === currentSlide)?.title || "Slide Title"}
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 flex items-center justify-center">
                    {isEditing ? (
                      <Textarea 
                        className="text-xl text-gray-700 border-none resize-none bg-transparent leading-relaxed focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded"
                        value={convertHtmlToCleanText(slides.find(s => s.id === currentSlide)?.content || "")}
                        onChange={(e) => {
                          const cleanText = e.target.value;
                          const htmlContent = convertCleanTextToHtml(cleanText);
                          updateSlideContent(currentSlide, htmlContent);
                        }}
                        placeholder="Click to edit this slide content"
                        style={{
                          fontFamily: slides.find(s => s.id === currentSlide)?.style?.fontFamily || textFormat.fontFamily,
                          fontSize: `${slides.find(s => s.id === currentSlide)?.style?.fontSize || textFormat.fontSize}px`,
                          fontWeight: slides.find(s => s.id === currentSlide)?.style?.fontWeight || textFormat.fontWeight,
                          fontStyle: slides.find(s => s.id === currentSlide)?.style?.fontStyle || textFormat.fontStyle,
                          textDecoration: slides.find(s => s.id === currentSlide)?.style?.textDecoration || textFormat.textDecoration,
                          textAlign: (slides.find(s => s.id === currentSlide)?.style?.textAlign || textFormat.textAlign) as 'left' | 'center' | 'right',
                          color: slides.find(s => s.id === currentSlide)?.style?.color || textFormat.color,
                          minHeight: '280px',
                          maxHeight: '400px',
                          width: '100%'
                        }}
                      />
                    ) : (
                      <div 
                        className="text-xl text-gray-700 leading-relaxed"
                        style={{
                          fontFamily: slides.find(s => s.id === currentSlide)?.style?.fontFamily || textFormat.fontFamily,
                          fontSize: `${slides.find(s => s.id === currentSlide)?.style?.fontSize || textFormat.fontSize}px`,
                          fontWeight: slides.find(s => s.id === currentSlide)?.style?.fontWeight || textFormat.fontWeight,
                          fontStyle: slides.find(s => s.id === currentSlide)?.style?.fontStyle || textFormat.fontStyle,
                          textDecoration: slides.find(s => s.id === currentSlide)?.style?.textDecoration || textFormat.textDecoration,
                          textAlign: (slides.find(s => s.id === currentSlide)?.style?.textAlign || textFormat.textAlign) as 'left' | 'center' | 'right',
                          color: slides.find(s => s.id === currentSlide)?.style?.color || textFormat.color,
                          minHeight: '280px',
                          maxHeight: '400px',
                          width: '100%'
                        }}
                        dangerouslySetInnerHTML={{
                          __html: slides.find(s => s.id === currentSlide)?.content || "Click to edit this slide content"
                        }}
                      />
                    )}
                  </div>
                </div>

            {/* Slide Number */}
            <div className="absolute bottom-4 right-4 text-sm text-gray-400">
              {currentSlide} / {slides.length}
            </div>
          </div>
        </div>

        {/* Right Sidebar - AI Assistant */}
        <div className="w-80 bg-white border-l border-gray-200 flex-shrink-0">
          <Tabs defaultValue="chat" className="h-full flex flex-col">
            <TabsContent value="chat" className="flex-1 flex flex-col h-full">
              <ChatBot 
                context={{
                  presentationName,
                  currentSlide: {
                    id: currentSlide,
                    title: slides.find(s => s.id === currentSlide)?.title || "",
                    content: slides.find(s => s.id === currentSlide)?.content || ""
                  },
                  allSlides: slides.map(slide => ({
                    id: slide.id,
                    title: slide.title,
                    content: slide.content
                  }))
                }}
                className="h-full"
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default SlideEditor;
