import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import { api, invalidateQueries } from "../lib/api";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ArrowLeft, Upload, Download, Play, FileText, Trash2, CloudUpload, Check, Loader2, HelpCircle, AlertTriangle, Brain, Zap } from "lucide-react";
import type { SimulationConfig } from "../types/api";

interface SimulationPhase {
  id: string;
  name: string;
  description: string;
  status: "pending" | "active" | "completed";
}

const SIMULATION_PHASES: SimulationPhase[] = [
  { id: "opening", name: "Opening Statements", description: "Prosecution and defense present their cases", status: "pending" },
  { id: "evidence", name: "Evidence Presentation", description: "Analyzing evidence and witness testimonies", status: "pending" },
  { id: "cross", name: "Cross-Examination", description: "Challenging witness credibility and reliability", status: "pending" },
  { id: "closing", name: "Closing Arguments", description: "Final arguments and case summaries", status: "pending" },
  { id: "verdict", name: "Jury Deliberation", description: "Jury weighs evidence and reaches verdict", status: "pending" },
  { id: "opinion", name: "Judge Opinion", description: "Judicial analysis and reasoning", status: "pending" },
];

export default function CaseDetail() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [config, setConfig] = useState<Partial<SimulationConfig>>({
    model: "llama3.1:8b",
    strictness: 0.5,
  });
  const [simulationPhases, setSimulationPhases] = useState(SIMULATION_PHASES);
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(-1);

  const { data: caseData, isLoading } = useQuery({
    queryKey: ["/api/cases", id],
    queryFn: () => api.getCase(id!),
    enabled: !!id,
  });

  const { data: files } = useQuery({
    queryKey: ["/api/cases", id, "files"],
    queryFn: () => api.getCaseFiles(id!),
    enabled: !!id,
  });

  const { data: analysis, isLoading: analysisLoading } = useQuery({
    queryKey: ["/api/cases", id, "analysis"],
    queryFn: () => api.getAnalysis(id!),
    enabled: !!id && !!caseData?.rawText,
    retry: false,
  });

  const uploadMutation = useMutation({
    mutationFn: ({ file }: { file: File }) => api.uploadFile(id!, file),
    onSuccess: (data) => {
      invalidateQueries.case(id!);
      invalidateQueries.files(id!);
      toast({
        title: "File Uploaded",
        description: `Processed ${data.chars} characters into ${data.chunks} chunks.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload file. Please try again.",
        variant: "destructive",
      });
    },
  });

  const analysisMutation = useMutation({
    mutationFn: () => api.regenerateAnalysis(id!),
    onSuccess: () => {
      invalidateQueries.analysis(id!);
      toast({
        title: "Analysis Complete",
        description: "AI has analyzed the case documents.",
      });
    },
    onError: (error) => {
      toast({
        title: "Analysis Failed",
        description: "Failed to analyze case. Please try again.",
        variant: "destructive",
      });
    },
  });

  const simulationMutation = useMutation({
    mutationFn: (config: Partial<SimulationConfig>) => api.startSimulation(id!, config),
    onSuccess: () => {
      setCurrentPhaseIndex(0);
      const updatedPhases = [...simulationPhases];
      updatedPhases[0].status = "active";
      setSimulationPhases(updatedPhases);
      
      // Simulate progression through phases
      simulatePhaseProgression();
      
      toast({
        title: "AI Simulation Started",
        description: "AI-powered trial simulation is now running.",
      });
    },
    onError: (error) => {
      toast({
        title: "Simulation Failed",
        description: "Failed to start simulation. Please try again.",
        variant: "destructive",
      });
    },
  });

  const simulatePhaseProgression = () => {
    let phaseIndex = 0;
    const interval = setInterval(() => {
      setSimulationPhases(prev => {
        const updated = [...prev];
        if (phaseIndex > 0) {
          updated[phaseIndex - 1].status = "completed";
        }
        if (phaseIndex < updated.length) {
          updated[phaseIndex].status = "active";
          setCurrentPhaseIndex(phaseIndex);
        }
        return updated;
      });

      phaseIndex++;
      if (phaseIndex >= SIMULATION_PHASES.length) {
        clearInterval(interval);
        setSimulationPhases(prev => {
          const updated = [...prev];
          updated[updated.length - 1].status = "completed";
          return updated;
        });
        setCurrentPhaseIndex(-1);
        invalidateQueries.case(id!);
        toast({
          title: "Simulation Complete",
          description: "The trial simulation has finished. View the transcript for results.",
        });
      }
    }, 2000);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== "application/pdf" && file.type !== "text/plain") {
        toast({
          title: "Invalid File Type",
          description: "Please upload PDF or TXT files only.",
          variant: "destructive",
        });
        return;
      }
      
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast({
          title: "File Too Large",
          description: "Please upload files smaller than 10MB.",
          variant: "destructive",
        });
        return;
      }

      uploadMutation.mutate({ file });
    }
  };

  const handleStartSimulation = () => {
    if (!caseData?.chunks || caseData.chunks.length === 0) {
      toast({
        title: "No Documents",
        description: "Please upload case documents before starting simulation.",
        variant: "destructive",
      });
      return;
    }

    simulationMutation.mutate(config);
  };

  const handleExport = async () => {
    try {
      await api.exportTranscript(id!);
      toast({
        title: "Export Started",
        description: "Case transcript download has started.",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export transcript. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "simulating":
        return "bg-blue-100 text-blue-800";
      case "ready":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "completed":
        return "Completed";
      case "simulating":
        return "Simulating";
      case "ready":
        return "Ready for Simulation";
      default:
        return "Awaiting Documents";
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Skeleton className="h-8 w-64 mb-8" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Skeleton className="h-96" />
          <div className="lg:col-span-2">
            <Skeleton className="h-96" />
          </div>
        </div>
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Case Not Found</h2>
          <p className="text-gray-600 mt-2">The case you're looking for doesn't exist.</p>
          <Button onClick={() => navigate("/")} className="mt-4">
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const progress = currentPhaseIndex >= 0 ? ((currentPhaseIndex + 1) / SIMULATION_PHASES.length) * 100 : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Case Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/")}
                data-testid="button-back-dashboard"
              >
                <ArrowLeft size={16} />
              </Button>
              <div>
                <h2 className="font-playfair text-2xl font-semibold text-judicial-navy">
                  {caseData.title}
                </h2>
                <p className="text-slate-500 text-sm">
                  Created on {new Date(caseData.createdAt!).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Badge className={getStatusColor(caseData.status || "created")} data-testid={`status-${caseData.id}`}>
                {getStatusText(caseData.status || "created")}
              </Badge>
              <Button
                variant="outline"
                onClick={handleExport}
                disabled={!caseData.transcript || (Array.isArray(caseData.transcript) && caseData.transcript.length === 0)}
                data-testid="button-export-case"
              >
                <Download size={16} className="mr-2" />
                Export
              </Button>
              {caseData.status === "completed" && (
                <Button
                  onClick={() => navigate(`/case/${id}/transcript`)}
                  className="bg-judicial-gold text-white hover:bg-yellow-600"
                  data-testid="button-view-transcript"
                >
                  View Transcript
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Document Upload Section */}
        <div className="lg:col-span-1 space-y-6">
          {/* AI Analysis Section */}
          {caseData.rawText && (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-judicial-navy text-lg flex items-center">
                    <Brain className="mr-2" size={20} />
                    AI Analysis
                  </h3>
                  {caseData.rawText && !analysis && (
                    <Button
                      onClick={() => analysisMutation.mutate()}
                      disabled={analysisMutation.isPending}
                      size="sm"
                      variant="outline"
                      data-testid="button-generate-analysis"
                    >
                      <Zap size={14} className="mr-1" />
                      {analysisMutation.isPending ? "Analyzing..." : "Analyze"}
                    </Button>
                  )}
                </div>

                {analysisLoading || analysisMutation.isPending ? (
                  <div className="space-y-3">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                ) : analysis ? (
                  <div className="space-y-4">
                    {/* Case Summary */}
                    <div>
                      <h4 className="font-medium text-sm text-slate-700 mb-2">Summary</h4>
                      <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg">
                        {analysis.summary}
                      </p>
                    </div>

                    {/* Key Facts */}
                    {analysis.keyFacts && analysis.keyFacts.length > 0 && (
                      <div>
                        <h4 className="font-medium text-sm text-slate-700 mb-2">Key Facts</h4>
                        <ul className="text-sm text-slate-600 space-y-1">
                          {analysis.keyFacts.map((fact: string, index: number) => (
                            <li key={index} className="flex items-start">
                              <span className="w-2 h-2 bg-judicial-gold rounded-full mt-2 mr-2 flex-shrink-0"></span>
                              {fact}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Legal Issues */}
                    {analysis.legalIssues && analysis.legalIssues.length > 0 && (
                      <div>
                        <h4 className="font-medium text-sm text-slate-700 mb-2">Legal Issues</h4>
                        <div className="space-y-2">
                          {analysis.legalIssues.map((issue: string, index: number) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {issue}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Potential Arguments */}
                    {analysis.potentialArguments && (
                      <div className="grid grid-cols-1 gap-3">
                        <div>
                          <h4 className="font-medium text-sm text-red-700 mb-2">Prosecution Points</h4>
                          <ul className="text-xs text-slate-600 space-y-1">
                            {analysis.potentialArguments.prosecution?.map((arg: string, index: number) => (
                              <li key={index} className="flex items-start">
                                <span className="w-1.5 h-1.5 bg-red-500 rounded-full mt-1.5 mr-2 flex-shrink-0"></span>
                                {arg}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-medium text-sm text-blue-700 mb-2">Defense Points</h4>
                          <ul className="text-xs text-slate-600 space-y-1">
                            {analysis.potentialArguments.defense?.map((arg: string, index: number) => (
                              <li key={index} className="flex items-start">
                                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5 mr-2 flex-shrink-0"></span>
                                {arg}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <Brain className="mx-auto mb-2 text-slate-400" size={24} />
                    <p className="text-sm text-slate-500">
                      Upload documents to generate AI analysis
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Document Upload Card */}
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold text-judicial-navy text-lg mb-4">Case Documents</h3>
              
              {/* Document Format Help */}
              <Alert className="mb-4">
                <HelpCircle className="h-4 w-4" />
                <AlertTitle>Supported Document Formats</AlertTitle>
                <AlertDescription>
                  Upload PDF or TXT files containing legal documents, case materials, contracts, or court filings. 
                  Maximum file size: 10MB. PDFs must contain searchable text (not scanned images).
                </AlertDescription>
              </Alert>
              
              {/* File Upload Area */}
              <div
                className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-judicial-gold transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
                data-testid="upload-area"
              >
                <div className="space-y-3">
                  <div className="bg-slate-100 rounded-full p-4 mx-auto w-16 h-16 flex items-center justify-center">
                    {uploadMutation.isPending ? (
                      <Loader2 className="text-slate-500 animate-spin" size={24} />
                    ) : (
                      <CloudUpload className="text-slate-500" size={24} />
                    )}
                  </div>
                  <div>
                    <p className="text-slate-600 font-medium">
                      {uploadMutation.isPending ? "Processing Document..." : "Upload Legal Documents"}
                    </p>
                    <p className="text-slate-500 text-sm">
                      {uploadMutation.isPending ? "Extracting text and creating chunks..." : "PDF, TXT files • Max 10MB • Must contain readable text"}
                    </p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept=".pdf,.txt"
                    onChange={handleFileUpload}
                    disabled={uploadMutation.isPending}
                    data-testid="input-file-upload"
                  />
                </div>
              </div>

              {/* Uploaded Files List */}
              {files && files.length > 0 && (
                <div className="mt-4 space-y-2">
                  {files.map((file) => (
                    <div key={file.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <FileText className="text-blue-500" size={16} />
                        <span className="text-sm font-medium text-slate-700">{file.originalName}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className="text-xs bg-green-100 text-green-600">
                          Processed
                        </Badge>
                        <Button variant="ghost" size="sm" data-testid={`button-remove-file-${file.id}`}>
                          <Trash2 className="text-slate-400 hover:text-red-500" size={12} />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Document Stats */}
              {caseData.rawText && (
                <div className="mt-4 p-4 bg-slate-50 rounded-lg">
                  <div className="text-sm text-slate-600 space-y-1">
                    <div className="flex justify-between">
                      <span>Total Characters:</span>
                      <span className="font-medium">{caseData.rawText.length.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Text Chunks:</span>
                      <span className="font-medium">{caseData.chunks?.length || 0}</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Simulation Section */}
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-semibold text-judicial-navy text-lg flex items-center">
                  <Brain className="mr-2" size={20} />
                  AI-Powered Trial Simulation
                </h3>
                <Button
                  onClick={handleStartSimulation}
                  disabled={!caseData.chunks || caseData.chunks.length === 0 || simulationMutation.isPending || currentPhaseIndex >= 0}
                  className="bg-judicial-gold text-white hover:bg-yellow-600 disabled:opacity-50"
                  data-testid="button-start-simulation"
                >
                  <Play size={16} className="mr-2" />
                  {simulationMutation.isPending ? "Starting AI Simulation..." : "Start AI Simulation"}
                </Button>
              </div>

              {/* Simulation Info */}
              {(!caseData.chunks || caseData.chunks.length === 0) && (
                <Alert className="mb-6" variant="default">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Ready to Start</AlertTitle>
                  <AlertDescription>
                    Upload case documents above to begin your AI-powered courtroom simulation. The system will analyze your documents and generate realistic legal proceedings including opening statements, evidence presentation, cross-examination, closing arguments, and jury deliberation.
                  </AlertDescription>
                </Alert>
              )}

              {/* Simulation Configuration */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">AI Model</label>
                  <Select
                    value={config.model}
                    onValueChange={(value) => setConfig(prev => ({ ...prev, model: value }))}
                    data-testid="select-ai-model"
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="llama3.1:8b">Llama 3.1 8B (Default)</SelectItem>
                      <SelectItem value="llama3.1:70b">Llama 3.1 70B (Advanced)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Simulation Strictness</label>
                  <Select
                    value={config.strictness?.toString()}
                    onValueChange={(value) => setConfig(prev => ({ ...prev, strictness: parseFloat(value) }))}
                    data-testid="select-strictness"
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0.3">Conservative</SelectItem>
                      <SelectItem value="0.5">Balanced</SelectItem>
                      <SelectItem value="0.7">Aggressive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Simulation Progress */}
              {currentPhaseIndex >= 0 && (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-700">Simulation Progress</span>
                    <span className="text-sm text-slate-500">{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} className="mb-4" />
                </div>
              )}

              {(currentPhaseIndex >= 0 || caseData.status === "completed") && (
                <div className="space-y-4">
                  {simulationPhases.map((phase, index) => (
                    <div
                      key={phase.id}
                      className={`flex items-center space-x-4 p-4 border rounded-lg transition-colors ${
                        phase.status === "active" ? "border-blue-300 bg-blue-50" : "border-slate-200"
                      }`}
                      data-testid={`phase-${phase.id}`}
                    >
                      <div className="flex-shrink-0">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          phase.status === "completed" 
                            ? "bg-green-100" 
                            : phase.status === "active" 
                            ? "bg-blue-100" 
                            : "bg-slate-100"
                        }`}>
                          {phase.status === "completed" ? (
                            <Check className="text-green-600" size={16} />
                          ) : phase.status === "active" ? (
                            <Loader2 className="text-blue-600 animate-spin" size={16} />
                          ) : (
                            <span className="text-slate-400 text-sm">{index + 1}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-slate-700">{phase.name}</h4>
                        <p className="text-slate-500 text-sm">{phase.description}</p>
                      </div>
                      <div className="text-sm font-medium">
                        {phase.status === "completed" && <span className="text-green-600">Complete</span>}
                        {phase.status === "active" && <span className="text-blue-600">In Progress</span>}
                        {phase.status === "pending" && <span className="text-slate-400">Pending</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
