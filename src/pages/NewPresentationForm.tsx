import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { Bot, FileText, Presentation, Clock, Upload, X, Plus, Trash2, GripVertical, Sparkles } from "lucide-react";
import { AIService } from "@/services/aiService";
export default function NewPresentationForm() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [documentType, setDocumentType] = useState("document");
  const [formData, setFormData] = useState({
    projectName: "",
    companyName: "",
    clientName: "",
    projectRequirements: "",
    industryType: "",
    teamMembers: [{
      role: "",
      experience: ""
    }],
    timeline: {
      value: 1,
      unit: "weeks"
    },
    referenceDocuments: []
  });
  const [suggestedFeatures, setSuggestedFeatures] = useState([{
     name: "User Authentication",
     description: "Secure user login and registration system with role-based access control",
     timeEstimate: "",
     selected: false
   }, {
     name: "Dashboard",
     description: "Interactive dashboard with real-time data visualization and analytics",
     timeEstimate: "",
     selected: false
   }, {
     name: "Reporting",
     description: "Comprehensive reporting system with export capabilities and scheduled reports",
     timeEstimate: "",
     selected: false
   }]);
  const [featureTimelines, setFeatureTimelines] = useState([]);
  const [overallTimeline, setOverallTimeline] = useState("");
  const [isGeneratingFeatures, setIsGeneratingFeatures] = useState(false);
  const [isGeneratingTimelines, setIsGeneratingTimelines] = useState(false);
  const [timeUnit, setTimeUnit] = useState("hours");
  
  // Presentation format state - will be dynamically generated
  const [presentationFormat, setPresentationFormat] = useState([]);
  const [isGeneratingFormat, setIsGeneratingFormat] = useState(false);
  const [newHeading, setNewHeading] = useState("");
  
  // Generate dynamic presentation format based on user inputs
  const generatePresentationFormat = async () => {
    if (!formData.projectRequirements || !formData.companyName || !formData.projectName) {
      toast.error("Please fill in project requirements, company name, and project name first");
      return;
    }

    setIsGeneratingFormat(true);
    try {
      // Create project data for AI analysis
      const projectDataForAI = {
        ...formData,
        teamMembers: formData.teamMembers,
        timeline: {
          value: parseInt(overallTimeline) || 12,
          unit: timeUnit
        },
        selectedFeatures: suggestedFeatures.filter(f => f.selected),
        documentType: "presentation_headings"
      };

      // Call AI service to generate custom headings
      const customHeadings = await AIService.generatePresentationHeadings(projectDataForAI);
      
      if (customHeadings && customHeadings.length > 0) {
        setPresentationFormat(customHeadings);
        toast.success(`Generated ${customHeadings.length} custom presentation headings based on your project!`);
      } else {
        // Fallback to basic headings if AI fails
        setPresentationFormat([
          "Project Introduction",
          "Business Case",
          "Technical Approach",
          "Implementation Plan",
          "Timeline & Milestones", 
          "Risk Assessment",
          "Financial Analysis",
          "Next Steps"
        ]);
        toast.info("Using default presentation structure");
      }
    } catch (error) {
      console.error("Error generating presentation format:", error);
      toast.error("Failed to generate custom headings. Please try again.");
      // Fallback headings
      setPresentationFormat([
        "Project Introduction", 
        "Business Case",
        "Technical Approach",
        "Implementation Plan",
        "Timeline & Milestones",
        "Risk Assessment",
        "Financial Analysis", 
        "Next Steps"
      ]);
    } finally {
      setIsGeneratingFormat(false);
    }
  };
  
  // Auto-generate presentation format when requirements are complete
  useEffect(() => {
    const shouldAutoGenerate = 
      formData.projectRequirements && 
      formData.companyName && 
      formData.projectName && 
      formData.industryType &&
      presentationFormat.length === 0 && 
      !isGeneratingFormat;
      
    if (shouldAutoGenerate) {
      // Small delay to allow user to see the form update
      const timer = setTimeout(() => {
        generatePresentationFormat();
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [formData.projectRequirements, formData.companyName, formData.projectName, formData.industryType]);

  // Calculate select all checkbox state
  const allFeaturesSelected = suggestedFeatures.length > 0 && suggestedFeatures.every(f => f.selected);
  const someFeaturesSelected = suggestedFeatures.some(f => f.selected);
  const validateStep1 = () => {
    return formData.projectName.trim() !== "" && formData.companyName.trim() !== "";
  };
  const validateStep2 = () => {
    return formData.projectRequirements.trim() !== "" && formData.industryType !== "";
  };
  const validateStep3 = () => {
    const validTeamMembers = formData.teamMembers.every(member => member.role.trim() !== "" && member.experience.trim() !== "");
    return validTeamMembers;
  };
  const validateStep4 = () => {
    return suggestedFeatures.filter(f => f.selected).length > 0 && documentType !== "";
  };
  const validateAndAnalyzeRequirements = async () => {
    if (!formData.projectRequirements.trim()) {
      toast.error("Please provide project requirements");
      return false;
    }

    try {
      setIsGeneratingFeatures(true);
      
      // AI validation and market analysis
      const validationResult = await AIService.validateAndAnalyzeRequirements(
        formData.projectRequirements, 
        formData.industryType,
        formData.referenceDocuments
      );
      
      if (!validationResult.isValid) {
        toast.error(`Requirements need improvement: ${validationResult.feedback}`);
        return false;
      }
      
      toast.success("Requirements validated successfully!");
      return true;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast.error(`Validation failed: ${errorMessage}`);
      return false;
    } finally {
      setIsGeneratingFeatures(false);
    }
  };

  const nextStep = async () => {
    if (step === 1 && !validateStep1()) {
      toast.error("Please fill in project and company name");
      return;
    }
    if (step === 2 && !validateStep2()) {
      const isValid = await validateAndAnalyzeRequirements();
      if (!isValid) return;
    }
    if (step === 3 && !validateStep3()) {
      toast.error("Please fill in all team member details");
      return;
    }
    if (step === 4 && !validateStep4()) {
      toast.error("Please select at least one feature and document type");
      return;
    }

    // If moving from step 4 to 5, generate AI timelines
    if (step === 4) {
      await generateAITimelines();
    }
    setStep(step + 1);
  };
  const prevStep = () => {
    setStep(step - 1);
  };
  const handleSubmit = async () => {
    const selectedFeatures = suggestedFeatures.filter(f => f.selected).map(f => f.name);

    // Prepare the data for AI service
    const projectData = {
      ...formData,
      selectedFeatures: selectedFeatures,
      documentType: documentType,
      customFormat: presentationFormat,
      currentPresentationFormat: presentationFormat // Pass current user-modified structure
    };
    try {
      // Call the AI service to generate the document
      const aiResponse = await AIService.generateDocument(projectData);
      console.log("AI Response:", aiResponse);

      // Navigate based on document type
      if (documentType === 'slides') {
        // For slides, navigate to slide editor with generated content
        const presentationId = Date.now().toString();
        navigate(`/slide-editor/${presentationId}`, {
          state: {
            content: aiResponse.content,
            title: `${formData.projectName} - Project Presentation`,
            projectData: projectData,
            documentType: documentType
          }
        });
      } else {
        // For documents, navigate to document editor
        navigate("/document-editor", {
          state: {
            content: aiResponse.content,
            title: `${formData.projectName} - Project Documentation`,
            projectData: projectData,
            documentType: documentType
          }
        });
      }
      toast.success(`${documentType === 'document' ? 'Document' : 'Presentation'} generated successfully!`);
    } catch (error: unknown) {
      console.error("Error generating document:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast.error(errorMessage || "Failed to generate document. Please check your API settings in Profile.");
    }
  };
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };
  const handleSelectChange = (name: string, value: string) => {
    setFormData({
      ...formData,
      [name]: value
    });
  };
  const handleTeamMemberChange = (index: number, field: string, value: string) => {
    const updatedTeamMembers = [...formData.teamMembers];
    updatedTeamMembers[index][field] = value;
    setFormData({
      ...formData,
      teamMembers: updatedTeamMembers
    });
  };
  const addTeamMember = () => {
    setFormData({
      ...formData,
      teamMembers: [...formData.teamMembers, {
        role: "",
        experience: ""
      }]
    });
  };
  const removeTeamMember = (index: number) => {
    const updatedTeamMembers = [...formData.teamMembers];
    updatedTeamMembers.splice(index, 1);
    setFormData({
      ...formData,
      teamMembers: updatedTeamMembers
    });
  };
  const toggleFeature = (index: number, checked: boolean) => {
    const updatedFeatures = [...suggestedFeatures];
    updatedFeatures[index] = {
      ...updatedFeatures[index],
      selected: checked
    };
    setSuggestedFeatures(updatedFeatures);
  };
  
  const handleSelectAll = (checked: boolean) => {
    const updatedFeatures = suggestedFeatures.map(feature => ({
      ...feature,
      selected: checked
    }));
    setSuggestedFeatures(updatedFeatures);
  };

  // Presentation format functions
  const addHeading = () => {
    if (newHeading.trim()) {
      setPresentationFormat([...presentationFormat, newHeading.trim()]);
      setNewHeading("");
    }
  };

  const removeHeading = (index: number) => {
    const updated = presentationFormat.filter((_, i) => i !== index);
    setPresentationFormat(updated);
  };

  const moveHeading = (fromIndex: number, toIndex: number) => {
    const updated = [...presentationFormat];
    const [removed] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, removed);
    setPresentationFormat(updated);
  };

  const updateHeading = (index: number, newValue: string) => {
    const updated = [...presentationFormat];
    updated[index] = newValue;
    setPresentationFormat(updated);
  };
  const generateAIFeatures = async () => {
    if (!formData.projectRequirements.trim() || !formData.industryType) {
      toast.error("Please fill in project requirements and industry type first");
      return;
    }
    setIsGeneratingFeatures(true);
    try {
      console.log("Generating AI features for:", {
        requirements: formData.projectRequirements,
        industry: formData.industryType,
        team: formData.teamMembers
      });
      const projectDataForAI = {
        ...formData,
        selectedFeatures: [], // Not needed for feature generation
        documentType: documentType
      };
      const aiFeatures = await AIService.suggestFeatures(projectDataForAI, timeUnit);
      console.log("AI Features received:", aiFeatures);
      if (aiFeatures.length > 0) {
        // Replace default features with AI suggestions, keeping any user selections
        const userSelectedFeatures = new Set(suggestedFeatures.filter(f => f.selected).map(f => f.name));
        const updatedFeatures = aiFeatures.map(feature => ({
          name: feature.name,
          description: feature.description,
          timeEstimate: (feature.timeEstimate as string) || (feature as Record<string, unknown>).timeline as string || (feature as Record<string, unknown>).estimate as string || "",
          selected: userSelectedFeatures.has(feature.name)
        }));

        // Add back any selected default features that weren't replaced
        const existingSelected = suggestedFeatures.filter(f => f.selected && !aiFeatures.some(ai => ai.name === f.name));
        setSuggestedFeatures([...updatedFeatures, ...existingSelected]);
        toast.success(`Generated ${aiFeatures.length} AI-powered feature suggestions!`);
      } else {
        toast.info("No additional features suggested by AI. Using default features.");
      }
    } catch (error: unknown) {
      console.error("AI Feature generation error:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast.error(`Failed to generate AI features: ${errorMessage || 'Please check your API settings in Profile.'}`);
    } finally {
      setIsGeneratingFeatures(false);
    }
  };
  const generateAITimelines = async () => {
    const selectedFeatures = suggestedFeatures.filter(f => f.selected).map(f => f.name);
    if (selectedFeatures.length === 0) {
      return;
    }
    setIsGeneratingTimelines(true);
    try {
      const projectData = {
        ...formData,
        selectedFeatures: selectedFeatures
      };
      const timelinesResponse = await AIService.generateFeatureTimelines(projectData);
      setFeatureTimelines(timelinesResponse.featureTimelines);
      setOverallTimeline(timelinesResponse.overallTimeline);
      toast.success("AI timeline analysis completed!");
    } catch (error) {
      toast.error("Failed to generate AI timelines. Please check your API settings in Profile.");
    } finally {
      setIsGeneratingTimelines(false);
    }
  };
  const handleTimelineChange = (field: string, value: string | number) => {
    setFormData({
      ...formData,
      timeline: {
        ...formData.timeline,
        [field]: value
      }
    });
  };
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    // Filter files by size (max 10MB)
    const validFiles = files.filter(file => file.size <= 10 * 1024 * 1024);
    if (validFiles.length !== files.length) {
      toast.error("Some files were too large (max 10MB)");
    }

    // Read file contents
    const documentsWithContent = await Promise.all(validFiles.map(async file => {
      const content = await readFileContent(file);
      return {
        name: file.name,
        size: file.size,
        type: file.type,
        content: content
      };
    }));
    setFormData({
      ...formData,
      referenceDocuments: [...formData.referenceDocuments, ...documentsWithContent]
    });
    if (validFiles.length > 0) {
      toast.success(`${validFiles.length} document(s) uploaded successfully`);
    }
  };
  const readFileContent = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = e => resolve(e.target?.result as string);
      reader.onerror = reject;
      reader.readAsText(file);
    });
  };
  const removeDocument = (index: number) => {
    const updatedDocs = [...formData.referenceDocuments];
    updatedDocs.splice(index, 1);
    setFormData({
      ...formData,
      referenceDocuments: updatedDocs
    });
    toast.success("Document removed");
  };
  const renderStep1 = () => <div className="space-y-6">
      <div>
        <Label htmlFor="projectName">Project Name</Label>
        <Input type="text" id="projectName" name="projectName" value={formData.projectName} onChange={handleChange} placeholder="Enter project name" />
      </div>
      <div>
        <Label htmlFor="companyName">Company Name</Label>
        <Input type="text" id="companyName" name="companyName" value={formData.companyName} onChange={handleChange} placeholder="Enter company name" />
      </div>
      <div>
        <Label htmlFor="clientName">Client Name (optional)</Label>
        <Input type="text" id="clientName" name="clientName" value={formData.clientName} onChange={handleChange} placeholder="Enter client name" />
      </div>
    </div>;
  const renderStep2 = () => <div className="space-y-6">
      <div>
        <Label htmlFor="projectRequirements">Project Requirements</Label>
        <Textarea id="projectRequirements" name="projectRequirements" value={formData.projectRequirements} onChange={handleChange} placeholder="Enter project requirements" />
      </div>
      <div>
        <Label htmlFor="industryType">Industry Type</Label>
        <Select value={formData.industryType} onValueChange={value => handleSelectChange("industryType", value)}>
          <SelectTrigger>
            <SelectValue placeholder="Select industry type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="eCommerce">eCommerce</SelectItem>
            <SelectItem value="Healthcare">Healthcare</SelectItem>
            <SelectItem value="Education">Education</SelectItem>
            <SelectItem value="Finance">Finance</SelectItem>
            <SelectItem value="Technology">Technology</SelectItem>
            <SelectItem value="Other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="border-t pt-6">
        <div className="flex items-center space-x-2 mb-4">
          <Upload className="h-5 w-5 text-gray-600" />
          <Label className="text-base font-medium">Reference Documents (Optional)</Label>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          Upload documents or client meeting transcripts to help AI generate better content
        </p>
        
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
          <input type="file" id="document-upload" multiple accept=".txt,.pdf,.doc,.docx" onChange={handleFileUpload} className="hidden" />
          <label htmlFor="document-upload" className="cursor-pointer">
            <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600">
              <span className="font-medium text-blue-600 hover:text-blue-500">
                Click to upload
              </span>{" "}
              or drag and drop
            </p>
            <p className="text-xs text-gray-500 mt-1">
              PDF, DOC, DOCX, TXT up to 10MB
            </p>
          </label>
        </div>
        
        {formData.referenceDocuments.length > 0 && <div className="mt-4 space-y-2">
            <Label className="text-sm font-medium">Uploaded Documents:</Label>
            {formData.referenceDocuments.map((doc, index) => <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <FileText className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">{doc.name}</span>
                  <span className="text-xs text-gray-500">
                    ({(doc.size / 1024).toFixed(1)} KB)
                  </span>
                </div>
                <Button variant="outline" size="sm" onClick={() => removeDocument(index)} className="h-8 w-8 p-0">
                  <X className="h-3 w-3" />
                </Button>
              </div>)}
          </div>}
      </div>
    </div>;
  const renderStep3 = () => <div className="space-y-6">
      <Label>Team Members</Label>
      {formData.teamMembers.map((member, index) => <div key={index} className="flex space-x-3 items-center">
          <div className="flex-1">
            <Label htmlFor={`role-${index}`}>Role</Label>
            <Input type="text" id={`role-${index}`} value={member.role} onChange={e => handleTeamMemberChange(index, "role", e.target.value)} placeholder="Enter role" />
          </div>
          <div className="flex-1">
            <Label htmlFor={`experience-${index}`}>Experience</Label>
            <Input type="text" id={`experience-${index}`} value={member.experience} onChange={e => handleTeamMemberChange(index, "experience", e.target.value)} placeholder="Enter experience level" />
          </div>
          {formData.teamMembers.length > 1 && <Button variant="outline" size="icon" onClick={() => removeTeamMember(index)}>
              <span className="sr-only">Remove</span>
              -
            </Button>}
        </div>)}
      <Button variant="secondary" onClick={addTeamMember}>
        Add Team Member
      </Button>

    </div>;
  const renderStep4 = () => <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">Project Configuration</h2>
        <p className="text-gray-600 mt-2">Select features and document type for your project</p>
      </div>

      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-600">
            Based on your project requirements: <span className="font-medium">{formData.industryType}</span>
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="timeUnit" className="text-sm">Time Unit:</Label>
            <Select value={timeUnit} onValueChange={setTimeUnit}>
              <SelectTrigger className="w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hours">Hours</SelectItem>
                <SelectItem value="days">Days</SelectItem>
                <SelectItem value="weeks">Weeks</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <Button onClick={generateAIFeatures} disabled={isGeneratingFeatures} variant="outline" size="sm" className="flex items-center gap-2">
          <Bot className="h-4 w-4" />
          {isGeneratingFeatures ? "Generating..." : "AI Suggestions"}
        </Button>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <div className="max-h-80 overflow-y-auto">
          <table className="w-full table-fixed">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="w-12 px-6 py-4 text-left">
                  <Checkbox 
                    id="select-all-features"
                    checked={allFeaturesSelected}
                    onCheckedChange={(checked) => handleSelectAll(checked as boolean)}
                    className={someFeaturesSelected && !allFeaturesSelected ? 'data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600' : ''}
                  />
                </th>
                <th className="w-1/4 px-6 py-4 text-left text-sm font-medium text-gray-900">Feature</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Description</th>
                <th className="w-40 px-6 py-4 text-left text-sm font-medium text-gray-900">Est. Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {suggestedFeatures.map((feature, index) => <tr key={index} className={`hover:bg-gray-50 transition-colors ${feature.selected ? 'bg-blue-50' : ''}`}>
                  <td className="px-6 py-4">
                    <Checkbox id={`feature-${index}`} checked={feature.selected} onCheckedChange={checked => toggleFeature(index, checked as boolean)} />
                  </td>
                  <td className="px-6 py-4">
                    <label htmlFor={`feature-${index}`} className="text-sm font-medium text-gray-900 cursor-pointer block">
                      {feature.name}
                    </label>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {feature.description}
                    </p>
                  </td>
                  <td className="w-40 px-6 py-4">
                    <span className="text-sm font-medium text-gray-900">
                      {feature.timeEstimate || '—'}
                    </span>
                  </td>
                </tr>)}
            </tbody>
          </table>
        </div>
      </div>

      {suggestedFeatures.filter(f => f.selected).length > 0 && <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="font-medium text-blue-900 mb-2">Selected Features:</h3>
          <div className="flex flex-wrap gap-2">
            {suggestedFeatures.filter(f => f.selected).map((feature, index) => <span key={index} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                  {feature.name}
                </span>)}
          </div>
        </div>}

      <div className="border-t pt-6">
        <Label className="text-base font-medium mb-4 block">Choose Document Type</Label>
        <RadioGroup value={documentType} onValueChange={setDocumentType} className="grid grid-cols-2 gap-4">
          <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
            <RadioGroupItem value="document" id="document" />
            <div className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-blue-600" />
              <div>
                <Label htmlFor="document" className="cursor-pointer font-medium">Document</Label>
                <p className="text-sm text-gray-500">Comprehensive project documentation</p>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
            <RadioGroupItem value="slides" id="slides" />
            <div className="flex items-center space-x-2">
              <Presentation className="h-5 w-5 text-green-600" />
              <div>
                <Label htmlFor="slides" className="cursor-pointer font-medium">Slides</Label>
                <p className="text-sm text-gray-500">Presentation format with structured slides</p>
              </div>
            </div>
          </div>
        </RadioGroup>
      </div>
    </div>;
  const renderStep5 = () => <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">Presentation Format & Timeline</h2>
        <p className="text-gray-600 mt-2">Customize your presentation structure and review project timeline</p>
      </div>

      {isGeneratingTimelines ? <div className="text-center py-8">
          <Bot className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Analyzing selected features and generating timelines...</p>
        </div> : <>
          {overallTimeline && <div className="bg-blue-50 p-6 rounded-lg mb-6">
              <div className="flex items-center space-x-2 mb-3">
                <Clock className="h-5 w-5 text-blue-600" />
                <h3 className="font-medium text-blue-900">Overall Project Timeline</h3>
              </div>
              <p className="text-blue-800">{overallTimeline}</p>
            </div>}

          {/* Mandatory Structure Reference */}
          <div className="border rounded-lg p-6 mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">!</span>
              </div>
              <h3 className="font-medium text-gray-900">Mandatory Structure Reference</h3>
            </div>
            <p className="text-gray-600 text-sm mb-4">
              These 8 core sections will always be included in your presentation structure:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                "1. Executive Summary",
                "2. Market Analysis & Industry Overview",
                "3. Solution Architecture & Technical Approach",
                "4. Implementation Strategy & Methodology",
                "5. Project Timeline & Milestones",
                "6. Risk Management & Mitigation",
                "7. Financial Analysis & ROI Projections",
                "8. Success Metrics & Performance Indicators"
              ].map((heading, index) => (
                <div key={index} className="flex items-center space-x-2 p-2 bg-white rounded border border-blue-100">
                  <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-medium text-blue-600">{index + 1}</span>
                  </div>
                  <span className="text-sm font-medium text-gray-700">{heading.split('. ')[1]}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-3 italic">
              AI will generate additional research-based headings (8 slides) specific to your project requirements.
            </p>
          </div>

          <div className="border rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Presentation className="h-5 w-5 text-green-600" />
                <h3 className="font-medium text-gray-900">Presentation Format</h3>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={generatePresentationFormat}
                disabled={isGeneratingFormat || !formData.projectRequirements || !formData.companyName || !formData.projectName}
                className="flex items-center space-x-2"
              >
                {isGeneratingFormat ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    <span>AI Generate Headings</span>
                  </>
                )}
              </Button>
            </div>
            <p className="text-gray-600 text-sm mb-4">
              {presentationFormat.length === 0 
                ? "Click 'AI Generate Headings' to create custom presentation structure based on your project requirements, or manually add headings below."
                : "Customize the headings and structure for your presentation. You can add, remove, edit, or rearrange sections."
              }
            </p>
            
            <div className="space-y-2 mb-4">
              {presentationFormat.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-blue-200 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                    <Presentation className="h-8 w-8 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Ready to Generate Your Presentation</h3>
                  <p className="text-gray-600 mb-6 max-w-md mx-auto">
                    AI will create custom headings tailored specifically to your project requirements and industry
                  </p>
                  <Button
                    onClick={generatePresentationFormat}
                    disabled={isGeneratingFormat || !formData.projectRequirements || !formData.companyName || !formData.projectName}
                    className="inline-flex items-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-700"
                    size="lg"
                  >
                    {isGeneratingFormat ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        <span>Generating Custom Headings...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-5 w-5" />
                        <span>Generate AI Headings</span>
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                  <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium text-gray-700">Presentation Structure ({presentationFormat.length} slides)</h4>
                      <div className="text-xs text-gray-500">Click to edit • Drag to reorder</div>
                    </div>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {presentationFormat.map((heading, index) => (
                      <div 
                        key={index} 
                        className="group flex items-center space-x-3 p-4 hover:bg-gray-50 transition-colors duration-150"
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData('text/plain', index.toString());
                        }}
                        onDragOver={(e) => {
                          e.preventDefault();
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          const dragIndex = parseInt(e.dataTransfer.getData('text/plain'));
                          if (dragIndex !== index) {
                            moveHeading(dragIndex, index);
                          }
                        }}
                      >
                        <div className="flex items-center space-x-2 flex-shrink-0">
                          <GripVertical className="h-4 w-4 text-gray-400 cursor-move group-hover:text-gray-600" />
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-blue-600">{index + 1}</span>
                          </div>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <Textarea
                            value={heading}
                            onChange={(e) => updateHeading(index, e.target.value)}
                            className="w-full border-0 bg-transparent resize-none focus:ring-0 focus:border-0 p-0 text-sm font-medium text-gray-900 placeholder-gray-400"
                            placeholder="Enter slide heading..."
                            rows={1}
                            style={{ minHeight: '24px' }}
                            onInput={(e) => {
                              const target = e.target as HTMLTextAreaElement;
                              target.style.height = 'auto';
                              target.style.height = target.scrollHeight + 'px';
                            }}
                          />
                        </div>

                        <div className="flex items-center space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => moveHeading(index, Math.max(0, index - 1))}
                            disabled={index === 0}
                            className="h-8 w-8 p-0 hover:bg-blue-200 disabled:opacity-50"
                            title="Move up"
                          >
                            <svg className="h-4 w-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                            </svg>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => moveHeading(index, Math.min(presentationFormat.length - 1, index + 1))}
                            disabled={index === presentationFormat.length - 1}
                            className="h-8 w-8 p-0 hover:bg-blue-200 disabled:opacity-50"
                            title="Move down"
                          >
                            <svg className="h-4 w-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeHeading(index)}
                            className="h-8 w-8 p-0 hover:bg-red-200 text-red-700"
                            title="Delete slide"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {presentationFormat.length > 0 && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                <div className="flex space-x-3">
                  <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                    <Plus className="h-4 w-4 text-gray-500" />
                  </div>
                  <div className="flex-1">
                    <Textarea
                      placeholder="Add new slide heading..."
                      value={newHeading}
                      onChange={(e) => setNewHeading(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          addHeading();
                        }
                      }}
                      className="w-full border-0 bg-transparent resize-none focus:ring-0 focus:border-0 p-0 text-sm placeholder-gray-500"
                      rows={1}
                      style={{ minHeight: '24px' }}
                      onInput={(e) => {
                        const target = e.target as HTMLTextAreaElement;
                        target.style.height = 'auto';
                        target.style.height = target.scrollHeight + 'px';
                      }}
                    />
                    <div className="mt-2 flex justify-end">
                      <Button 
                        onClick={addHeading} 
                        size="sm" 
                        disabled={!newHeading.trim()}
                        className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Slide
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </>}
    </div>;
  return <div className="container mx-auto max-w-7xl py-[20px] px-0">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Create New Presentation</h1>

      <div className="mb-6">
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
        {step === 4 && renderStep4()}
        {step === 5 && renderStep5()}
      </div>

      <div className="flex justify-between">
        {step > 1 && <Button variant="secondary" onClick={prevStep}>
            Previous
          </Button>}
        {step < 5 ? <Button onClick={nextStep} disabled={step === 4 && isGeneratingTimelines}>
            {step === 4 && isGeneratingTimelines ? "Generating Timelines..." : "Next"}
          </Button> : <Button onClick={handleSubmit}>
            Create {documentType === 'document' ? 'Document' : 'Presentation'}
          </Button>}
      </div>
    </div>;
}